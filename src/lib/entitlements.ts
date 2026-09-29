import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminEmail } from "@/lib/admin-access";
import {
  effectiveTier,
  normalizeTier,
  tierRank,
  type BillingTier,
  type EntitlementFields,
} from "@/lib/billing";

/**
 * Authoritative entitlement lookup.
 *
 * `session.user.tier` comes from the Auth.js JWT and is only refreshed on
 * `trigger === "update"`, with no `maxAge` — so a refunded or lapsed member can keep
 * a paid tier baked into their token for up to 30 days. Every authorisation decision
 * must therefore read the database through this module instead.
 *
 * ADMINISTRATOR OVERRIDE: this module is the single place that rule is implemented.
 * An allowlisted administrator (see `src/lib/admin-access.ts`) is a superadmin and
 * resolves to ELITE regardless of what they have paid for. Authority is keyed on the
 * email stored on their `User` row — never on `User.role`, never on a client-supplied
 * value and never on the JWT-cached email. Fails closed: an absent email, an empty
 * allowlist, or `ADMIN_EMAILS` unset in production all deny the override.
 */

export interface Entitlements {
  /** Resolved user id, or "" when there is no signed-in user. */
  userId: string;
  /** False when the user row could not be found (deleted account / stale session). */
  exists: boolean;
  /**
   * AUTHORITATIVE tier for access checks, computed from the DB row via
   * `resolveAccessTier()`. Reads ELITE for an allowlisted administrator even
   * though they have paid for nothing.
   */
  tier: BillingTier;
  /**
   * True when the caller is on the `ADMIN_EMAILS` allowlist, keyed on the DB
   * `email` for this `userId`. Authority only — it grants nothing by itself.
   */
  isAdmin: boolean;
  /**
   * Raw tier as persisted on the user row.
   * COSMETIC ONLY (badges, greetings) — it can read PRO/ELITE while the
   * entitlement has actually lapsed.
   */
  storedTier: BillingTier;
  stripeStatus: string | null;
  stripePriceId: string | null;
  stripeCurrentPeriodEnd: Date | null;
  /**
   * True when a PAID entitlement (PRO or ELITE) is genuinely live right now.
   * Deliberately admin-unaware: an administrator is not a paying customer, so
   * this reports the real billing state and stays false for an unpaid admin.
   */
  isPaidLive: boolean;
}

const ANONYMOUS: Entitlements = {
  userId: "",
  exists: false,
  tier: "STARTER",
  isAdmin: false,
  storedTier: "STARTER",
  stripeStatus: null,
  stripePriceId: null,
  stripeCurrentPeriodEnd: null,
  isPaidLive: false,
};

/**
 * Fields needed to resolve an access tier, including the allowlist key.
 * `EntitlementFields` is widened by exactly one optional column so existing callers
 * stay assignable.
 */
export interface AccessTierFields extends EntitlementFields {
  email?: string | null;
}

/**
 * Resolve the tier a caller must be TREATED AS for every access check, including the
 * administrator override.
 *
 * Synchronous and dependency-light on purpose: a call site that already holds a
 * `User` row only needs `email: true` in its `select`, not a second database query.
 *
 * ADMINISTRATOR OVERRIDE — the only place this rule is implemented.
 *
 * Authority comes from the `ADMIN_EMAILS` allowlist (see `src/lib/admin-access.ts`),
 * keyed on the email stored on the caller's `User` row. It is never derived from
 * `User.role` (writable data, deliberately ignored), from a client-supplied value, or
 * from the JWT-cached email. An allowlisted administrator is a superadmin and
 * therefore resolves to ELITE, opening every tier gate in the app regardless of what
 * they have paid for.
 *
 * Fails closed: `isAdminEmail()` returns false for an absent email, and
 * `getAdminEmails()` returns `[]` in production when `ADMIN_EMAILS` is unset — so a
 * missing allowlist denies the override rather than granting it.
 */
export function resolveAccessTier(
  user: AccessTierFields | null | undefined
): BillingTier {
  if (isAdminEmail(user?.email)) return "ELITE";
  return effectiveTier(user);
}

/**
 * Admin-aware sibling of the billing-tier rank check: does this row clear `requiredTier`?
 * Prefer this for every authorisation decision.
 */
export function hasResolvedAccess(
  user: AccessTierFields | null | undefined,
  requiredTier: string | null | undefined
): boolean {
  return tierRank(resolveAccessTier(user)) >= tierRank(requiredTier);
}

function toEntitlements(
  user: {
    id: string;
    email: string;
    tier: string;
    stripeStatus: string | null;
    stripePriceId: string | null;
    stripeCurrentPeriodEnd: Date | null;
  } | null
): Entitlements {
  if (!user) return ANONYMOUS;

  return {
    userId: user.id,
    exists: true,
    // What to AUTHORISE against: ELITE for an allowlisted administrator.
    tier: resolveAccessTier(user),
    // Whether the caller is an administrator at all (allowlist, DB-keyed).
    isAdmin: isAdminEmail(user.email),
    storedTier: normalizeTier(user.tier),
    stripeStatus: user.stripeStatus,
    stripePriceId: user.stripePriceId,
    stripeCurrentPeriodEnd: user.stripeCurrentPeriodEnd,
    // REAL billing state — not the override. `effectiveTier()` is admin-unaware
    // by design, so an unpaid administrator correctly reports `false` here.
    isPaidLive: effectiveTier(user) !== "STARTER",
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
        // The allowlist key for the administrator override in `resolveAccessTier()`.
        email: true,
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
