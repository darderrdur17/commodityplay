import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getStripe,
  resolveStripePriceId,
  getStripeCoupon,
  createOrRetrieveCustomer,
} from "@/lib/stripe";
import { isCheckoutConfigured } from "@/lib/payments";
import { RATE_LIMITS, checkRateLimit, getClientIp, rateLimitKey, rateLimitResponse } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { PlanTier, PlanTrack } from "@/data/pricing-shared";

const schema = z.object({
  plan: z.enum(["pro", "elite"]),
  term: z.enum(["monthly", "12"]).default("monthly"),
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
    const { plan, term } = parsed.data;
    const userId = session.user.id;
    const email = session.user.email!;
    const tier: PlanTier = plan === "elite" ? "ELITE" : "PRO";

    // 🔴 Track is NEVER taken from the browser — it decides the price. A CAREER member
    // browsing /?track=sales must be charged the CAREER price, not the SALES price.
    const row = await prisma.user.findUnique({
      where: { id: userId },
      select: { track: true },
    });
    const track: PlanTrack = row?.track === "SALES" ? "SALES" : "CAREER";

    const stripe = getStripe();
    const priceId = resolveStripePriceId(track, tier);
    const customerId = await createOrRetrieveCustomer(userId, email);
    const origin = req.headers.get("origin") || process.env.NEXTAUTH_URL;

    // Per-plan 503: a missing TERM coupon disables ONLY that term. Monthly stays live.
    const couponId = getStripeCoupon(track, tier, term);
    if (term !== "monthly" && !couponId) {
      console.error("[stripe/checkout] term requested but coupon not configured", {
        track,
        tier,
        term,
      });
      return NextResponse.json(
        { error: "This plan is not available yet. Please choose monthly." },
        { status: 503 }
      );
    }

    // 🔴 First-commitment gate. The discount is an acquisition incentive: a member whose
    // subscription has already ended must NOT regain it by resubscribing.
    // status:"all" + an explicit filter is deliberate — Stripe's status:"ended" filter is
    // inconsistent across API versions, the explicit set cannot drift.
    //
    // Failure-tolerant on purpose: if this extra Stripe call errors we degrade to "no
    // discount" rather than 500-ing a checkout the member is otherwise entitled to.
    let discount: { coupon: string } | null = null;
    if (couponId) {
      try {
        const prior = await stripe.subscriptions.list({
          customer: customerId,
          status: "all",
          limit: 100,
        });
        const ENDED = new Set(["canceled", "unpaid", "incomplete_expired"]);
        if (!prior.data.some((s) => ENDED.has(s.status))) discount = { coupon: couponId };
      } catch (err) {
        console.error("[stripe/checkout] prior-subscription lookup failed; no discount", err);
      }
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      // 🔴 Every plan is a subscription now — there is no one-time product left.
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/account?upgraded=1`,
      cancel_url: `${origin}/account?cancelled=1`,
      metadata: { userId, plan: tier, term, track },
      subscription_data: { metadata: { userId, plan: tier, term, track } },
      // The coupon's `duration` is deliberately NEVER read here — whether the discount
      // persists forever or only for the first term is a Stripe Dashboard setting.
      // 🔴 Stripe rejects `discounts` and `allow_promotion_codes` in the SAME request —
      // "You may only specify one of these parameters" — even when the latter is `false`.
      // So when a term coupon is attached the promo-code field must be omitted entirely.
      // Monthly (no coupon) still allows a promo code.
      ...(discount ? { discounts: [discount] } : { allow_promotion_codes: true }),
      billing_address_collection: "required",
      customer_update: { address: "auto", name: "auto" },
      // Now for every plan, not just Elite: every plan is recurring.
      saved_payment_method_options: { payment_method_save: "enabled" },
      payment_method_types: ["card"],
    }, {
      // Managed Payments requires API version 2025-03-31.basil or later for Checkout
      // Session creation. Deliberately a PER-REQUEST option: the shared getStripe()
      // client and the webhook client stay on Acacia, because Basil removes
      // invoice.lines[].price, which the webhook's receipt handler reads.
      apiVersion: "2025-03-31.basil",
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("[stripe/checkout]", err);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
