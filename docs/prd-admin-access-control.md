# PRD — Admin Access Control & Customer Database (CommodityPlay)

## 1. Project Information

| Field | Value |
| --- | --- |
| Language | English |
| Project Name | `commodityplay` |
| Stack | Next.js 15 (App Router) + Prisma + Neon Postgres + Stripe + Auth.js v5 |
| Scope | `/admin`, `/admin/database`, `/api/admin/*`, `/demo`, credential sign-in |
| Status | Draft for Architect + Engineer |
| Author | 许清楚 (Xu), Product Manager |

### Original requirement (verbatim)

> "ensure users admin account can take a look on the database of the customers and also at the same time can you check on that the admin account (Frances) the one that can only check on the admin side"

### Decisions already made by the business owner (not up for debate)

1. **Sole admin by email allowlist.** Only `francestho@gmail.com` may reach `/admin`, `/admin/database` and every `/api/admin/*` route. Any other account — **including any other user whose `role` is `ADMIN`** — is refused. This must hold even if someone later flips another user's role to ADMIN.
2. **Demo accounts locked to non-production.** `admin@demo.com` and the other seeded demo accounts (all share password `Demo1234!`) stay usable for local/dev only. In production they are blocked from signing in **and** blocked from admin. `/demo` stays gated to Frances.

### Current state (as found in the working copy)

| Surface | Current gate | Gap |
| --- | --- | --- |
| `src/proxy.ts` | `req.auth.user.role !== "ADMIN"` → redirect `/dashboard` | Any ADMIN passes |
| `src/app/admin/page.tsx` | `session.user.role !== "ADMIN"` → redirect `/dashboard` | Any ADMIN passes |
| `src/app/admin/database/page.tsx` | `session.user.role !== "ADMIN"` → redirect `/dashboard` | Any ADMIN passes |
| 14 routes under `src/app/api/admin/*` | `requireAdmin()` → `403` | `requireAdmin()` = `role === "ADMIN"` only |
| `src/lib/auth.ts` → `requireAdmin()` | role check only | No email check |
| `src/lib/demo-access.ts` → `canAccessInternalDemo()` | `isAdmin(role)` **OR** allowlist | Any ADMIN passes |
| `prisma/seed.ts` | seeds `admin@demo.com` (role ADMIN) | Seeds into whatever DB it targets |

Key defect to flag: `src/lib/admin-database.ts:138` **SELECTs `passwordHash`** only to derive `hasPassword: Boolean(user.passwordHash)`. The value crosses the query boundary into JS. See FR-3.

---

## 2. Product Definition

### Product Goals

1. **One operator, one key.** Guarantee that Frances is the only human who can reach any admin surface, enforced server-side, and that this stays true regardless of anyone's `role` value.
2. **Run the business from one screen.** Give Frances a customer database view complete enough to answer "who is paying, who is active, who is stuck" without a SQL client.
3. **Zero PII leakage by construction.** Admin reads and admin API responses never serialise credentials, password hashes, OAuth tokens or session tokens — enforced by an explicit DTO, not by discipline.

### User Stories

1. As **Frances (owner)**, I want `/admin` to open for me and for nobody else, so that no employee, demo account or compromised role grant can reach customer data.
2. As **Frances**, I want to see each member's tier, Stripe status and renewal date, so that I know who is actually paying me this month.
3. As **Frances**, I want to see each member's persona, onboarding state and last activity, so that I can spot stalled signups and follow up.
4. As **Frances**, I want to search and filter members by tier / Stripe status / persona, so that I can answer "how many Elite are past due?" in one click.
5. As **a developer**, I want demo accounts to keep working locally but be inert in production, so that a shared `Demo1234!` password is never a live attack path.

---

## 3. Requirements Pool

### FR-1 — Sole-admin allowlist

**P0 — MUST**

- Introduce a single server-side predicate, e.g. `isSoleAdmin(user)`, that returns true **only** when the user's verified email is in the admin allowlist. `role === "ADMIN"` must **not** be sufficient on its own.
- Replace every admin gate with it:
  - `src/lib/auth.ts` → add `requireSoleAdmin()` alongside `requireAdmin()`; all 14 `/api/admin/*` handlers must call `requireSoleAdmin()`.
  - `src/app/admin/page.tsx` and `src/app/admin/database/page.tsx` → enforce server-side before any query runs.
  - `src/proxy.ts` → `/admin` branch must use the same predicate (defence in depth, not the sole gate).
