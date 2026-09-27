# Cursor prompt — finish the remaining work

> Paste everything below this line into Cursor (Agent mode). It is self-contained.

---

You are working in the **CommodityPlay.** repository on branch `security/audit-2026-09-26`
(HEAD `afb4880`). A security pass was just completed and the app was made deployable
without hand-run SQL. Your job is to **review the current state, find and fix every
remaining error, bug or incomplete task, and run the project end-to-end until it builds
and works.**

## 1. Goal

Produce a working, deployable application: `npm run build` passes, the app boots and
serves pages against a real Postgres, the admin surface works for the sole admin, and
every partially-implemented feature is either finished or explicitly reported as
incomplete. **Verify each fix as you go** — do not claim something works without
running it.

## 2. Stack and layout

| | |
| --- | --- |
| Framework | **Next.js 16.2.9**, App Router, `src/` directory |
| Build command | `npm run build` = `build:content && prisma generate && sync:cms && next build --webpack` |
| ORM | **Prisma 5.22.0** → Neon Postgres |
| Auth | **Auth.js v5** (`next-auth`), JWT strategy, `PrismaAdapter`, Credentials + Google |
| Payments | Stripe (Pro = one-time, Elite = monthly subscription) |
| Email | Resend |
| Mobile | Expo app in `mobile/` (shares the web API) |

Key files:

```
src/proxy.ts                      middleware (Next 16 convention — see gotchas)
src/instrumentation.ts            startup hook, reconciles DB schema before requests
src/lib/setup-database.ts         ensureCoreInfrastructure(), runtime DDL runner
src/lib/db-schema-migrations.ts   CMS_MIGRATION_SQL / FEATURES_MIGRATION_SQL / CORE_MIGRATION_SQL
src/lib/admin-access.ts           sole-admin email allowlist (ADMIN_EMAILS)
src/lib/demo-guard.ts             blocks @demo.com accounts in production
src/lib/canonical-host.ts         canonical domain + blocked Vercel aliases
src/lib/brand.ts                  BRAND_DOMAIN / BRAND_SITE_URL
src/lib/mobile-auth.ts            mobile JWT verify + MOBILE_JWT_ISSUER/AUDIENCE
scripts/sync-cms-build.ts         build step that pushes content into the DB
prisma/schema.prisma              the schema
prisma/manual-migrations-2026-09-26.sql   now optional (see §5.8)
```

## 3. Critical gotchas — read before touching anything

1. **`src/proxy.ts` IS the middleware.** There is no `src/middleware.ts`; Next 16 uses
   `proxy.ts`. Do not create `middleware.ts`.
2. **A Next.js route file may only export HTTP verbs and a small config allow-list**
   (`GET`, `POST`, `dynamic`, `revalidate`, `maxDuration`, `runtime`, …). Exporting an
   arbitrary constant from a route file **breaks the production build** with
   `"X" is not a valid Route export field`. This already bit
   `src/app/api/mobile/auth/login/route.ts`.
3. **`npx next build` is NOT equivalent to `npm run build`.** It skips `build:content`,
   `sync:cms` and `--webpack`. A green `next build` proves nothing about CI.
4. **`sync:cms` needs a reachable `DATABASE_URL`.** It exits 1 when the DB is unreachable
   (this is what failed on Vercel) and silently skips when `DATABASE_URL` is unset.
5. **`prisma.user.create/update/findUnique` without `select` return EVERY scalar field**,
   so they emit `"tokenVersion"` in SQL. Any new query touching `User` is covered by the
   startup reconciliation, but do not add `select`-less queries assuming otherwise.
6. **The build writes into tracked source files** (`src/data/*.ts`, `src/data/*.json`),
   so every build dirties the working tree. See §5.1 before committing.
7. **`npm run build` needs `NODE_OPTIONS` unset only inside this specific sandbox** — in a
   normal terminal just run it.

## 4. Already done — do not redo

- `CORE_MIGRATION_SQL`: idempotent, additive, tolerant DDL for `User.tokenVersion`,
  `MentorQuestion.memberShareOptIn` (renames legacy `isPublic`, preserving consent) and the
  `KnowledgeTestResult` FK (added `NOT VALID` so it can never fail or delete data).
