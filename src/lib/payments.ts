/**
 * Whether paid checkout is open, and whether it is actually *chargeable*.
 *
 * Two separate questions, deliberately:
 *
 *  - `isPaymentsLive()` — is this build allowed to show paid CTAs at all? Reads
 *    `NEXT_PUBLIC_PAYMENTS_ENABLED`, which Next inlines at BUILD time. Editing it in
 *    Vercel does nothing until a redeploy. Client components call this directly, so
 *    it must stay free of any import that would drag the Stripe SDK into the bundle.
 *
 *  - `isCheckoutConfigured()` — server-side: given the intent, could a checkout
 *    actually succeed right now? This is the gate the API routes use.
 *
 * ⚠️ Why the second one checks prices and not just the key. Until this change it was
 * `isPaymentsLive() && Boolean(STRIPE_SECRET_KEY)`. With the flag true and a key
 * present, a deployment with no `STRIPE_PRICE_*` vars passed the gate and then threw
 * inside price resolution, so the member saw a generic "Checkout failed" 503 from a
 * path that had never been configured. Worse, it meant a launch could go live by
 * adding price vars alone — the flag was already true — with no deliberate flip.
 *
 * Now "configured" means every prerequisite is present, so a half-finished launch
 * fails CLOSED with an honest message instead of pretending to try.
 */

/**
 * The eight price variables a chargeable configuration requires.
 *
 * All eight, not four: `/pricing` sells both a monthly and a 12-month term, and the
 * annual term resolves through its own vars (`getStripeAnnualPrices`). A launch with
 * only the monthly four would take the money for monthly and 503 every annual
 * purchase — the failure would surface in front of a paying member, at the worst
 * possible moment. Requiring all eight makes the gate either fully open or shut.
 *
 * These names MUST match `getStripePrices` / `getStripeAnnualPrices` in
 * `src/lib/stripe.ts`; the audit harness asserts that they do, because a rename on
 * one side only would silently disable checkout.
 */
export const REQUIRED_PRICE_VARS = [
  "STRIPE_PRICE_CAREER_PRO",
  "STRIPE_PRICE_CAREER_ELITE",
  "STRIPE_PRICE_SALES_PRO",
  "STRIPE_PRICE_SALES_ELITE",
  "STRIPE_PRICE_CAREER_PRO_ANNUAL",
  "STRIPE_PRICE_CAREER_ELITE_ANNUAL",
  "STRIPE_PRICE_SALES_PRO_ANNUAL",
  "STRIPE_PRICE_SALES_ELITE_ANNUAL",
] as const;

export type PaymentsReadiness = {
  /** The explicit intent flag. False means "do not sell", whatever else is set. */
  live: boolean;
  hasSecret: boolean;
  /** Names only — never values. Safe to log. */
  missingPriceVars: string[];
  /** True only when a checkout could genuinely complete. */
  ready: boolean;
};

/**
 * Pure, so the audit harness can drive it with any environment.
 *
 * Defaults to `process.env`; pass a literal to test a configuration without mutating
 * the real one.
 */
export function paymentsReadiness(
  env: Record<string, string | undefined> = process.env
): PaymentsReadiness {
  const live = env.NEXT_PUBLIC_PAYMENTS_ENABLED === "true";
  const hasSecret = Boolean(env.STRIPE_SECRET_KEY);
  const missingPriceVars = REQUIRED_PRICE_VARS.filter((key) => !env[key]);
  return {
    live,
    hasSecret,
    missingPriceVars,
    ready: live && hasSecret && missingPriceVars.length === 0,
  };
}

/**
 * Is this build allowed to sell?
 *
 * ⚠️ The env access is written out LITERALLY on purpose. Next replaces
 * `process.env.NEXT_PUBLIC_*` with its value at build time, and it only does that for
 * a static member expression — routing this through a helper or a destructured
 * `process.env` leaves the lookup dynamic and the client bundle gets `undefined`.
 */
export function isPaymentsLive(): boolean {
  return process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === "true";
}

/** Server-side gate for the checkout and billing-portal routes. */
export function isCheckoutConfigured(): boolean {
  return paymentsReadiness().ready;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Member-facing status copy
 *
 * Paid checkout is not open while the Stripe integration is still being finished,
 * and the public status for that is **"Coming soon"** — not "on hold", not "not
 * live yet", not "before go-live". Those are internal engineering words; a member
 * reading them cannot tell whether they did something wrong.
 *
 * Kept here, in one place, because the same status is stated on four surfaces
 * (account billing, the checkout page, and two API error responses). Four copies of
 * one sentence is how a status ends up contradicting itself, so every surface reads
 * these constants and the audit harness asserts none of them is re-typed inline.
 *
 * ⚠️ No vendor names in member-facing copy. "We're still setting up card payments"
 * is what a member needs to know; which processor is behind it is not their problem.
 * ⚠️ No import may be added to this module — it is imported by client components and
 * must never pull the Stripe SDK into the browser bundle.
 * ──────────────────────────────────────────────────────────────────────────── */

/** The status label itself. Short, and the same word everywhere. */
export const PAYMENTS_STATUS_LABEL = "Coming soon";

export const PAYMENTS_STATUS_COPY = {
  /** Sub-line under the Billing section heading on /account. */
  accountSubtitle: "View your plan here. Card checkout is coming soon.",

  /** Inline note on /account while checkout is closed. */
  accountNote:
    "Paid plans are coming soon. You can still review your tier and billing status below.",

  /** Headline of the closed-checkout block on /checkout. */
  checkoutTitle: "Paid plans are coming soon",

  /** Body of that block. Offers the thing that DOES work today. */
  checkoutBody:
    "We're still setting up card payments. In the meantime, talk to us and we'll set you up directly.",

  /** 503 from POST /api/stripe/checkout while closed. */
  checkoutApiError: "Payments are coming soon. Card checkout is not available yet.",

  /** 503 from POST /api/stripe/portal while closed. */
  portalApiError: "Payments are coming soon.",
} as const;