- **Denial semantics — recommended: `404` (notFound), not redirect and not 403.**
  - Page routes: call `notFound()`.
  - API routes: `404` with body `{ "error": "Not found" }`.
  - Justification: `403` and `redirect` both confirm that an admin surface exists and that the caller is specifically excluded, which is a useful enumeration signal for an attacker probing with stolen demo credentials. `404` discloses nothing. A redirect is additionally followable by non-browser clients. `403` is an acceptable fallback only if the team prefers honest HTTP semantics over non-disclosure.
- **Email resolution must not trust the JWT alone.** Session strategy is JWT and `token.email` is written at sign-in; a DB email change leaves the token stale. The gate MUST resolve the current email from the DB by `session.user.id` (`prisma.user.findUnique({ select: { email: true } })` — indexed, cheap) and compare that to the allowlist. Compare case-insensitively on `trim().toLowerCase()`.
- **Hiding a nav link is not access control.** Nav/menu/header links may be hidden for UX, but enforcement must exist independently in the proxy layer, in each admin page server component, and in each admin API handler.
- **Observability.** Every refusal must log `console.warn("[admin-access] denied", { userId, email, path })`. Frances being locked out must be diagnosable from logs without shipping a user-visible error message.

**Acceptance criteria**
- AC1.1 — Signed-in user with `role = "ADMIN"` and email `admin@demo.com` requesting `/admin` receives HTTP 404.
- AC1.2 — Same user requesting `GET /api/admin/users` receives HTTP 404 and no user data.
- AC1.3 — A `USER`-role account manually promoted to `ADMIN` in the DB still receives 404 on `/admin` and `/api/admin/*`.
- AC1.4 — Frances (`francestho@gmail.com`) reaches `/admin`, `/admin/database` and `GET /api/admin/users` with HTTP 200.
- AC1.5 — Direct URL navigation to `/admin` (no in-app link) is still refused for non-allowlisted users.
- AC1.6 — Renaming Frances's DB email to a non-allowlisted value revokes her access without requiring her to sign out.

### FR-2 — Customer database view

**P0 — MUST** (add to `/admin/database` → Members, alongside existing name / email / company / role / tier / track / isMentor / hasPassword / createdAt)

- **Billing**
  - `stripeStatus` → badge (`active` / `past_due` / `canceled` / `inactive`). This is the single most important missing field; Frances cannot tell who is paying today.
  - `stripeCurrentPeriodEnd` → "Renews / Expires" date. Elite is SGD 299/month, so this drives renewal chasing.
- **Persona & activation**
  - `persona` (`FRESH_GRAD` / `CAREER_SWITCHER` / `INSIDER` / `ANALYST_TRADER` / `VENDOR`). Already returned by `/api/admin/users` but absent from `/admin/database` — unify.
  - `onboardingDone` → "Onboarded: Yes/No". Identifies signups that never started.
- **Activity**
  - `updatedAt` on `User` → cheap proxy for "last activity", already on the model, no extra query.
- **Engagement**
  - `mentorCredits` and `resumeCredits` → numeric balances. Frances grants these; she must see them.
  - Mentor questions used in the last 30 days → already computed in `src/app/api/admin/users/route.ts` (`prisma.mentorQuestion.groupBy`); reuse that logic instead of re-deriving.

**P1 — SHOULD**

- Filter chips on Members: tier, track, `stripeStatus`, persona, `onboardingDone`. Search today matches only name/email/company; filters are how Frances answers business questions.
- Sort control: joined date, last activity.
- `jobWaitlist` (bool) → "Job waitlist: Yes/No".
- `stripePriceId` rendered as a **derived plan label** ("Elite — monthly"), never as a raw `price_…` string.
- `stripeCustomerId` shown **masked** (`cus_…Q4f2`) with copy-to-clipboard, so Frances can find the customer in the Stripe dashboard without bulk-exposing identifiers.
- Fix the row-cap copy. Today the header says "of first 200" only when `users.length === 200`; show `Showing 200 of 1,284` always (reuse the `User` count already in `tables`).
- Add an explicit "Sensitive fields are hidden" note in the Members header (the existing copy says "Passwords stay hashed" — keep, and make it true).

**P2 — NICE TO HAVE**

