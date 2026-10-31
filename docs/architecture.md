# Architecture

How CommodityPlay fits together. For *why* a particular design was chosen, see the dated PRDs in this
folder.

## Shape of the system

```
Browser ─┬─► Vercel (Next.js 16 App Router, region sin1)
         │      ├─ Server Components  ── Prisma ──► Neon Postgres
         │      ├─ /api/*  route handlers
         │      └─ Edge proxy (src/proxy.ts)
         │
         ├─► Stripe        (subscriptions, checkout, webhooks)
         ├─► Resend        (transactional email)
         └─► Google OAuth  (optional sign-in)

Expo app ───► /api/mobile/* ── same database, token auth
```

There is **one deployable**: the Next.js app. The mobile client is a separate Expo project that
consumes the same backend over `/api/mobile/*`.

## Source layout

| Path | Contents |
|---|---|
| `src/app/` | App Router pages + API routes |
| `src/components/` | Shared React components |
| `src/lib/` | Auth, billing, entitlements, email, content plumbing |
| `src/data/` | Content data **and the single source of prices** |
| `src/proxy.ts` | Edge middleware — host canonicalisation + admin deny-list |
| `src/instrumentation.ts` | Runs `CORE_MIGRATION_SQL` on cold start |
| `prisma/schema.prisma` | Database schema |
| `scripts/` | Build-time content generation, DB setup, verification |
| `mobile/` | Expo React Native app |
| `docs/` | This folder |

## Request lifecycle

1. **`src/proxy.ts`** runs on the edge first. It canonicalises the host and returns **404** for
   unauthenticated hits on `DENY_ONLY_PREFIXES` (`/admin`, `/api/admin/*`) — a deliberate choice so a
   403 cannot confirm that the admin surface exists.
2. **Server Components** render most pages. They call `requireSoleAdminPage()` / the entitlement
   helpers directly rather than fetching from an API.
3. **`/api/*` route handlers** serve anything interactive.

## Authorisation — two independent axes

Access is **tier** × **track**. They are separate and both matter.

### Tier (how much)

`src/lib/content/modules.ts` is the registry: every content module declares a `requiredTier`. The
mapping today:

| Tier | Modules |
|---|---|
| `STARTER` | landing, faq, glossary, starter-pack, member-dashboard, site-footer, footer-guides, mentors, email-templates |
| `PRO` | playbook, resume-templates, career-roadmap, interview-questions, knowledge-test, sales-market-nudges |
| `ELITE` | case-studies, desk-channel, job-openings, mentor-connect, library, account-intelligence |

### Track (which content)

`src/lib/dashboard-module-visibility.ts`. A Career member sees `Career` + `Both` modules; a Sales
member sees `Sales` + `Both`. An admin's unfiltered preview sees everything.

### The one rule that matters most

> **Authorisation reads the database, never the session token.**

`src/lib/entitlements.ts` is the single authoritative lookup. The Auth.js JWT caches `user.tier` and
is only refreshed on an explicit update, with no `maxAge` — so a refunded or lapsed member can carry a
paid tier in their token for **up to 30 days**. `session.user.tier` is display-only.

**Administrator override:** an allowlisted admin resolves to `ELITE` regardless of what they paid for.
That rule is implemented in exactly one place, keyed on the email on the `User` row — never on
`User.role`, never on a client-supplied value. It **fails closed**.

> ⚠️ **Trap:** `resolveAccessTier()` needs `stripeStatus` and `stripeCurrentPeriodEnd` on the row it
> is given. A Prisma query that selects only `{ email, tier, track }` makes **every non-admin resolve
> to `STARTER`**, silently. Never hand a narrow `select` to the entitlement helpers.

## Content & the CMS

Most user-facing copy is **not** hardcoded — it is stored in the `ContentModule` table and edited
through `/admin?tab=content`.

- **`sync:cms` runs on every build** as `deepMerge(defaults, existing)`: the CMS wins, code defaults
  fill the gaps. So a default only shows when the CMS has nothing to say.
- **The CMS beats the defaults.** Changing a default in code will *not* change a page the owner has
  already edited. Where a value must change everywhere, the fix is a read-time normaliser (see
  `normalizeFooterLink`, `normalizeWeeklyHeading`), not a defaults edit.
- **Saving any field writes the merged payload** back to the database, so an editor can display
  defaults the database never held — and a Save materialises them.
- `ContentModuleRevision` keeps history but is **capped at 20**; a save prunes the oldest.

## Data model (the tables you will actually touch)

| Table | Holds |
|---|---|
| `User` | Account, `tier`, `track`, and the Stripe columns (`stripeCustomerId`, `stripeStatus`, `stripeCurrentPeriodEnd`) |
| `ContentModule` / `ContentModuleRevision` | CMS payloads + history |
| `StripeEvent` | Webhook idempotency ledger |
| `Account`, `Session` | Auth.js |
| `ChapterProgress`, `QuizResult`, `KnowledgeTestResult` | Learning progress |
| `MentorQuestion`, `TrackedAccount`, `AccountBookmark` | Member features |

## API surface

Routes are grouped by audience:

- `/api/auth/*` — registration, NextAuth, password reset
- `/api/admin/*` — admin-only (content, users, mentors, stats, email preview)
- `/api/mobile/*` — token-authenticated endpoints for the Expo app
- `/api/stripe/*` — `checkout`, `portal`, `webhook`
- everything else — member-facing features

## External dependencies and what they own

| Service | Owns |
|---|---|
| **Stripe** | Products, prices, coupons, subscriptions, invoices, dunning, renewal-reminder emails |
| **Resend** | Outbound email delivery |
| **Neon** | Postgres |
| **Vercel** | Build, deploy, CDN, env vars |

> **The app never creates Stripe products or prices.** It only reads price IDs from env vars and
> passes them to Checkout. The product catalogue is entirely a Dashboard-side object — see
> [`billing-and-pricing.md`](./billing-and-pricing.md).
