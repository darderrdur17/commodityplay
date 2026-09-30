/**
 * Pricing — the SINGLE SOURCE OF TRUTH for every price the app displays.
 *
 * Four tiers x three terms. All amounts are USD, and every other price string in
 * the app is DERIVED from this file, so changing a price happens in exactly one
 * place. Before this, four independent constants advertised four different
 * numbers (SGD 59 / 99 / 99 / 199) while the checkout code charged a fifth —
 * a member could be billed a different amount than the page they clicked.
 *
 * ---------------------------------------------------------------------------
 * TERM ARITHMETIC — why both long plans land on the SAME monthly rate
 * ---------------------------------------------------------------------------
 *   monthly   pay 1  month,  get 1   month  -> full base rate
 *   6-month   pay 6  months, get 7   months -> 6/7   of base, per month
 *   12-month  pay 12 months, get 14  months -> 12/14 of base, per month
 *
 * `6/7 === 12/14`, so the discount is ALWAYS exactly 1/7 (14.29%) and the two
 * long plans have an identical normalised monthly rate. They differ ONLY in how
 * long the discount nominally lasts (7 cycles vs 14).
 *
 * Consequence worth knowing: because the rates are equal, the 12-month plan
 * strictly dominates the 6-month plan unless the discount is time-limited to the
 * stated term. See `PLAN_TERMS` — the term length is data here, not logic, so the
 * product decision can be revisited without touching this arithmetic.
 */

export const CURRENCY = "USD" as const;

export type PlanTrack = "CAREER" | "SALES";
export type PlanTier = "PRO" | "ELITE";
export type PlanTerm = "monthly" | "6" | "12";
export type BillingCadence = "monthly" | "annual";

/** `CAREER_PRO`, `SALES_ELITE`, … */
export type PlanKey = `${PlanTrack}_${PlanTier}`;

/**
 * Monthly list price, in whole USD, per tier.
 *
 * Note `SALES_PRO` (39) equals `CAREER_ELITE` (39) — deliberate, but it means the
 * tier can no longer be inferred from the amount charged. Always resolve the
 * tier from the price ID, never from a total.
 */
export const PLAN_BASE_USD: Record<PlanKey, number> = {
  CAREER_PRO: 19,
  CAREER_ELITE: 39,
  SALES_PRO: 39,
  SALES_ELITE: 59,
};

/**
 * The three purchasable terms. `accessMonths` is how long the member gets access;
 * `paidMonths` is how many months they are actually billed for. The free months
 * are the difference.
 */
export const PLAN_TERMS: Record<
  PlanTerm,
  { label: string; shortLabel: string; paidMonths: number; accessMonths: number }
> = {
  monthly: {
    label: "Monthly",
    shortLabel: "Monthly",
    paidMonths: 1,
    accessMonths: 1,
  },
  "6": {
    label: "6 months + 1 free",
    shortLabel: "6 + 1 free",
    paidMonths: 6,
    accessMonths: 7,
  },
  "12": {
    label: "12 months + 2 free",
    shortLabel: "12 + 2 free",
    paidMonths: 12,
    accessMonths: 14,
  },
};

export const PLAN_TERM_ORDER: PlanTerm[] = ["monthly", "6", "12"];

/** Normalised monthly rate in USD, rounded to whole cents. */
export function monthlyRateUsd(
  track: PlanTrack,
  tier: PlanTier,
  term: PlanTerm
): number {
  const base = PLAN_BASE_USD[`${track}_${tier}`];
  const { paidMonths, accessMonths } = PLAN_TERMS[term];
  return Math.round(((base * paidMonths) / accessMonths) * 100) / 100;
}

/** Total charged over a full term, in USD. */
export function termTotalUsd(
  track: PlanTrack,
  tier: PlanTier,
  term: PlanTerm
): number {
  const base = PLAN_BASE_USD[`${track}_${tier}`];
  const { paidMonths } = PLAN_TERMS[term];
  return base * paidMonths;
}

/**
 * Stripe coupon `amount_off`, in CENTS, for a long-term plan.
 *
 * Equal to exactly one seventh of the base price — `19.00 / 7 = 2.714…` -> 271.
 * `amount_off` is used rather than `percent_off` so the monthly charge lands on a
 * clean cent (16.29) instead of a rounded percentage.
 */