- `stripeSubscriptionId` behind a per-row "reveal" click.
- True last-seen from `Session` / `ChapterProgress.updatedAt` (extra query; defer).
- `resumePersonaDone`.
- CSV export of the current filtered Members view — allowlist-gated and DTO-filtered, never a raw table dump.

**Acceptance criteria**
- AC2.1 — Each Members row shows tier, `stripeStatus` and `stripeCurrentPeriodEnd`.
- AC2.2 — Frances can filter Members to `stripeStatus = past_due` in ≤ 2 clicks.
- AC2.3 — Members list shows total matching count, not just the 200-row cap.
- AC2.4 — `/admin/database` Members and `GET /api/admin/users` return the same field set for shared concepts (tier, persona, credits).

### FR-3 — PII handling rule

**P0 — MUST**

- **Never serialise, in any admin page payload or `/api/admin/*` response:**
  - `User.passwordHash`
  - `Account.access_token`, `refresh_token`, `id_token`, `token_type`, `scope`, `session_state`
  - `Session.sessionToken`
  - `VerificationToken.token`
  - Any Stripe secret (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*` (secret IDs))
- **Explicit DTO, always.** Every admin read must use a Prisma `select` naming exactly the fields to expose, then pass through a single mapper (e.g. `toAdminUserDto()`). A bare `prisma.user.findMany()` with no `select` is a review-blocking defect.
- **Fix `src/lib/admin-database.ts:138`.** Do not SELECT `passwordHash`. Derive `hasPassword` inside the database instead, e.g. a `$queryRaw` projecting `(password_hash IS NOT NULL AND password_hash <> '') AS "hasPassword"` (confirm the column name — it is `passwordHash` unless a `@@map` overrides it), so the hash never materialises in JS or JSON.
- **Field of concern:** the Overview tab currently counts `Account`, `Session` and `VerificationToken` rows. Row counts are fine; if any inspector view for these tables is ever added, it must use the DTO and never expose tokens.
- Add a regression test asserting that no admin payload key matches `/hash|token|secret|password/i`.

**P1 — SHOULD**

- Centralise the DTO so `/admin/database` and `/api/admin/users` share one implementation.
- Keep audit logs (`[admin-access] denied`) free of token/secret values; logging `userId` and `email` is intended and sufficient.

**Acceptance criteria**
- AC3.1 — No response body from `/admin/database` or any `/api/admin/*` route contains a `passwordHash`, `sessionToken` or OAuth token field.
- AC3.2 — `searchAdminDatabaseUsers()` no longer selects `passwordHash`, yet `hasPassword` still renders correctly.
- AC3.3 — Automated test asserts the payload key deny-list above.

### FR-4 — Production demo lock

**P0 — MUST**

- Add one runtime helper (e.g. `isProductionRuntime()` in `src/lib/env.ts`) = `process.env.NODE_ENV === "production"`. Use it everywhere; do not scatter `NODE_ENV` checks.
- **Credential sign-in (`authorize()` in `src/lib/auth.ts`):** in production, reject any email that is a demo account — i.e. ends with `@demo.com` **or** appears in `DEMO_ACCOUNTS` (`src/data/demo-accounts.ts`). Return `null` so Auth.js produces the **generic** "Invalid email or password" error. Do **not** return a specific "demo login disabled" message — that confirms the account exists.
- **`/demo`:** gate on `canAccessInternalDemo()` redefined as `isSoleAdmin(user) || (!isProductionRuntime() && (isAdmin(role) || isDemoAccount(email)))`. Net effect: Frances keeps `/demo` everywhere; demo/ADMIN accounts keep `/demo` in local and dev only.
- **Defence in depth:** admin gates (FR-1) must not depend on FR-4. If a demo session somehow exists in production, FR-1 still refuses it.
- **`/login` UI:** hide demo quick-login buttons in production (cosmetic — the server-side `authorize()` block is the real control).

**P1 — SHOULD**

- `prisma/seed.ts`: refuse to seed demo accounts when the target `DATABASE_URL` is not a local/Neon-branch database, unless `ALLOW_DEMO_SEED=true`. Prevents demo accounts reaching production data by accident.

**Acceptance criteria**
- AC4.1 — In production, signing in as `admin@demo.com` / `Demo1234!` fails with the generic credential error.
- AC4.2 — In production, `admin@demo.com` never reaches `/admin`, `/admin/database` or `/api/admin/*` (follows from AC1.1/AC1.2).
- AC4.3 — In production, a non-allowlisted user requesting `/demo` is redirected to `/dashboard`.
- AC4.4 — Frances still reaches `/demo` in production.
- AC4.5 — Locally (`npm run dev`), `admin@demo.com` still signs in and still reaches `/demo` and `/admin`.

### FR-5 — Configurability

**P0 — MUST**

- Source of truth: **server-only env var `ADMIN_EMAILS`**, comma-separated, parsed with `split(",").map(e => e.trim().toLowerCase()).filter(Boolean)`. Server-only — never `NEXT_PUBLIC_`.
- **Fallback default when unset:** `["francestho@gmail.com"]` (keeps the shipped product working without env setup). Log a warning when this fallback is used in production so the team notices missing config.
- **Fail closed when the resolved allowlist is empty** — i.e. `ADMIN_EMAILS` is set but blank or unparseable. Every admin gate denies, returns 404, and logs `[admin-access] allowlist resolved empty; all admin access denied` at error level. **Nobody gets admin**, including Frances. Recovery is a one-line env change plus redeploy; this is deliberate — a blank env var must never mean "everyone is admin".
- Keep the existing `FRANCES_DEMO_LOGIN_EMAIL` constant in `src/lib/demo-access.ts` as the fallback source so there is one definition of Frances's email.

**P1 — SHOULD**

- Document `ADMIN_EMAILS` in `.env.example`.
- Normalise allowlist parsing in one module (e.g. `src/lib/admin-access.ts`) consumed by `auth.ts`, `proxy.ts`, both admin pages and `demo-access.ts`.
- Adding a second operator later is an env change only — no code change, no redeploy of new logic.

**Acceptance criteria**
- AC5.1 — `ADMIN_EMAILS="francestho@gmail.com,ops@commodityplay.ai"` grants admin to both, case-insensitively, after a fresh request.
- AC5.2 — `ADMIN_EMAILS=""` in production denies admin to everyone, including Frances, and logs the empty-allowlist error.
- AC5.3 — With `ADMIN_EMAILS` unset, `francestho@gmail.com` still has admin.
- AC5.4 — `ADMIN_EMAILS` is never exposed to the client bundle.

---

## 4. UI / Behaviour Notes

**`/admin/database` → Members** — keep the existing four tabs (Overview / Members / Newsletter / Contact Us). Members table gains these columns in order:

`Member (name · email · company)` · `Tier` · `Billing (stripeStatus badge + renewal date)` · `Track` · `Persona` · `Onboarded` · `Credits (mentor / resume)` · `Mentor Qs (30d)` · `Job waitlist` · `Password` · `Joined` · `Last activity`

- Keep `hasPassword` as `Set` / `Not set` — Frances needs it to tell credential users from Google-only users — but source it per FR-3.
- `Role` stays visible so Frances can see accidental ADMIN grants; that is the whole point of FR-1.
- Keep existing row caps (200 / 200 / 100) and the search box; add filter chips above the table.
- Table gets `min-w-[1200px]` (up from `880px`) to fit the new columns; keep horizontal scroll on mobile.

**Denied access** — render `notFound()` (404). No "you are not an admin" copy, no redirect. Cosmetic nav links may be hidden but must never be the only control.

**`/demo`** — unchanged visually. Production behaviour differs only by who can open it.

**`/login`** — demo quick-login block hidden in production; identical generic error for a blocked demo sign-in.

---

## 5. Open Questions

1. **Frances's sign-in method.** Does she sign in with Google or a password? If Google, confirm `francestho@gmail.com` is the Google identity — the allowlist compares the DB email, and a Google account with a different primary address would silently lock her out.
2. **Second operator timeline.** Does Frances need a backup operator now? If yes, we set `ADMIN_EMAILS` at deploy time; no code change needed.
3. **404 vs 403.** I recommend 404 for non-disclosure. Confirm the team accepts this, since it makes genuine misconfiguration harder for Frances to self-diagnose (mitigated by server logs).
4. **Stripe dashboard handoff.** Is masked `stripeCustomerId` + copy-to-clipboard enough, or does Frances need a deep link to the Stripe customer page?
5. **`updatedAt` as "last activity".** Acceptable proxy at launch, or is true last-seen (from `Session`) required now?
6. **CSV export.** Confirm whether Frances needs it at launch, and if so whether it should exclude Newsletter and Contact Us (highest-PII tables).
