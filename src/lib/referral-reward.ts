/**
 * The referral REWARD — deliberately a placeholder seam.
 *
 * ---------------------------------------------------------------------------
 * ⚠️ THE REWARD HAS NOT BEEN DECIDED BY THE PRODUCT OWNER
 * ---------------------------------------------------------------------------
 * Nothing here may hardcode a percentage or an amount. The whole feature is
 * built so it can ship BEFORE the reward exists:
 *
 *   * `REFERRAL_REWARD_PLACEHOLDER.value` is `null`, meaning "not decided".
 *   * The discount that is actually applied comes from a Stripe COUPON ID held in
 *     the `STRIPE_REFERRAL_COUPON_ID` environment variable.
 *   * `configured` is true only when that variable is set. While it is unset the
 *     checkout route still records the redemption (so the code can be honoured
 *     later) but attaches no discount and does not throw.
 *
 * When the owner decides the reward, the change is:
 *   1. she creates the coupon in the Stripe Dashboard herself, and
 *   2. `STRIPE_REFERRAL_COUPON_ID` is set to its id.
 * No deploy is needed for the discount amount, and this app still never creates
 * or edits anything in Stripe — see the hard constraint in
 * `src/app/api/stripe/checkout/route.ts`.
 *
 * This module is pure (no Prisma, no React) so the verification script can call
 * it directly, and it is safe to import from a server component.
 */

/** Shape of the undecided reward. Edit ONLY here once it is decided. */
export const REFERRAL_REWARD_PLACEHOLDER = {
  /** What kind of benefit it is — a one-off reduction on the first invoice. */
  kind: "percent_off_first_invoice",
  /** `null` = not decided. A number would be a percentage for the kind above. */
  value: null,
  /** How long it applies for: `once` = the first invoice only. */
  duration: "once",
} as const;

/**
 * Copy shown to a member whose code was accepted while the reward is still
 * undecided.
 *
 * 🔴 This must NOT overstate. While `STRIPE_REFERRAL_COUPON_ID` is unset there is
 * NO discount on the order at all — the coupon that would carry it does not exist
 * yet — so the member is charged the full displayed price. Telling them a discount
 * "has been applied" on a payment page would be false and would generate a refund
 * request the moment the invoice arrives. It says exactly what is true: nothing is
 * reduced yet, the code is recorded, and the reward will be confirmed.
 */
export const REFERRAL_REWARD_PENDING_MESSAGE =
  "No discount is applied to this order yet. Your code is recorded, and the referral reward will be confirmed with you.";

/** Resolved reward configuration for the current process. */
export interface ReferralRewardConfig {
  /** e.g. `percent_off_first_invoice` */
  kind: string;
  /** `null` while the reward is undecided. */
  value: number | null;
  /** e.g. `once` */
  duration: string;
  /** Stripe coupon id from the environment, or `null` when unset. */
  couponId: string | null;
  /** True only when a coupon id is present — i.e. the reward is actionable. */
  configured: boolean;
}

/**
 * Read the reward configuration.
 *
 * `configured` is the ONE flag the checkout route branches on, and it is derived
 * purely from the presence of `STRIPE_REFERRAL_COUPON_ID`. That is what makes the
 * feature safe to ship before the reward is decided: unset means "record the
 * code, apply no discount, do not fail".
 */
export function getReferralRewardConfig(): ReferralRewardConfig {
  const raw = process.env.STRIPE_REFERRAL_COUPON_ID;
  const couponId = typeof raw === "string" && raw.trim().length > 0 ? raw.trim() : null;

  return {
    kind: REFERRAL_REWARD_PLACEHOLDER.kind,
    value: REFERRAL_REWARD_PLACEHOLDER.value,
    duration: REFERRAL_REWARD_PLACEHOLDER.duration,
    couponId,
    configured: couponId !== null,
  };
}
