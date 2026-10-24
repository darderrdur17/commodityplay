import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import {
  getStripe,
  resolveStripePriceId,
  resolveStripeAnnualPriceId,
  getStripeCoupon,
  createOrRetrieveCustomer,
} from "@/lib/stripe";
import { isCheckoutConfigured, paymentsReadiness, PAYMENTS_STATUS_COPY } from "@/lib/payments";
import { RATE_LIMITS, checkRateLimit, getClientIp, rateLimitKey, rateLimitResponse } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { normalizeReferralCode } from "@/lib/referral-codes";
import { getReferralRewardConfig } from "@/lib/referral-reward";
import {
  REFERRAL_REJECTION_MESSAGES,
  REFERRAL_SESSION_TTL_MS,
  releaseReferralReservation,
  releaseStaleReferralReservations,
  validateReferralCodeForMember,
} from "@/lib/referral-validation";
import { z } from "zod";
import type { PlanTier, PlanTrack } from "@/data/pricing-shared";

const schema = z.object({
  plan: z.enum(["pro", "elite"]),
  term: z.enum(["monthly", "12"]).default("monthly"),
  cadence: z.enum(["monthly", "annual"]).default("monthly"),
  /**
   * Optional referral code. Deliberately a plain string with only a length cap:
   * the shape is normalised and validated server-side by
   * `validateReferralCodeForMember()`, so a bad value produces a clear, typed
   * rejection instead of a generic "Invalid plan" 400.
   */
  referralCode: z.string().max(64).optional(),
});

/** True when `err` is Prisma's unique-constraint violation. */
function isUniqueViolation(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002"
  );
}

/**
 * How stale a `RESERVED` hold must be before it can be REUSED.
 *
 * A genuine retry means the member went to Stripe, cancelled, and navigated back —
 * comfortably longer than ten seconds. A double-click, or two concurrent requests
 * from the same member, lands inside the window. Without this lock both requests
 * would reassign the same row and each open a discounted session, so a single-use
 * code could be applied twice.
 */
