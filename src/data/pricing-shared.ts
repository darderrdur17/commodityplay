/**
 * Pricing — the SINGLE SOURCE OF TRUTH for every price the app displays.
 *
 * Four tiers x two terms. All amounts are SGD and rendered as `S$`, and every
 * other price string in the app is DERIVED from this file, so changing a price
 * happens in exactly one place. Before this, four independent constants
 * advertised four different numbers while the checkout code charged a fifth — a
 * member could be billed a different amount than the page they clicked.
 *
 * ---------------------------------------------------------------------------
 * TERM ARITHMETIC — the annual plan is a flat 15% off twelve months
 * ---------------------------------------------------------------------------
 *   monthly   pay 1  month,  get 1  month   -> full base rate
 *   annually  pay 12 months, get 12 months  -> base x 0.85 per month (15% off)
 *
 * This REPLACED the old "pay 12 months, get 14 months" model. The annual plan no
 * longer grants free months — the whole benefit is the 15% discount. The 60-day
 * Stripe trial that used to deliver the two free months was removed from the
 * checkout route at the same time: leaving it in would stack a 60-day discount on
 * top of the 15% and contradict the displayed price.
 */

export const CURRENCY = "SGD" as const;

/** Rendered before every amount, with NO space: `S$19`, `S$16.15`. */
export const CURRENCY_SYMBOL = "S$" as const;

/** Flat discount applied to twelve months when billed annually. */
export const ANNUAL_DISCOUNT_PERCENT = 15 as const;

export type PlanTrack = "CAREER" | "SALES";
export type PlanTier = "PRO" | "ELITE";
export type PlanTerm = "monthly" | "12";
export type BillingCadence = "monthly" | "annual";

/** `CAREER_PRO`, `SALES_ELITE`, … */
export type PlanKey = `${PlanTrack}_${PlanTier}`;

/**
 * Monthly list price, in whole SGD, per tier.
 *
 * The old `SALES_PRO` === `CAREER_ELITE` collision (both 39) is gone, but the
 * rule it forced still stands: always resolve the tier from the Stripe price ID,
 * never from an amount — the amounts are ours to change and a total can never
 * identify a plan on its own.
 */
export const PLAN_BASE_PRICE: Record<PlanKey, number> = {
  CAREER_PRO: 19,
  CAREER_ELITE: 34,
  SALES_PRO: 39,
  SALES_ELITE: 56,
};

/**
 * The two purchasable terms. `paidMonths` is how many months the member is billed
 * for; `accessMonths` is how long they get access. They are EQUAL for both terms:
 * the annual plan buys exactly twelve months, discounted, with no free months.
 * (They were 12/14 under the old "12 + 2 free" model.)
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
  "12": {
    label: "Annually",
    shortLabel: "Annually",
    paidMonths: 12,
    accessMonths: 12,
  },
};

export const PLAN_TERM_ORDER: PlanTerm[] = ["monthly", "12"];

/** Normalised monthly rate in SGD, rounded to whole cents. */
export function monthlyRateUsd(
  track: PlanTrack,
  tier: PlanTier,
  term: PlanTerm
): number {
  const base = PLAN_BASE_PRICE[`${track}_${tier}`];
  if (term === "monthly") return base;
  return Math.round(base * (1 - ANNUAL_DISCOUNT_PERCENT / 100) * 100) / 100;
}

/** Total charged over a full term, in SGD. */
export function termTotalUsd(
  track: PlanTrack,
  tier: PlanTier,
  term: PlanTerm
): number {
  const base = PLAN_BASE_PRICE[`${track}_${tier}`];
  if (term === "monthly") return base;
  return Math.round(base * 12 * (1 - ANNUAL_DISCOUNT_PERCENT / 100) * 100) / 100;
}

/**
 * Dollars saved by paying for twelve months up front, versus twelve monthly
 * payments. Equal to `base x 1.8` (twelve months x 15%).
 * Career Pro: 19 x 12 = 228, minus 193.80 = 34.20.
 */
export function annualSavingAmount(track: PlanTrack, tier: PlanTier): number {
  const base = PLAN_BASE_PRICE[`${track}_${tier}`];
  return Math.round((base * 12 - termTotalUsd(track, tier, "12")) * 100) / 100;
}

/**
 * Discount of a term versus paying monthly, as a whole percent.
 * monthly -> 0 ; "12" -> 15. Single source for the "Save 15%" badge.
 */
export function termSavingsPercent(term: PlanTerm): number {
  return term === "12" ? ANNUAL_DISCOUNT_PERCENT : 0;
}

