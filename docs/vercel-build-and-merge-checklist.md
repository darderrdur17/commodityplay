# Vercel build failure + merge readiness

Branch: `security/audit-2026-09-26` · Failed deployment: `dpl_8nqC9QvJkwFxa6BGV4v7dNJe3s`

**Status: the merge blocker is now fixed in code.** You no longer need to hand-run
SQL before merging. One Vercel dashboard change is still required (below).

---

## 1. Why the Vercel build failed — not a code defect

The build runs `build:content && prisma generate && sync:cms && next build --webpack`.
It died in `sync:cms` with:

```
Can't reach database server at `localhost:5432`
```

**The Preview environment has `DATABASE_URL` set to a `localhost` value.**

Proven by discriminating the three possible Prisma failure modes:

| `DATABASE_URL` | Prisma error |
| --- | --- |
| not set | `Environment variable not found: DATABASE_URL` |
| set but empty (`""`) | `... resolved to an empty string` |
| **set to `localhost:5432`** | **`Can't reach database server at localhost:5432`** |

Only the third matches the Vercel log, so the variable is present in Preview — it
just points at a laptop.

### Fix (Vercel dashboard — only you can do this)

**Settings → Environment Variables → `DATABASE_URL`** must be the Neon pooled
connection string (`...neon.tech...?sslmode=require`) for **Production, Preview
and Development**. Check that Preview is not overriding it with a local value.

### Hardening worth doing later

`sync:cms` **skips silently when `DATABASE_URL` is unset** but **hard-fails the
deploy when it is set and unreachable**. So a missing variable ships a silently
broken CMS, while a stale one blocks the deploy. Consider failing loudly when
unset under `VERCEL=1`, and retrying with backoff when unreachable.

---

## 2. The merge blocker — RESOLVED in code

**Background.** There is no `prisma/migrations/` directory, and nothing in the
build or deploy pipeline runs `prisma migrate deploy` or `prisma db push`. Schema
changes were applied by hand, so a deploy could ship code referencing a column the
database did not have yet.

The security commit added `User.tokenVersion` and
`MentorQuestion.memberShareOptIn`. Prisma's **default `select` returns every scalar
field**, so any un-`select`ed `prisma.user.create/update/findUnique` emits
`"tokenVersion"`. Deploying ahead of the column would have broken sign-in, signup,
the Stripe webhook and more.

**Why the existing migration file was not enough.** `db-schema-migrations.ts`
contained `ADD COLUMN ... "mentorShareOptIn"` — a *different, pre-existing* column
— plus the `AdminAuditLog` table. It did **not** add `memberShareOptIn`, did not
add `tokenVersion`, and did not add the `KnowledgeTestResult` foreign key. It
looked like it covered the change; it did not.

### What was implemented

1. **`CORE_MIGRATION_SQL`** (`src/lib/db-schema-migrations.ts`) — additive,
   idempotent, tolerant DDL for the three gaps:
   - `User.tokenVersion INTEGER NOT NULL DEFAULT 0`
   - `MentorQuestion.memberShareOptIn` — **renames** the legacy `isPublic` column
     when present (preserving consent members already gave), otherwise adds it
   - `KnowledgeTestResult` → `User` foreign key, added **`NOT VALID`** so it can
     never fail on pre-existing orphan rows and never has to delete data. The
     constraint is still enforced for all new writes.
2. **`ensureCoreInfrastructure()`** (`src/lib/setup-database.ts`) — cached per
   lambda, **deliberately non-fatal**: a best-effort repair must never break a path
   that already works. It logs on failure and retries on the next call.
3. **`src/instrumentation.ts`** (NEW) — Next.js server-startup hook. Runs before
   any request is served, on the Node runtime, so **every** route is covered
   rather than only the ones that call a bootstrap helper.

### Verified against real Postgres

- 13/13 assertions passed on a simulated pre-migration database: column added,
  legacy `isPublic` **renamed with consent data preserved**, FK created and left
  `NOT VALID`, **orphan row NOT deleted**, FK enforced for new writes, no-op on an
  empty database, and safe to re-run.
