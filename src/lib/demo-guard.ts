/**
 * Demo-account identification and production gating.
 *
 * Seeded demo inboxes all share one publicly documented password, so in
 * production they are a live bypass. Authentication must refuse them outright
 * rather than merely hiding the switcher UI.
 */

/** Every seeded demo inbox lives under this domain. */
const DEMO_EMAIL_DOMAIN = "@demo.com";

/** Addresses created by `prisma/seed.ts` / the demo account catalogue. */
export const SEEDED_DEMO_EMAILS: readonly string[] = [
  "admin@demo.com",
  "starter.fresh@demo.com",
  "starter.vendor@demo.com",
  "pro.switcher@demo.com",
  "pro.analyst@demo.com",
  "pro.vendor@demo.com",
  "elite.insider@demo.com",
  "elite.vendor@demo.com",
  "elite.mentor@demo.com",
];

/** Trim and lowercase an address for comparison. */
export function normalizeDemoEmail(email?: string | null): string {
  return (email ?? "").trim().toLowerCase();
}

/** True when the process is running as a production build/runtime. */
export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * True when `email` belongs to a seeded demo account: anything on the
 * `@demo.com` domain, plus the known addresses listed above.
 */
export function isDemoAccountEmail(email?: string | null): boolean {
  const normalized = normalizeDemoEmail(email);
  if (!normalized) return false;
  if (normalized.endsWith(DEMO_EMAIL_DOMAIN)) return true;
  return SEEDED_DEMO_EMAILS.includes(normalized);
}
