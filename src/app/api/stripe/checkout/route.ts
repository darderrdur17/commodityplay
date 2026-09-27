import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getStripe, getStripePrices, createOrRetrieveCustomer } from "@/lib/stripe";
import { isCheckoutConfigured } from "@/lib/payments";
import { RATE_LIMITS, checkRateLimit, getClientIp, rateLimitKey, rateLimitResponse } from "@/lib/rate-limit";
import { z } from "zod";

const schema = z.object({
  plan: z.enum(["pro", "elite"]),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = await checkRateLimit(
    rateLimitKey("stripe-checkout", getClientIp(req), session.user.id),
    RATE_LIMITS.stripeCheckout
  );
  if (!limit.allowed) return rateLimitResponse(limit);

  if (!isCheckoutConfigured()) {
    return NextResponse.json(
      { error: "Payments are not live yet. Checkout will open when paid files are ready." },
      { status: 503 }
    );
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  try {
    const { plan } = parsed.data;
    const userId = session.user.id;
    const email = session.user.email!;

    const stripe = getStripe();
    const prices = getStripePrices();
    const customerId = await createOrRetrieveCustomer(userId, email);
    const origin = req.headers.get("origin") || process.env.NEXTAUTH_URL;

    // Pro is a ONE-TIME purchase (SGD 99) → Checkout must run in "payment" mode.
    // Elite is a RECURRING monthly subscription (SGD 299/mo) → "subscription" mode.
    const isElite = plan === "elite";
    const priceId = isElite ? prices.ELITE_MONTHLY : prices.PRO_MONTHLY;
    const mode: "payment" | "subscription" = isElite ? "subscription" : "payment";

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/account?upgraded=1`,
      cancel_url: `${origin}/account?cancelled=1`,
      metadata: { userId, plan },
      // Mode-specific payloads. Both carry server-set metadata so the webhook can
      // identify the member without trusting anything supplied by the browser.
      ...(isElite
        ? { subscription_data: { metadata: { userId, plan } } }
        : { payment_intent_data: { metadata: { userId, plan } } }),
      allow_promotion_codes: true,
      billing_address_collection: "required",
      customer_update: { address: "auto", name: "auto" },
      // Saving a card only makes sense for the recurring Elite plan.
      ...(isElite
        ? {
            saved_payment_method_options: { payment_method_save: "enabled" },
          }
        : {}),
      payment_method_types: ["card"],
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("[stripe/checkout]", err);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
