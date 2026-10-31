import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPaymentsLive } from "@/lib/payments";
import { isReferralEligible } from "@/lib/referral-eligibility";
import { REFERRAL_REWARD_PENDING_MESSAGE, getReferralRewardConfig } from "@/lib/referral-reward";
import type { BillingCadence, PlanTerm, PlanTrack } from "@/data/pricing-shared";
import { CheckoutClient } from "./checkout-client";

/**
 * `/checkout` — the in-app step between a plan CTA and Stripe.
 *
 * It exists for exactly one reason: the referral code field. Everything else it
 * shows (plan, term, price) is derived from `src/data/pricing-shared.ts`, which is
 * the single source of truth for every price the app displays. Stripe is still the
 * payment processor; this page only decides what the session should contain.
 *
 * Auth-gated like `/dashboard/*`: an anonymous visitor is sent to
 * `/login?callbackUrl=<this exact URL>` so they land back here, with their plan
 * and term intact, after signing in.
 *
 * `force-dynamic` because it reads the session, the member's track and the
 * reward configuration on every request.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Checkout",
};

interface CheckoutPageProps {
  searchParams: Promise<{ plan?: string; term?: string; cadence?: string }>;
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const params = await searchParams;

  // ── Validate the query string ─────────────────────────────────────────────
  // Anything that is not one of the two purchasable plans/terms is not a checkout
  // we can price, so send the visitor back to the pricing page rather than
  // guessing. This mirrors the body schema on /api/stripe/checkout.
  const plan = params.plan;
  if (plan !== "pro" && plan !== "elite") redirect("/pricing");

  const termParam = params.term ?? "monthly";
  if (termParam !== "monthly" && termParam !== "12") redirect("/pricing");
  const term: PlanTerm = termParam;

  // 🔴 A 12-month term is ALWAYS billed annually (same rule as the checkout
  // route). A hand-edited `?term=12&cadence=monthly` is not a plan we sell.
  const cadenceParam = params.cadence ?? (term === "12" ? "annual" : "monthly");
  if (cadenceParam !== "monthly" && cadenceParam !== "annual") redirect("/pricing");
  if (term === "12" && cadenceParam !== "annual") redirect("/pricing");
  const cadence: BillingCadence = cadenceParam;

  // ── Auth gate ─────────────────────────────────────────────────────────────
  const session = await auth();
  const selfHref = `/checkout?plan=${plan}&term=${term}&cadence=${cadence}`;
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(selfHref)}`);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, track: true },
  });
  if (!user) redirect("/login");

  // ── Eligibility + reward ──────────────────────────────────────────────────
  // Derived from the STORED email domain. The UI below only decides whether to
  // render the input; the server rejects an ineligible member regardless of what
  // this page shows (see `validateReferralCodeForMember`).
  const email = user.email || session.user.email || "";
  const eligible = isReferralEligible(email);
  const reward = getReferralRewardConfig();

  // The price is always the member's OWN track: /api/stripe/checkout reads
  // `User.track` from the database and never from the browser.
  const track: PlanTrack = user.track === "SALES" ? "SALES" : "CAREER";

  return (
    <CheckoutClient
      plan={plan}
      term={term}
      cadence={cadence}
      track={track}
      eligible={eligible}
      paymentsLive={isPaymentsLive()}
      rewardConfigured={reward.configured}
      rewardPendingMessage={REFERRAL_REWARD_PENDING_MESSAGE}
      backHref="/pricing"
    />
  );
}
