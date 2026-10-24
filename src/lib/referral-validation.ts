import "server-only";

import { prisma } from "@/lib/prisma";
import {
  classifyReferralAccount,
  isReferralEligible,
  type ReferralAccountType,
} from "@/lib/referral-eligibility";
import {
  isAcceptableCustomReferralCode,
  normalizeReferralCode,
} from "@/lib/referral-codes";
import { classifyExistingRedemption, isOwnPendingHold } from "@/lib/referral-redemption";
import { getReferralRewardConfig } from "@/lib/referral-reward";

/**
 * Server-side referral validation, shared by the two endpoints that need it:
 *
 *   * `POST /api/referral/validate` — the "Validate" button on `/checkout`.
 *   * `POST /api/stripe/checkout`   — which re-runs the WHOLE check before it
 *     attaches a discount, because a client can skip `/validate` entirely and
 *     post straight to checkout.
 *
 * Having one implementation is the point: if the two drifted, the UI could say
 * "valid" while checkout silently charged full price, or worse, checkout could
 * accept something `/validate` rejects.
 *
 * 🔴 Nothing in here creates or modifies anything in Stripe. The only Stripe
 * object referenced anywhere in the referral feature is the coupon id read from
 * `STRIPE_REFERRAL_COUPON_ID`.
 */

/** Why a code was rejected. Rendered to the member via {@link REFERRAL_REJECTION_MESSAGES}. */
export type ReferralRejectionReason =
  | "EMPTY"
  | "MALFORMED"
  | "NOT_ELIGIBLE"
  | "UNKNOWN"
  | "DISABLED"
  | "EXPIRED"
  | "ALREADY_REDEEMED"
  | "ALREADY_USED_BY_MEMBER"
  /**
   * Checkout-only: the member's own hold was refreshed moments ago, so a request
   * for this code is probably still in flight. Never returned by `/validate` — it
   * exists so the optimistic lock in the checkout route has copy with one home.
   */
  | "CHECKOUT_IN_PROGRESS";

/**
 * One message per rejection reason, so every rejection path can return the same
 * shape and the client renders one map instead of guessing.
 *
 * A referral code is NOT a secret credential (it is shared in messages and
 * slides), so distinguishing "unknown" from "disabled" leaks nothing that
 * matters, and a clear reason is far more useful to a member who mistyped.
 */
export const REFERRAL_REJECTION_MESSAGES: Record<ReferralRejectionReason, string> = {
  EMPTY: "Enter a referral code.",
  MALFORMED: "That does not look like a referral code. Check the format and try again.",
  NOT_ELIGIBLE:
    "Referral codes are available to university and corporate accounts only.",
  UNKNOWN: "We could not find that referral code.",
  DISABLED: "That referral code is no longer active.",
  EXPIRED: "That referral code has expired.",
  ALREADY_REDEEMED: "That referral code has already been used.",
  ALREADY_USED_BY_MEMBER: "You have already used a referral code on this account.",
  CHECKOUT_IN_PROGRESS:
    "A checkout is already in progress for this code. Wait a moment and try again.",
};

/** Result of a validation attempt. Same shape on every path. */
export interface ReferralValidationResult {
  valid: boolean;
  /** The normalised code that was checked (echoed so the UI can display it). */
  code: string;
  reason: ReferralRejectionReason | null;
  /** Human-readable message for `reason`; `null` when valid. */
  message: string | null;
  /** Derived from the member's email domain. Never client-supplied. */
  accountType: ReferralAccountType;
  /** Set only when `valid` — the row the checkout route should reserve. */
  referralCodeId: string | null;
  /**
   * Set when the member already holds a `RESERVED` row of their own (an abandoned
   * or cancelled checkout). The checkout route REASSIGNS that row with a single
   * UPDATE instead of inserting a second one, which both keeps the one-row-per-
   * member invariant and avoids a delete-then-insert race window.
   *
   * `null` on every rejection path and whenever there is no row to reuse.
   */
  reservationId: string | null;
  /** Present only when `valid`, so the UI can say whether a reward is attached. */
  reward: { configured: boolean; kind: string; value: number | null } | null;
}

/**
 * How long a Stripe Checkout Session stays payable.
 *
 * Stripe only accepts `expires_at` between **30 minutes and 24 hours** from
 * creation, so 30 is the hard floor; the extra minute absorbs clock skew between
 * this server and Stripe, which would otherwise be able to reject a session for
 * being a second too short.
 *
 * Without this, Stripe's default is 24 HOURS — far longer than the reservation
 * lives — which opened a double-use window (see REFERRAL_RESERVATION_TTL_MS).
 */
export const REFERRAL_SESSION_TTL_MS = 31 * 60 * 1000;

/**
 * How long a RESERVED redemption may sit before it is treated as abandoned.
 *
 * 🔴 THE INVARIANT: this MUST stay **strictly greater** than
 * {@link REFERRAL_SESSION_TTL_MS}. It is the difference between "a stale session
 * cannot be paid" and "a stale session can be paid after its redemption row was
 * deleted, so a single-use code reads as unused and can be redeemed twice".
 *
 * The failure sequence, with the TTL SHORTER than the session life:
 *   1. Member reserves code A and is sent to Stripe.
 *   2. They abandon the tab for longer than the TTL.
 *   3. They start a DIFFERENT checkout. The stale sweep deletes the code-A row
 *      (scoped to this member), so code A is now unclaimed.
 *   4. They go back to the stale tab and pay it. Stripe honours the discount
 *      baked into that session, but there is no row left to confirm — so code A
 *      still looks unused and a second member can redeem it.
 *
 * Making the session expire FIRST closes this by construction: by the time the
 * sweep would delete the row, the session is already unpayable. The gap between
 * the two (31 min vs 40 min) is deliberate — a tie would leave the ordering to
 * clock skew.
 *
 * Consequence to be aware of: a member now has ~31 minutes to complete payment,
 * not 24 hours. That is the intended trade — a payable session outliving its
 * reservation is a correctness bug, not a convenience feature.
 */