- Full `npm run build` passes (all routes + `ƒ Proxy (Middleware)`).
- **End-to-end:** reset a database to pre-migration shape (`tokenVersion` absent),
  started the production server, and `POST /api/auth/register` — a route with **no**
  ensure call of its own — returned **HTTP 201** with the column auto-created and
  the new row carrying `tokenVersion = 0`.

`prisma/manual-migrations-2026-09-26.sql` is now **optional**. It remains the path
to a fully *validated* FK (it deletes orphan rows first, then validates), whereas
the runtime version leaves the constraint `NOT VALID` to guarantee it cannot fail.

---

## 3. Still required from you

```
ADMIN_EMAILS=frances@commodityplay.ai
```

in Vercel for **all** environments. It **fails closed** — unset in production means
nobody gets admin, including Frances.

---

## 4. Bugs found and fixed during this pass

| Bug | Impact |
| --- | --- |
| `export const MOBILE_JWT_ISSUER` in `api/mobile/auth/login/route.ts` | **Broke the production build.** A Next.js route may only export HTTP verbs and a small config allow-list → `"MOBILE_JWT_ISSUER" is not a valid Route export field`. Nothing imported it; the constants were also copy-pasted into two other files, so a typo in one would silently mint tokens the others reject. Now exported once from `src/lib/mobile-auth.ts`. |
| `POST /api/setup-db` echoed `Demo1234!` for every seeded account | One leaked `SETUP_SECRET` handed over working credentials for all demo accounts. Also re-seeded those passwords on every call, undoing `neutralize-demo-accounts.sql`. Now returns no passwords, uses a constant-time secret comparison, and clears demo hashes again in production. |
| `ensureContentInfrastructure()` returned early whenever `ContentModule` existed | Meant `CMS_MIGRATION_SQL` **never ran in production** — the latent reason the schema kept drifting. The core reconciliation now runs above that fast path. |
| `vercel.json` self-rewrite | `"/api/stripe/webhook"` → itself. Dead config, removed. |
| Stripe webhook had no `maxDuration` | Could be killed mid-processing, leaving an event half-applied. Now `export const maxDuration = 60`. |
| `.env.example` out of sync | Undocumented: `ADMIN_NOTIFY_EMAIL`, `DEMO_EMAIL_LOG`, `NEXT_PUBLIC_SITE_URL`, `SETUP_SECRET`. Unused: `NEXT_PUBLIC_SALES_DEMO_URL`, `STRIPE_PUBLISHABLE_KEY`. Both annotated. |

### Confirmed NOT a problem

- `src/proxy.ts` does **not** gate the Stripe webhook (deny-list is only `/admin`,
  `/api/admin`, `/demo`).
- `SETUP_SECRET` fails **closed** (503 when unset).

---

## 5. Pre-existing issue, NOT fixed — needs your decision

`npm run build` regenerates `src/data/interview-questions-bank.json` from
`content-sources/`, and in doing so **deletes 3 questions** (`iv-c-cm-01/02/03`) and
drops the count from 18 to 15. Those questions exist in the committed file but not
in the content source, so **every build silently drops them** — including on Vercel,
which means production is likely already serving 15.

I reverted the file so this PR does not take responsibility for deleting content.
Decide whether to add those questions to `content-sources/` (so they survive) or
accept the removal.

Related: the build writes into tracked source files (`src/data/*.ts`, `*.json`),
so every build dirties the working tree. Generated artifacts probably should not be
committed.

---

## 6. What is in this change set

```
 .env.example                               | documented/annotated env vars
 src/app/api/mobile/auth/login/route.ts     | import shared JWT constants
 src/app/api/mobile/auth/register/route.ts  | import shared JWT constants
 src/app/api/setup-db/route.ts              | hardening
 src/app/api/stripe/webhook/route.ts        | maxDuration
 src/lib/auth.ts                            | ensure core schema before User query
 src/lib/content/repository.ts              | ensure core schema above fast path
 src/lib/db-schema-migrations.ts            | CORE_MIGRATION_SQL
 src/lib/mobile-auth.ts                     | shared JWT constants + ensure
 src/lib/setup-database.ts                  | ensureCoreInfrastructure + demo neutraliser
 vercel.json                                | removed no-op rewrite
 src/instrumentation.ts                     | NEW — startup schema reconciliation
```

Verified: `tsc --noEmit` clean · full `npm run build` passes · migration proven
against real Postgres 14.20.