- `src/instrumentation.ts` reconciles the schema at server start, so **no manual SQL is
  required before deploy**.
- `/api/setup-db` no longer echoes `Demo1234!`, compares `SETUP_SECRET` in constant time,
  and re-clears demo hashes in production.
- Fixed an infinite redirect loop: the middleware now compares the **client-visible**
  host (`x-forwarded-host` → `host`), not `req.nextUrl.hostname`.
- `MOBILE_JWT_ISSUER`/`AUDIENCE` centralised in `src/lib/mobile-auth.ts`.
- `vercel.json` no-op rewrite removed; Stripe webhook got `maxDuration = 60`.
- `.env.example` reconciled.

## 5. Outstanding work

Work through these in order. **Verify each one and report.**

### 5.1 The build silently deletes 3 interview questions (highest priority)

`npm run build` regenerates `src/data/interview-questions-bank.json` from
`content-sources/` and drops `iv-c-cm-01`, `iv-c-cm-02`, `iv-c-cm-03` (count 18 → 15).
They exist in the committed file but not in the content source, so **every build removes
them — including on Vercel.** Production is probably already serving 15.

- Reproduce: `npm run build:content` then `git diff src/data/interview-questions-bank.json`.
- Decide and implement one: (a) add the three questions to the correct file under
  `content-sources/` so the extractor emits them, or (b) commit the regenerated file.
- **Ask me before deleting content.** Do not silently accept the deletion.
- Related: the build writes into tracked files. Recommend whether generated artifacts
  under `src/data/` should be git-ignored, and say so in your report rather than
  restructuring unasked.

### 5.2 `tokenVersion` is never incremented — the revocation feature is incomplete

`User.tokenVersion` is added, read and compared in `src/lib/mobile-auth.ts`, and signed
into mobile JWTs — but **nothing ever bumps it**. So the stated purpose ("bumping
invalidates every token already issued") does not work: a password reset does not
invalidate outstanding mobile tokens, which live for 7 days.

- Find every place that should bump it: password reset, password change, and any
  admin-initiated "sign out everywhere".
- Implement it, and make sure the bump is in the same transaction as the password write.
- Verify: issue a mobile token, bump the version, confirm `getMobileUser()` then returns
  `null`.

### 5.3 Audit for other illegal route exports

The build caught one (`MOBILE_JWT_ISSUER`). Grep every file under `src/app/api/**/route.ts`
and `src/app/**/page.tsx` for `export const` / `export function` / `export async function`
that are **not** HTTP verbs or Next's config allow-list, and fix them (usually by moving
the constant into `src/lib/`). Then run `npm run build` to confirm.

### 5.4 `sync:cms` failure semantics

`scripts/sync-cms-build.ts` currently:
- silently skips when `DATABASE_URL` is unset → a missing variable ships a **silently
  broken CMS**;
- hard-fails the deploy when set but unreachable → a transient blip blocks deploys.

Make it fail loudly when unset under `VERCEL=1`, and retry with backoff when unreachable.
Keep the "local build without a DB" path working.

### 5.5 Domain inconsistency (`.com` vs `.ai`)

`src/lib/canonical-host.ts` uses `www.commodityplay.ai`; `src/lib/brand.ts` sets
`BRAND_DOMAIN = "commodityplay.com"`, which drives `BRAND_SITE_URL` and the
`hello@` / `legal@` / `privacy@` addresses. The apexes `commodityplay.ai` and
`commodityplay.com` are currently registrar parking pages; the live site is only
`www.commodityplay.ai`.

Determine which domain is real (check DNS/Vercel), then align `brand.ts`. Report the
decision rather than guessing.

### 5.6 Audit `VERCEL_DEMO_SETUP.md` for hardcoded secrets

This file was flagged as containing sensitive content when I attempted to read it. It may
hold live credentials (Stripe keys, `SETUP_SECRET`, Neon URLs, demo passwords).

- Inspect it. If it contains real secrets, **treat them as compromised**: report which
  ones, recommend rotation, and do **not** paste them into any response, diff or commit.
- If it only contains placeholders, say so.
- Never commit secrets either way.

### 5.7 Extend admin audit coverage

