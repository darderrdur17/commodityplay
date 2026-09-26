import {
  ELITE_SUBSCRIPTION,
  PRO_SUBSCRIPTION,
  SALES_ELITE_SUBSCRIPTION,
  SALES_PRO_SUBSCRIPTION,
} from "@/data/pricing-shared";

export type BillingTrack = "CAREER" | "SALES" | null | undefined;
export type BillingTier = "STARTER" | "PRO" | "ELITE";

/** Rank used for tier comparisons. A higher rank unlocks everything below it. */
const TIER_RANK: Record<BillingTier, number> = {
  STARTER: 0,
  PRO: 1,
  ELITE: 2,
};

/**
 * Stripe subscription statuses that genuinely mean "this member is paid up".
 * Anything else (past_due, unpaid, canceled, incomplete, paused, …) must not
 * unlock paid content.
 */
export const LIVE_SUBSCRIPTION_STATUSES: readonly string[] = ["active", "trialing"];

/**
 * Minimal set of user fields needed to decide an entitlement.
 * Kept loose so callers can pass a whole Prisma `User` row.
 */
export interface EntitlementFields {
  tier?: string | null;
  stripeStatus?: string | null;
  stripeCurrentPeriodEnd?: Date | string | null;
  stripePriceId?: string | null;
}

/** Coerce any persisted value into a known tier. Unknown values are treated as STARTER. */
export function normalizeTier(value: string | null | undefined): BillingTier {
  if (value === "PRO" || value === "ELITE") return value;
  return "STARTER";
}

/** Numeric rank of a tier string (unknown values rank as STARTER). */
export function tierRank(tier: string | null | undefined): number {
  return TIER_RANK[normalizeTier(tier)];
}

/** Return the higher of two tiers — used so a completed purchase never downgrades. */
export function maxTier(
  a: string | null | undefined,
  b: string | null | undefined
): BillingTier {
  return tierRank(a) >= tierRank(b) ? normalizeTier(a) : normalizeTier(b);
}

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * True only when a *recurring* entitlement is genuinely live:
 * status ∈ {active, trialing} AND the paid-through period has not elapsed.
 */
export function isSubscriptionLive(
  status: string | null | undefined,
  periodEnd: Date | string | null | undefined
): boolean {
  if (!status) return false;
  if (!LIVE_SUBSCRIPTION_STATUSES.includes(String(status).toLowerCase())) return false;

  const end = toDate(periodEnd);
  // A null period end is tolerated (legacy rows); an elapsed one is not.
  if (end && end.getTime() <= Date.now()) return false;
  return true;
}

/**
 * Single source of truth for "what is this member actually entitled to right now".
 *
 * - PRO is a ONE-TIME purchase (SGD 99). Once bought it never expires, so there is
 *   no recurring status to validate.
 * - ELITE is a recurring monthly subscription, so it only counts while the Stripe
 *   subscription is `active`/`trialing` and the paid-through period is in the future.
 * - Anything else falls back to STARTER.
 *
 * Use this for every authorisation decision. Never use `session.user.tier` (the JWT
 * can be up to 30 days stale after a downgrade, refund, or lapsed card).
 */
export function effectiveTier(user: EntitlementFields | null | undefined): BillingTier {
  const stored = normalizeTier(user?.tier);

  if (stored === "STARTER") return "STARTER";
  if (stored === "PRO") return "PRO";

  // ELITE
  return isSubscriptionLive(user?.stripeStatus, user?.stripeCurrentPeriodEnd)
    ? "ELITE"
    : "STARTER";
}

/** Authorisation helper: does this user's *effective* tier unlock `requiredTier`? */
export function hasEffectiveAccess(
  user: EntitlementFields | null | undefined,
  requiredTier: string | null | undefined
): boolean {
  return tierRank(effectiveTier(user)) >= tierRank(requiredTier);
}

export function subscriptionPlanLabel(tier: BillingTier, track?: BillingTrack): string {
  if (tier === "STARTER") return "Starter (Free)";
  if (tier === "PRO") {
    return track === "SALES"
      ? `Pro · ${SALES_PRO_SUBSCRIPTION.label}`
      : `Pro · ${PRO_SUBSCRIPTION.label}`;
  }
  return track === "SALES"
    ? `Elite · ${SALES_ELITE_SUBSCRIPTION.label}`
    : `Elite · ${ELITE_SUBSCRIPTION.label}`;
}

export function subscriptionStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case "active":
      return "Active";
    case "past_due":
      return "Past due";
    case "cancelled":
    case "canceled":
      return "Cancelled";
    case "inactive":
      return "No active subscription";
    default:
      return status ? status.replace(/_/g, " ") : "No active subscription";
  }
}

export function subscriptionStatusTone(
  status: string | null | undefined
): "success" | "warning" | "muted" {
  if (status === "active") return "success";
  if (status === "past_due") return "warning";
  return "muted";
}
