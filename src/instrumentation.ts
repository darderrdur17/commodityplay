/**
 * Next.js server-startup hook.
 *
 * Runs once per server process (and once per lambda cold start on Vercel) before
 * any request is served, on the Node.js runtime.
 *
 * WHY THIS EXISTS
 *   The 2026-09-26 security pass added `User.tokenVersion` and
 *   `MentorQuestion.memberShareOptIn`. This project has no `prisma/migrations/`
 *   directory and nothing in the build runs `prisma migrate deploy`, so those
 *   columns are reconciled at runtime by `ensureCoreInfrastructure()`.
 *
 *   Calling that helper from each route that touches a `User` row is not enough.
 *   Prisma's default `select` returns EVERY scalar field, so an un-`select`ed
 *   `prisma.user.create(...)`, `prisma.user.update(...)` or
 *   `prisma.user.findUnique(...)` all emit `"tokenVersion"` in their SQL. There
 *   are dozens of such call sites — including web signup and the Stripe webhook,
 *   neither of which previously bootstrapped the schema. Missing even one would
 *   break that feature until someone happened to hit a path that did bootstrap.
 *
 *   Reconciling here closes the gap for every route at once, so the security
 *   commit can be deployed without anyone hand-running
 *   `prisma/manual-migrations-2026-09-26.sql` first.
 *
 * The SQL involved is additive, idempotent and tolerant, so repeating it on every
 * cold start is safe. The per-request `ensureCoreInfrastructure()` calls remain in
 * place as a cheap, cached fallback.
 */
export async function register() {
  // Only the Node.js runtime can open a Postgres connection; the Edge runtime
  // has no TCP sockets. The middleware bundle must skip this.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  try {
    const { ensureCoreInfrastructure } = await import("@/lib/setup-database");
    await ensureCoreInfrastructure();
  } catch (err) {
    // Deliberately non-fatal. A migration problem should surface as a normal
    // request error, not as a server that refuses to boot — the per-request
    // fallbacks still run, and a genuinely unreachable database will fail
    // loudly on the request that needs it.
    console.error("[instrumentation] core schema reconciliation failed:", err);
  }
}
