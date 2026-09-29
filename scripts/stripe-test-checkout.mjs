/**
 * Optional Stripe test-mode smoke check.
 *
 * Requires STRIPE_SECRET_KEY=sk_test_..., the four STRIPE_PRICE_* ids and (for the term
 * sessions) the eight STRIPE_COUPON_* ids.
 * Creates Checkout Sessions only — it does not complete a payment.
 */
import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY || "";
if (!key.includes("sk_test_")) {
  console.log("NO_TEST_KEY");
  console.log("Stripe test key not present. Run locally after setting:");
  console.log("  export STRIPE_SECRET_KEY=sk_test_...");
  console.log("  export STRIPE_PRICE_CAREER_PRO=price_...");
  console.log("  export STRIPE_PRICE_CAREER_ELITE=price_...");
  console.log("  export STRIPE_PRICE_SALES_PRO=price_...");
  console.log("  export STRIPE_PRICE_SALES_ELITE=price_...");
  console.log("  export STRIPE_COUPON_CAREER_PRO_TERM6=...");
  console.log("  export STRIPE_COUPON_CAREER_PRO_TERM12=...");
  console.log("  node scripts/stripe-test-checkout.mjs");
  console.log("Expected: 12 checkout.session objects, all mode=subscription.");
  console.log("Then pay with 4242… in Checkout and confirm User.tier is PRO / ELITE.");
  process.exit(0);
}

const stripe = new Stripe(key);
const origin = process.env.NEXTAUTH_URL || "http://localhost:3000";

const TRACKS = ["CAREER", "SALES"];
const TIERS = ["PRO", "ELITE"];
const TERMS = ["monthly", "term6", "term12"];

const prices = {
  CAREER_PRO: process.env.STRIPE_PRICE_CAREER_PRO,
  CAREER_ELITE: process.env.STRIPE_PRICE_CAREER_ELITE,
  SALES_PRO: process.env.STRIPE_PRICE_SALES_PRO,
  SALES_ELITE: process.env.STRIPE_PRICE_SALES_ELITE,
};

try {
  const results = [];
  let failures = 0;

  for (const track of TRACKS) {
    for (const tier of TIERS) {
      for (const term of TERMS) {
        const price = prices[`${track}_${tier}`];
        const coupon =
          term === "monthly"
            ? null
            : process.env[`STRIPE_COUPON_${track}_${tier}_${term.toUpperCase()}`] || null;

        if (!price) {
          console.log(`SKIP ${track}_${tier}_${term}: no price id configured`);
          failures++;
          continue;
        }
        if (term !== "monthly" && !coupon) {
          console.log(`SKIP ${track}_${tier}_${term}: no coupon configured`);
          failures++;
          continue;
        }

        const session = await stripe.checkout.sessions.create({
          // 🔴 Every plan is a subscription now — there is no one-time product left.
          mode: "subscription",
          line_items: [{ price, quantity: 1 }],
          success_url: `${origin}/account?upgraded=1`,
          cancel_url: `${origin}/account?cancelled=1`,
          metadata: { plan: tier, term, track },
          subscription_data: { metadata: { plan: tier, term, track } },
          ...(coupon ? { discounts: [{ coupon }] } : {}),
          // Mirrors the route: promo codes are disabled whenever a term coupon is attached.
          allow_promotion_codes: coupon ? false : true,
        });

        const ok =
          session.mode === "subscription" &&
          Boolean(session.url) &&
          (term === "monthly" || (session.total_details?.amount_discount ?? 0) > 0 ||
            Boolean(session.discounts?.length));

        if (!ok) failures++;
        results.push({
          plan: `${track}_${tier}_${term}`,
          id: session.id,
          mode: session.mode,
          url: Boolean(session.url),
          discountCents: session.total_details?.amount_discount ?? 0,
          ok,
        });
      }
    }
  }

  console.log(JSON.stringify(results, null, 2));
  if (failures > 0) process.exit(1);
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  if (/Invalid API Key|No such price|No such coupon/i.test(message)) {
    console.log("NO_VALID_TEST_KEY");
    console.log("A STRIPE_SECRET_KEY is set but Stripe rejected it (placeholder or expired).");
    console.log("Set a real sk_test_ key, the four price ids and the coupon ids, then:");
    console.log("  node --env-file=.env scripts/stripe-test-checkout.mjs");
    console.log("Expected: 12 sessions, all mode=subscription, discount > 0 for term6/term12.");
    console.log("Pay with 4242… and confirm User.tier becomes PRO / ELITE via the webhook.");
    process.exit(0);
  }
  throw err;
}