/** `S$19` / `S$16.15` — whole amounts lose the trailing `.00`. */
export function priceLabel(amount: number): string {
  return `${CURRENCY_SYMBOL}${Number.isInteger(amount) ? amount : amount.toFixed(2)}`;
}

/** `S$19/month` — the canonical label used across the landing pages. */
export function priceLabelPerMonth(amount: number): string {
  return `${priceLabel(amount)}/month`;
}

/** `S$193.80` / `S$228` — for prose and stat blocks. */
export function formatMoney(amount: number): string {
  return `${CURRENCY_SYMBOL}${new Intl.NumberFormat("en-SG", {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount)}`;
}

/**
 * Annual savings tooltip copy. The numbers are DERIVED, never hardcoded, so a
 * price change can never leave this sentence advertising the old amount.
 * Career Pro: "Compared to paying monthly. Your full annual price is S$193.80
 * against S$228 with regular monthly payments."
 */
export function annualTooltip(track: PlanTrack, tier: PlanTier): string {
  const base = PLAN_BASE_PRICE[`${track}_${tier}`];
  return `Compared to paying monthly. Your full annual price is ${formatMoney(
    termTotalUsd(track, tier, "12")
  )} against ${formatMoney(base * 12)} with regular monthly payments.`;
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
 * The four `*_SUBSCRIPTION` objects below are DERIVED from `PLAN_BASE_PRICE`.
 * Do not reintroduce a literal price here — that is exactly how the app ended up
 * advertising four different numbers.
 */

export const PRO_SUBSCRIPTION = {
  price: priceLabel(PLAN_BASE_PRICE.CAREER_PRO),
  period: "per month",
  note: "cancel anytime",
  label: priceLabelPerMonth(PLAN_BASE_PRICE.CAREER_PRO),
  fullNote: "Unlock the full playbook, resume templates, career roadmap, and more.",
  cta: UPGRADE_TO_ACCESS,
  unlockCta: UPGRADE_TO_ACCESS,
} as const;

export const ELITE_SUBSCRIPTION = {
  price: priceLabel(PLAN_BASE_PRICE.CAREER_ELITE),
  period: "per month",
  note: "cancel anytime",
  label: priceLabelPerMonth(PLAN_BASE_PRICE.CAREER_ELITE),
  fullNote: "Unlock case studies, Mentor Connect, the Desk Channel, and job openings.",
  cta: UPGRADE_TO_ACCESS,
  unlockCta: UPGRADE_TO_ACCESS,
} as const;

/** Sales track subscription copy — landing sales panel */
export const SALES_PRO_SUBSCRIPTION = {
  price: priceLabel(PLAN_BASE_PRICE.SALES_PRO),
  period: "per month",
  label: priceLabelPerMonth(PLAN_BASE_PRICE.SALES_PRO),
  fullNote: `${priceLabelPerMonth(PLAN_BASE_PRICE.SALES_PRO)} — cancel anytime`,
  cta: "Get Pro",
} as const;

export const SALES_ELITE_SUBSCRIPTION = {
  price: priceLabel(PLAN_BASE_PRICE.SALES_ELITE),
  period: "per month",
  label: priceLabelPerMonth(PLAN_BASE_PRICE.SALES_ELITE),
  fullNote: `${priceLabelPerMonth(PLAN_BASE_PRICE.SALES_ELITE)} — cancel anytime`,
  cta: "Get Elite",
} as const;

/**
 * The free tier's top panel on /pricing. This REPLACED the old dark "Simple
 * pricing" hero: the free plan is no longer a column in the grid (see
 * `toLandingTiers`), it is this panel, and its `Sign up` button opens the Starter
 * Pack modal.
 */
export const PRICING_FREE_PANEL = {
  title: "Free, until you're ready",
  line1: "Look first at how all the markets are performing.",
  line2: "Then leap into them on the platform used by 100 million traders.",
  price: "S$0",
  period: "forever",
  cta: "Sign up",
  note: "No credit card needed",
} as const;

/** Track heading above the plan grid — switches with the Career | Sales toggle. */
export const PRICING_TRACK_HEADINGS = {
  CAREER: "Plans for every level of Learner",
  SALES: "Plans for every level of Sales ambition",
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

/** Centered CTA band copy (PRD E3) — headline + supporting line + button. */
export const PRICING_CTA_BAND = {
  eyebrow: "Plans & pricing",
  title: "Find the plan that fits your desk.",
  description:
    "Compare Career and Sales tracks side by side — monthly, or 12 months + 2 free.",
  button: "Get Started",
} as const;
