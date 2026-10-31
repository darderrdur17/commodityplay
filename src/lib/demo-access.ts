import { BRAND_EMAIL_HELLO } from "@/lib/brand";

/**
 * Frances's live login — she opens /demo with this email, then switches into
 * Maya/Chris/etc.
 *
 * This is an **identity** (which account may open the internal demo switcher),
 * deliberately NOT a contact address. It is written as its own literal and no
 * longer tracks `BRAND_EMAIL_SUPPORT`. On 11 Oct 2026 the owner retired
 * `frances@commodityplay.ai` as a contact and consolidated support onto
 * `hello@`, but Frances's own account still signs in as `frances@`, so the demo
 * switcher must keep recognising her identity. Aliasing this to
 * `BRAND_EMAIL_SUPPORT` would have silently switched the demo identity to
 * `hello@` and locked Frances out until she had a `hello@` account.
 */
export const FRANCES_DEMO_LOGIN_EMAIL = "frances@commodityplay.ai";

/**
 * Operator inboxes that may open the internal demo switcher.
 *
 * Both Frances's account and the consolidated `hello@` support inbox are
 * listed, so demo access survives the transition in either direction.
 * De-duplicated.
 */
export const INTERNAL_DEMO_EMAILS = Array.from(
  new Set([
    FRANCES_DEMO_LOGIN_EMAIL.toLowerCase(),
    BRAND_EMAIL_HELLO.toLowerCase(),
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
