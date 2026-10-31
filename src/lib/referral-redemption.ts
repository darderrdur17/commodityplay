/**
 * Redemption-status semantics — the ONE rule that decides whether a member's
 * existing `ReferralRedemption` row blocks a new checkout attempt.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS IS ITS OWN MODULE
 * ---------------------------------------------------------------------------
 * This rule has already been wrong once. The first version blocked on ANY
 * existing row, which meant a member who reached Stripe and clicked "back" was
 * told "You have already used a referral code on this account" for 30 minutes —
 * a false statement, on a payment page, for the single most common user action
 * (changing your mind at the payment step).
 *
 * The rule is therefore pure and separately importable, so
 * `scripts/verify-feedback-changes.ts` can pin it directly instead of asserting on
 * source text. It must NOT import Prisma or `server-only` — the checkout route and
 * the validator both import it, and the test harness has neither.
 *
 * `RESERVED`  = this member's own PENDING HOLD (an abandoned or cancelled
 *               checkout). Not a redemption. Reusable, and reassignable to a
 *               different code if they changed their mind.
 * `CONFIRMED` = a completed redemption. The member is done, permanently.
 *
 * Anything else fails CLOSED: if a future status is added, an unknown value must
 * block rather than quietly permit a second discount.
 */

/** The two states a redemption row can be in today. */
export type ReferralRedemptionStatus = "RESERVED" | "CONFIRMED";

/**
 * What an existing row means for a NEW attempt by the same member.
 *
 *  * `NONE`    — no row; nothing to reuse or block.
 *  * `REUSE`   — the member's own pending hold; reassign it instead of inserting.
 *  * `BLOCKED` — a completed redemption (or an unrecognised status); refuse.
 */
export type ExistingRedemptionVerdict = "NONE" | "REUSE" | "BLOCKED";

/**
 * Classify a member's existing redemption row.
 *
 * @param existing the row, or `null`/`undefined` when the member has none.
 */
export function classifyExistingRedemption(
  existing: { status: string } | null | undefined
): ExistingRedemptionVerdict {
  if (!existing) return "NONE";
  if (existing.status === "RESERVED") return "REUSE";
  // CONFIRMED, and anything unknown, blocks. Fail closed on the money path.
  return "BLOCKED";
}

/**
 * True when a code's redemption row is this member's OWN pending hold.
 *
 * This is the per-CODE half of the same rule, and it is what makes a same-code
 * retry work at all: the code they are validating already has a redemption row —
 * their own, from the checkout they just cancelled. Without this exception the
 * validator would reject with "That referral code has already been used" *before*
 * ever reaching the per-member check, so the reuse path would be unreachable for
 * the dominant case (member types the same code again).
 *
 * @param redemption the redemption attached to the code being validated
 * @param userId the member attempting the redemption
 */
export function isOwnPendingHold(
  redemption: { userId: string; status: string } | null | undefined,
  userId: string
): boolean {
  if (!redemption) return false;
  return redemption.userId === userId && redemption.status === "RESERVED";
}
