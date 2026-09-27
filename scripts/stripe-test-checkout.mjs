/**
 * Optional Stripe test-mode smoke check.
 *
 * Requires STRIPE_SECRET_KEY=sk_test_..., STRIPE_PRO_PRICE_ID, STRIPE_ELITE_PRICE_ID.
 * Creates Checkout Sessions only — it does not complete a payment.
 */
import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY || "";
if (!key.includes("sk_test_")) {
  console.log("NO_TEST_KEY");
  console.log("Stripe test key not present. Run locally after setting:");
  console.log("  export STRIPE_SECRET_KEY=sk_test_...");
  console.log("  export STRIPE_PRO_PRICE_ID=price_...");
  console.log("  export STRIPE_ELITE_PRICE_ID=price_...");
  console.log("  node scripts/stripe-test-checkout.mjs");
  console.log("Expected: two checkout.session objects, mode payment (Pro) and subscription (Elite).");
  console.log("Then pay with 4242… in Checkout and confirm User.tier is PRO / ELITE.");
  process.exit(0);
}

const stripe = new Stripe(key);
const origin = process.env.NEXTAUTH_URL || "http://localhost:3000";

try {
  const pro = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: process.env.STRIPE_PRO_PRICE_ID, quantity: 1 }],
    success_url: `${origin}/account?upgraded=1`,
    cancel_url: `${origin}/account?cancelled=1`,
  });
  const elite = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: process.env.STRIPE_ELITE_PRICE_ID, quantity: 1 }],
    success_url: `${origin}/account?upgraded=1`,
    cancel_url: `${origin}/account?cancelled=1`,
  });

  console.log(JSON.stringify({
    pro: { id: pro.id, mode: pro.mode, url: Boolean(pro.url) },
    elite: { id: elite.id, mode: elite.mode, url: Boolean(elite.url) },
  }, null, 2));

  if (pro.mode !== "payment" || elite.mode !== "subscription" || !pro.url || !elite.url) {
    process.exit(1);
  }
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  if (/Invalid API Key|No such price/i.test(message)) {
    console.log("NO_VALID_TEST_KEY");
    console.log("A STRIPE_SECRET_KEY is set but Stripe rejected it (placeholder or expired).");
    console.log("Set a real sk_test_ key and price ids, then:");
    console.log("  node --env-file=.env scripts/stripe-test-checkout.mjs");
    console.log("Expected: Pro session mode=payment, Elite session mode=subscription.");
    console.log("Pay with 4242… and confirm User.tier becomes PRO / ELITE via the webhook.");
    process.exit(0);
  }
  throw err;
}