export function termDiscountCents(track: PlanTrack, tier: PlanTier): number {
  const base = PLAN_BASE_USD[`${track}_${tier}`];
  return Math.round((base * 100) / 7);
}

/** `USD 19` / `USD 16.29` — whole amounts lose the trailing `.00`. */
export function priceLabel(amount: number): string {
  return `${CURRENCY} ${Number.isInteger(amount) ? amount : amount.toFixed(2)}`;
}

/** `USD 19/month` — the canonical label used across the landing pages. */
export function priceLabelPerMonth(amount: number): string {
  return `${priceLabel(amount)}/month`;
}

/** `$19.00` / `$16.29` — for prose and stat blocks. */
export function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: CURRENCY,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/* -------------------------------------------------------------------------- */
/* Copy                                                                        */
/* -------------------------------------------------------------------------- */

/** Career track subscription copy — landing, in-app gates, and upgrade prompts */
export const UPGRADE_TO_ACCESS = "Unlock" as const;

export const FOR_PRO_ACCESS = "For Pro access" as const;
export const FOR_ELITE_ACCESS = "For Elite access" as const;

export function tierAccessLabel(requiredTier: "PRO" | "ELITE"): string {
  return requiredTier === "PRO" ? FOR_PRO_ACCESS : FOR_ELITE_ACCESS;
}

/*
 * The four `*_SUBSCRIPTION` objects below are DERIVED from `PLAN_BASE_USD`.
 * Do not reintroduce a literal price here — that is exactly how the app ended up
 * advertising four different numbers.
 */

export const PRO_SUBSCRIPTION = {
  price: priceLabel(PLAN_BASE_USD.CAREER_PRO),
  period: "per month",
  note: "cancel anytime",
  label: priceLabelPerMonth(PLAN_BASE_USD.CAREER_PRO),
  fullNote: "Unlock the full playbook, resume templates, career roadmap, and more.",
  cta: UPGRADE_TO_ACCESS,
  unlockCta: UPGRADE_TO_ACCESS,
} as const;

export const ELITE_SUBSCRIPTION = {
  price: priceLabel(PLAN_BASE_USD.CAREER_ELITE),
  period: "per month",
  note: "cancel anytime",
  label: priceLabelPerMonth(PLAN_BASE_USD.CAREER_ELITE),
  fullNote: "Unlock case studies, Mentor Connect, the Desk Channel, and job openings.",
  cta: UPGRADE_TO_ACCESS,
  unlockCta: UPGRADE_TO_ACCESS,
} as const;

/** Sales track subscription copy — landing sales panel */
export const SALES_PRO_SUBSCRIPTION = {
  price: priceLabel(PLAN_BASE_USD.SALES_PRO),
  period: "per month",
  label: priceLabelPerMonth(PLAN_BASE_USD.SALES_PRO),
  fullNote: `${priceLabelPerMonth(PLAN_BASE_USD.SALES_PRO)} — cancel anytime`,
  cta: "Get Pro",
} as const;

export const SALES_ELITE_SUBSCRIPTION = {
  price: priceLabel(PLAN_BASE_USD.SALES_ELITE),
  period: "per month",
  label: priceLabelPerMonth(PLAN_BASE_USD.SALES_ELITE),
  fullNote: `${priceLabelPerMonth(PLAN_BASE_USD.SALES_ELITE)} — cancel anytime`,
  cta: "Get Elite",
} as const;

/** Shared pricing copy — career and sales landing pages stay in sync */
export const PRICING_HERO = {
  eyebrow: "Simple Pricing",
  title: "Simple pricing",
  subtitle:
    "No lock-in on Pro and Elite. Cancel anytime. The only commitment is to getting ahead.",
};

export const PRICING_CONTENT_FOOTNOTE = "*New contents updated on periodic basis";

export const PRICING_CTA = {
  title: "Not sure yet? Join free.",
  description: "Get the Starter pack instantly — no card required. Upgrade when the time is right.",
  button: "Join Free",
};
