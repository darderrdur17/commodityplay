import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getStripe, getStripePrices, createOrRetrieveCustomer } from "@/lib/stripe";
import { z } from "zod";

const schema = z.object({
  plan: z.enum(["pro", "elite"]),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Payments are not configured" }, { status: 503 });
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

    const priceId = plan === "elite" ? prices.ELITE_MONTHLY : prices.PRO_MONTHLY;
    const mode = "subscription";

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/account?upgraded=1`,
      cancel_url: `${origin}/account?cancelled=1`,
      metadata: { userId, plan },
      subscription_data: { metadata: { userId } },
      allow_promotion_codes: true,
      billing_address_collection: "required",
      customer_update: { address: "auto", name: "auto" },
      saved_payment_method_options: { payment_method_save: "enabled" },
      payment_method_types: ["card"],
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("[stripe/checkout]", err);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