`recordAdminAudit()` **is** wired up — it is called in
`src/app/api/admin/users/route.ts` (lines ~134 and ~181) for user edits — so the
`AdminAuditLog` table is not dead.

The gap is coverage: check whether the **other** privileged actions also audit, in
particular:

- mentor moderation: `src/app/api/admin/mentor/*` (answering, publishing to desk channel)
- content publishing / CMS writes
- `POST /api/setup-db`, which applies schema DDL and re-seeds accounts

An audit log that only covers user edits gives a false sense of completeness. Extend it to
the privileged actions above, then verify by triggering one and confirming a row lands in
`AdminAuditLog`.

### 5.8 Confirm the manual SQL files are genuinely optional

`prisma/manual-migrations-2026-09-26.sql` and `prisma/neutralize-demo-accounts.sql` are
now redundant (runtime reconciliation + `/api/setup-db` handle both). Verify that claim
against the code and update or delete the files accordingly. Do not delete the FK
validation guidance — running the manual SQL is still the only way to get a *validated*
FK, since the runtime one is `NOT VALID`.

### 5.9 In-memory rate limiting is not durable on Vercel

`src/lib/rate-limit.ts` uses an in-process `Map`. On Vercel lambdas each instance has its
own memory, so limits are per-instance and reset on cold start — a determined attacker can
exceed them by hitting many instances. Assess and report; propose a durable store
(Upstash Redis, or Neon-backed counters). **Do not implement without asking** — it adds a
dependency.

### 5.10 Full clean pass

- `npx tsc --noEmit` → 0 errors.
- `npm run build` → passes end to end (see §6 for a local DB).
- `npm start` → hit `/`, `/pricing`, `/login`, `/signup` and confirm 200s.
- Confirm the middleware does **not** loop: with `Host: www.commodityplay.ai` a page must
  return 200, and with `Host: commodityplay.vercel.app` it must 308 to the canonical host.
- Confirm no other regressions in the mobile API surface under `src/app/api/mobile/`.

## 6. Set up a local database for verification

A local Postgres 14.20 is available (Homebrew). Use a **throwaway** database, never the
production Neon instance:

```bash
export PGBIN=/opt/homebrew/Cellar/postgresql@14/14.20/bin
export PATH="$PGBIN:/Users/derr/.workbuddy-ai/binaries/node/versions/22.22.2-3/bin:$PATH"

$PGBIN/dropdb   --if-exists -h localhost -U derr cp_verify
$PGBIN/createdb            -h localhost -U derr cp_verify

export DATABASE_URL="postgresql://derr@localhost:5432/cp_verify"
export AUTH_SECRET="local-verify-placeholder-secret-32ch"
export NEXTAUTH_URL="http://localhost:3000"

npx prisma db push --skip-generate --accept-data-loss   # creates the base schema
npm run build                                           # must pass
npm start &                                             # then curl the routes
```

**Drop `cp_verify` when finished.** Never point any command at Neon.

> `npm install`'s `postinstall` runs `prisma generate`; if it fails, run
> `npx prisma generate` manually afterwards.

## 7. Constraints — do not

- **Do not push to `main`.** Stay on `security/audit-2026-09-26`. `main` auto-deploys to
  production.
- **Do not delete data** (rows, columns, tables, content files) without asking first.
- **Do not hand-run SQL against Neon.** The schema reconciles itself.
- **Do not roll back or rewrite the security fixes**: the sole-admin allowlist
  (`ADMIN_EMAILS`, never `User.role`), the demo-account lockout, the server-side paywall
  filtering, or the constant-time secret comparison.
- **Do not add dependencies** (e.g. a Redis client) without asking.
- **Do not weaken** `CORE_MIGRATION_SQL` — it must stay additive, idempotent and tolerant,
  and `ensureCoreInfrastructure()` must stay non-fatal.

## 8. Report back

For each item in §5, state:

1. What you found (with file paths and the exact error output if any).
2. What you changed (files + a one-line description each).
3. **How you verified it** — the command you ran and its output. "Should work" is not
   verification.
4. Anything still unresolved, and why.

Finish with: the result of `npx tsc --noEmit` and `npm run build`, and a clear
yes/no on whether the project is ready to deploy.
