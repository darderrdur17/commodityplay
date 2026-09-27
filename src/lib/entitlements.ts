import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { effectiveTier, normalizeTier, type BillingTier } from "@/lib/billing";

/**
 * Authoritative entitlement lookup.
 *
 * `session.user.tier` comes from the Auth.js JWT and is only refreshed on
 * `trigger === "update"`, with no `maxAge` — so a refunded or lapsed member can keep
 * a paid tier baked into their token for up to 30 days. Every authorisation decision
 * must therefore read the database through this module instead.
 */

export interface Entitlements {
  /** Resolved user id, or "" when there is no signed-in user. */
  userId: string;
  /** False when the user row could not be found (deleted account / stale session). */
  exists: boolean;
  /**
   * AUTHORITATIVE tier, computed from the DB row via `effectiveTier()`.
   * Use this for every access check.
   */
  tier: BillingTier;
  /**
   * Raw tier as persisted on the user row.
   * COSMETIC ONLY (badges, greetings) — it can read PRO/ELITE while the
   * entitlement has actually lapsed.
   */
  storedTier: BillingTier;
  stripeStatus: string | null;
  stripePriceId: string | null;
  stripeCurrentPeriodEnd: Date | null;
  /** True when a paid entitlement (PRO or ELITE) is genuinely live right now. */
  isPaidLive: boolean;
}

const ANONYMOUS: Entitlements = {
  userId: "",
  exists: false,
  tier: "STARTER",
  storedTier: "STARTER",
  stripeStatus: null,
  stripePriceId: null,
  stripeCurrentPeriodEnd: null,
  isPaidLive: false,
};

function toEntitlements(
  user: {
    id: string;
    tier: string;
    stripeStatus: string | null;
    stripePriceId: string | null;
    stripeCurrentPeriodEnd: Date | null;
  } | null
): Entitlements {
  if (!user) return ANONYMOUS;

  const tier = effectiveTier(user);
  return {
    userId: user.id,
    exists: true,
    tier,
    storedTier: normalizeTier(user.tier),
    stripeStatus: user.stripeStatus,
    stripePriceId: user.stripePriceId,
    stripeCurrentPeriodEnd: user.stripeCurrentPeriodEnd,
    isPaidLive: tier !== "STARTER",
  };
}

/**
 * Read a member's entitlement straight from the database.
 * Fails closed: any lookup error yields a STARTER entitlement.
 */
export async function getEntitlements(
  userId: string | null | undefined
): Promise<Entitlements> {
  if (!userId) return ANONYMOUS;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        tier: true,
        stripeStatus: true,
        stripePriceId: true,
        stripeCurrentPeriodEnd: true,
      },
    });
    return toEntitlements(user);
  } catch (err) {
    console.error("[entitlements] lookup failed, failing closed:", err);
    return { ...ANONYMOUS, userId };
  }
}

/** Convenience wrapper for server components / route handlers that already call `auth()`. */
export async function getSessionEntitlements(): Promise<Entitlements> {
  const session = await auth();
  return getEntitlements(session?.user?.id ?? null);
}
