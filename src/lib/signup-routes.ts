/**
 * Free ("Starter") signup entry points.
 *
 * Every free CTA on the site funnels through the real `/signup` flow so a Starter
 * account is actually created — at the owner's request (11 Oct 2026): "for the
 * free sign up, perhaps it's better to direct to the main sign up page to free a
 * starter account". The Starter Pack pop-up used to capture an email instead and
 * never produced an account.
 *
 * The `callbackUrl` is deliberately a PATH with a query string and no fragment:
 * `/signup` re-encodes it into `/onboarding?fromSignup=1&callbackUrl=…`, and a
 * hash appended after a query param would be swallowed (R-3 in `pricing-routes`).
 */
export function starterSignupHref(track: "career" | "sales"): string {
  return `/signup?plan=starter&track=${track}&callbackUrl=/?track=${track}`;
}
