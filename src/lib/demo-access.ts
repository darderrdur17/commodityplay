import { BRAND_EMAIL_SUPPORT } from "@/lib/brand";

/**
 * Frances's live login — she opens /demo with this email, then switches into
 * Maya/Chris/etc.
 *
 * Kept as its own constant because `scripts/verify-feedback-changes.ts` asserts
 * on it, but it is now the same address as `BRAND_EMAIL_SUPPORT`: the previous
 * value was her address before the move to the `commodityplay.ai` domain.
 */
export const FRANCES_DEMO_LOGIN_EMAIL = BRAND_EMAIL_SUPPORT;

/**
 * Operator inboxes that may open the internal demo switcher.
 * De-duplicated — the two sources above are now the same address.
 */
export const INTERNAL_DEMO_EMAILS = Array.from(
  new Set([
    FRANCES_DEMO_LOGIN_EMAIL.toLowerCase(),
    BRAND_EMAIL_SUPPORT.toLowerCase(),
  ])
);

/**
 * Whether `user` may open the internal demo switcher.
 *
 * Access is decided by email alone. `role` is writable data and is no longer
 * consulted: a `role = 'ADMIN'` row with a non-operator email grants nothing.
 */
export function canAccessInternalDemo(user?: {
  role?: string | null;
  email?: string | null;
} | null): boolean {
  if (!user) return false;
  const email = user.email?.trim().toLowerCase();
  return Boolean(email && INTERNAL_DEMO_EMAILS.includes(email));
}