export const REFERRAL_RESERVATION_TTL_MS = 40 * 60 * 1000;

/**
 * Clear a member's abandoned reservations.
 *
 * A member who opens Stripe Checkout and closes the tab leaves a `RESERVED` row
 * behind. Left alone it would (a) hold that single-use code hostage from every
 * other member and (b) permanently block that member from ever using a code
 * again. Rows older than {@link REFERRAL_RESERVATION_TTL_MS} are therefore
 * deleted before a new reservation is attempted — and ONLY that member's rows, so
 * one member's cleanup can never release another member's hold.
 *
 * Never throws: housekeeping must not be able to fail a checkout.
 *
 * @returns how many rows were cleared.
 */
export async function releaseStaleReferralReservations(userId: string): Promise<number> {
  const cutoff = new Date(Date.now() - REFERRAL_RESERVATION_TTL_MS);

  try {
    const { count } = await prisma.referralRedemption.deleteMany({
      where: {
        userId,
        status: "RESERVED",
        reservedAt: { lt: cutoff },
      },
    });
    return count;
  } catch (err) {
    console.error("[referral] stale reservation cleanup failed:", err);
    return 0;
  }
}

/**
 * Undo a single reservation.
 *
 * Called when `stripe.checkout.sessions.create` throws: without this, a failed or
 * abandoned checkout would burn a single-use code forever.
 *
 * Never throws — the caller is already handling a failure and must be able to
 * re-throw the ORIGINAL error.
 */
export async function releaseReferralReservation(
  redemptionId: string | null
): Promise<void> {
  if (!redemptionId) return;

  try {
    await prisma.referralRedemption.delete({ where: { id: redemptionId } });
  } catch (err) {
    console.error("[referral] failed to release reservation", redemptionId, err);
  }
}

/**
 * Validate a code for one member, entirely server-side.
 *
 * Order is deliberate and mirrors what a member experiences:
 *   1. shape of the input
 *   2. whether THIS member is allowed to use a code at all
 *   3. whether the code exists / is active / has not expired
 *   4. whether anyone has already claimed it (their own pending hold excepted)
 *   5. whether this member has already completed a redemption
 *
 * @param input.code raw text from the request (normalised inside)
 * @param input.userId the signed-in member's id
 * @param input.email the signed-in member's email — used ONLY for the domain
 *   classification, and never echoed back beyond the coarse `accountType`
 */
export async function validateReferralCodeForMember(input: {
  code: string;
  userId: string;
  email: string;
}): Promise<ReferralValidationResult> {
  const code = normalizeReferralCode(input.code);
  const accountType = classifyReferralAccount(input.email);

  const reject = (
    reason: ReferralRejectionReason
  ): ReferralValidationResult => ({
    valid: false,
    code,
    reason,
    message: REFERRAL_REJECTION_MESSAGES[reason],
    accountType,
    referralCodeId: null,
    reservationId: null,
    reward: null,
  });

  // 1. Shape.
  if (code.length === 0) return reject("EMPTY");
  if (!isAcceptableCustomReferralCode(code)) return reject("MALFORMED");

  // 2. Eligibility. Re-derived here, never trusted from the client or from a
  //    previous `/validate` call.
  if (!isReferralEligible(input.email)) return reject("NOT_ELIGIBLE");

  // 3. Existence and state.
  const row = await prisma.referralCode.findUnique({
    where: { code },
    select: {
      id: true,
      disabled: true,
      expiresAt: true,
      redemption: { select: { id: true, userId: true, status: true } },
    },
  });

  if (!row) return reject("UNKNOWN");
  if (row.disabled) return reject("DISABLED");
  if (row.expiresAt && row.expiresAt.getTime() <= Date.now()) return reject("EXPIRED");

  // 4. Single-use, per code. The unique index on `referralCodeId` is the real
  //    enforcement; this check exists to give a clear answer before we try.
  //
  //    EXCEPTION — the code's holder may be THIS member, and their hold may still
  //    be RESERVED. That is not a claim by somebody else: it is the checkout they
  //    just cancelled. Rejecting here would make a same-code retry impossible (the
  //    reuse path below would never be reached), so this case falls through.
  const heldByThisMember = isOwnPendingHold(row.redemption, input.userId);
  if (row.redemption && !heldByThisMember) return reject("ALREADY_REDEEMED");

  // 5. Single-use, per member — but ONLY a completed redemption blocks them.
  //
  //    A `RESERVED` row is this member's own pending hold: they opened Stripe and
  //    came back, or abandoned the tab. Treating that as "already used" would tell
  //    a paying member something false, so the hold is handed back to the caller to
  //    REUSE (see `reservationId` on the result) — either for this same code, or
  //    reassigned if they changed their mind and picked a different one.
  const existing = await prisma.referralRedemption.findUnique({
    where: { userId: input.userId },
    select: { id: true, status: true },
  });

  const verdict = classifyExistingRedemption(existing);
  if (verdict === "BLOCKED") return reject("ALREADY_USED_BY_MEMBER");

  const reward = getReferralRewardConfig();

  return {
    valid: true,
    code,
    reason: null,
    message: null,
    accountType,
    referralCodeId: row.id,
    reservationId: verdict === "REUSE" ? (existing?.id ?? null) : null,
    reward: { configured: reward.configured, kind: reward.kind, value: reward.value },
  };
}