const REFERRAL_REUSE_LOCK_MS = 10_000;

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
    // Log WHICH prerequisite is missing (names only, never values) so a go-live check
    // is one look at the logs rather than a guess. The member sees the honest reason;
    // the reason code lets the verification script tell this apart from a real fault.
    const readiness = paymentsReadiness();
    console.error("[stripe/checkout] checkout is closed", {
      live: readiness.live,
      hasSecret: readiness.hasSecret,
      missingPriceVars: readiness.missingPriceVars,
    });
    return NextResponse.json(
      {
        error: PAYMENTS_STATUS_COPY.checkoutApiError,
        reason: "PAYMENTS_NOT_CONFIGURED",
      },
      { status: 503 }
    );
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  try {
    const { plan, term, cadence } = parsed.data;

    // 🔴 A 12-month term is ALWAYS billed annually. Without this guard a hand-crafted
    // request could pair the annual term with the monthly cadence and be mispriced:
    // the annual price carries the 15% discount, the monthly one does not. The UI
    // can no longer produce this combination (cadence is derived from term), so this
    // only ever rejects a request that did not come from our own page.
    if (term === "12" && cadence !== "annual") {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const userId = session.user.id;
    const tier: PlanTier = plan === "elite" ? "ELITE" : "PRO";

    // Track is NEVER taken from the browser — it decides the price.
    //
    // `email` is selected for the same reason. The referral gate is decided by the
    // email DOMAIN, and the JWT copy goes stale the moment a member changes their
    // address through `PATCH /api/account/profile` (which does not re-verify).
    // Using the session copy here let a member whose stored address is a gmail
    // inbox pass this gate while `/api/referral/validate` — which reads the DB —
    // refused them, so a stale JWT could buy a referral discount the member is not
    // entitled to. This MUST be the same value the validator reads.
    const row = await prisma.user.findUnique({
      where: { id: userId },
      select: { track: true, email: true },
    });
    const track: PlanTrack = row?.track === "SALES" ? "SALES" : "CAREER";
    const email = row?.email ?? session.user.email!;

    const stripe = getStripe();
    const isAnnual = term === "12" && cadence === "annual";
    let priceId: string;
    try {
      priceId = isAnnual ? resolveStripeAnnualPriceId(track, tier) : resolveStripePriceId(track, tier);
    } catch (err) {
      console.error("[stripe/checkout] price not configured", { track, tier, term, cadence, err });
      return NextResponse.json(
        { error: isAnnual ? "Annual billing is not available yet. Please choose billed monthly." : "Checkout failed" },
        { status: 503 }
      );
    }
    const customerId = await createOrRetrieveCustomer(userId, email);
    const origin = req.headers.get("origin") || process.env.NEXTAUTH_URL;

    // ⚠️ Currently UNREACHABLE. The guard above forces `term === "12"` to be
    // `isAnnual`, and `getStripeCoupon` returns null for "monthly" — so `couponId`
    // is always null and no coupon is ever applied. The plumbing is kept (not
    // deleted) because it cannot be exercised in this environment and a future
    // non-annual long term may want it again. See `getStripeCoupon` in lib/stripe.ts.
    const couponId = isAnnual ? null : getStripeCoupon(track, tier, term);
    if (!isAnnual && term !== "monthly" && !couponId) {
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

    /* ── Referral code (optional) ─────────────────────────────────────────────
     * 🔴 EVERYTHING here is re-derived server-side. The browser may have called
     * `/api/referral/validate` first, but that is a UI convenience only: this
     * request could be hand-crafted, so eligibility (email domain), existence,
     * disabled/expired state and BOTH single-use rules are all re-checked against
     * the database before a discount is attached. A client-supplied discount is
     * never trusted — the coupon id comes from the environment, not the request.
     */
    const referralInput = normalizeReferralCode(parsed.data.referralCode ?? "");
    let referralCodeId: string | null = null;
    let referralReservationId: string | null = null;
    let referralDiscount: { coupon: string } | null = null;
    /**
     * True when the row we are holding was the member's OWN pre-existing hold
     * rather than one this request created. It decides whether a failed session
     * create may release it — see the catch around `sessions.create`.
     */
    let reusedReservation = false;

    if (referralInput) {
      // Housekeeping first: a member who abandoned a previous checkout still holds
      // a RESERVED row, which would block them and hold the code hostage. Only
      // rows past the TTL are cleared, so a checkout that is merely slow keeps its
      // hold. Scoped to this member, so nobody else's hold is ever released.
      await releaseStaleReferralReservations(userId);

      const check = await validateReferralCodeForMember({
        code: referralInput,
        userId,
        email,
      });

      if (!check.valid || !check.referralCodeId) {
        // A used-up code is a conflict; anything else is a bad request. Either way
        // the member must not be sent to Stripe at full price believing they got a
        // discount, so the whole checkout stops here with an actionable message.
        const conflict =
          check.reason === "ALREADY_REDEEMED" || check.reason === "ALREADY_USED_BY_MEMBER";
        return NextResponse.json(
          { error: check.message ?? "That referral code cannot be used.", reason: check.reason },
          { status: conflict ? 409 : 400 }
        );
      }

      referralCodeId = check.referralCodeId;

      // Take the single-use claim. The unique indexes on `referralCodeId` and
      // `userId` mean two concurrent checkouts cannot both win — the loser gets
      // P2002, not a second discount.
      //
      // Two paths, because a member has at most ONE redemption row:
      //   * `check.reservationId` set -> they already hold a RESERVED row from an
      //     abandoned or cancelled checkout. REUSE it with a single UPDATE — no
      //     delete-then-insert window — and point it at the code they just
      //     validated, so "I changed my mind about the code" works too.
      //   * otherwise -> INSERT a fresh hold.
      reusedReservation = Boolean(check.reservationId);
      try {
        if (check.reservationId) {
          const lockCutoff = new Date(Date.now() - REFERRAL_REUSE_LOCK_MS);

          const { count } = await prisma.referralRedemption.updateMany({
            where: {
              id: check.reservationId,
              status: "RESERVED",
              // Optimistic lock: a hold refreshed within the last 10s belongs to a
              // request that is probably still in flight. Reusing it here would
              // hand out a second discounted session for a single-use code.
              reservedAt: { lt: lockCutoff },
            },
            // `reservedAt` is refreshed so the 30-minute stale sweep starts again
            // from this attempt, and `stripeSessionId` is cleared because the old
            // session no longer describes this hold.
            data: {
              referralCodeId,
              reservedAt: new Date(),
              stripeSessionId: null,
            },
          });

          // count === 0 means the conditional UPDATE matched nothing: either the
          // hold was refreshed inside the lock window (a request in flight), or it
          // stopped being RESERVED — confirmed concurrently. Both mean "not now",
          // and neither may fall through to applying the discount WITHOUT a
          // reservation, so this is a hard stop. A member whose row was actually
          // confirmed gets the accurate ALREADY_USED_BY_MEMBER on the next try.
          if (count === 0) {
            return NextResponse.json(
              {
                error: REFERRAL_REJECTION_MESSAGES.CHECKOUT_IN_PROGRESS,
                reason: "CHECKOUT_IN_PROGRESS",
              },
              { status: 409 }
            );
          }

          referralReservationId = check.reservationId;
        } else {
          const reservation = await prisma.referralRedemption.create({
            data: { referralCodeId, userId, status: "RESERVED" },
            select: { id: true },
          });
          referralReservationId = reservation.id;
        }
      } catch (err) {
        if (isUniqueViolation(err)) {
          return NextResponse.json(
            {
              error: "This referral code has just been used. Remove it and try again.",
              reason: "ALREADY_REDEEMED",
            },
            { status: 409 }
          );
        }
        throw err;
      }

      // 🔴 The reward is UNDECIDED. While `STRIPE_REFERRAL_COUPON_ID` is unset,
      // `configured` is false and we deliberately attach NO discount — the code is
      // still recorded above so it can be honoured later, and the checkout must
      // not fail. Once the owner sets the variable, the discount is applied.
      //
      // We only ever REFERENCE an existing coupon. This route never creates a
      // coupon, price or product in Stripe — the owner manages those herself.
      const reward = getReferralRewardConfig();
      if (reward.configured && reward.couponId) {
        if (discount) {
          // Cannot happen with today's code (the term-coupon path is unreachable),
          // but if both ever resolve they are mutually exclusive: Stripe rejects
          // two discount sources and stacking them would double-discount.
          console.warn(
            "[stripe/checkout] referral and term coupon both resolved; preferring the referral discount",
            { userId, track, tier, term }
          );
        }
        referralDiscount = { coupon: reward.couponId };
      }
    }

    // The referral discount wins when both exist (see the warning above).
    const effectiveDiscount: { coupon: string } | null = referralDiscount ?? discount;

    // Session metadata carries the referral code id so the webhook can CONFIRM
    // the redemption once the member actually pays. Only the id is stored — never
    // the member's email domain or any reward amount.
    //
    // Typed as a plain string map because Stripe's `MetadataParam` has an index
    // signature: a `{} | { referralCodeId: string }` union widens to an optional
    // `undefined` property, which that signature rejects.
    const referralMetadata: Record<string, string> = referralCodeId
      ? { referralCodeId }
      : {};

    let checkoutSession: Stripe.Checkout.Session;
    try {
      checkoutSession = await stripe.checkout.sessions.create({
        customer: customerId,
        // 🔴 Every plan is a subscription now — there is no one-time product left.
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${origin}/account?upgraded=1`,
        cancel_url: `${origin}/account?cancelled=1`,
        metadata: { userId, plan: tier, term, cadence, track, ...referralMetadata },
        subscription_data: {
          // 🔴 NO `trial_period_days`. The 60-day trial was how the OLD "12 + 2 free"
          // model delivered its two free months. The annual benefit is now the flat 15%
          // discount, so a trial on top would be a DOUBLE discount that contradicts the
          // displayed annual price. Do not reinstate it.
          metadata: { userId, plan: tier, term, cadence, track, ...referralMetadata },
        },
        // Promo-code entry is offered on every plan that has no discount of its own.
        //
        // The two are mutually exclusive BY CONSTRUCTION, not by luck: Stripe
        // rejects `allow_promotion_codes` combined with `discounts`, and
        // `effectiveDiscount` is non-null only when a coupon actually resolved
        // (the term coupon, or the referral coupon from the environment). So a
        // member redeeming a referral code gets the discount and no promo field,
        // and everyone else gets the promo field and no discount.
        ...(effectiveDiscount
          ? { discounts: [effectiveDiscount] }
          : { allow_promotion_codes: true }),
        billing_address_collection: "required",
        customer_update: { address: "auto", name: "auto" },
        // 🔴 The session must NOT outlive the referral reservation.
        //
        // Stripe's default is 24 HOURS, but a RESERVED redemption is released by
        // the stale sweep after REFERRAL_RESERVATION_TTL_MS. With the default, a
        // member could reserve a code, abandon for an hour, start a different
        // checkout (deleting the old row), then pay the stale session — Stripe
        // honours the discount baked into it while the redemption row is gone, so
        // the single-use code reads as unused and can be redeemed again.
        //
        // Pinning `expires_at` makes the session unpayable before its reservation
        // can be released. `REFERRAL_RESERVATION_TTL_MS` is deliberately the
        // larger of the two constants; see the invariant documented next to it.
        expires_at: Math.floor((Date.now() + REFERRAL_SESSION_TTL_MS) / 1000),
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
    } catch (err) {
      // 🔴 A failed session create must NOT burn a single-use code — but only
      // release a row WE created in this request.
      //
      // When the hold was REUSED it is the member's own pre-existing reservation
      // (they cancelled a previous checkout). Deleting it would free a code they
      // may still want, and would also be a surprise: nothing this request did
      // should destroy their earlier hold. If they really do abandon it, the
      // 30-minute stale sweep expires it on their next attempt.
      if (!reusedReservation) await releaseReferralReservation(referralReservationId);
      throw err;
    }

    if (referralReservationId) {
      // Best-effort: record the session id on the reservation so the webhook can
      // match it even if metadata were ever lost. A failure here is not fatal —
      // the code is already attached to the session metadata.
      try {
        await prisma.referralRedemption.update({
          where: { id: referralReservationId },
          data: { stripeSessionId: checkoutSession.id },
        });
      } catch (err) {
        console.error("[stripe/checkout] failed to record referral session id", err);
      }
    }

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("[stripe/checkout]", err);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
