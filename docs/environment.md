# Environment

Every environment variable, what it does, and what breaks without it. Copy `.env.example` to
`.env.local` to start.

> ⚠️ **`.env.example`'s comments are out of date about pricing** — it still describes the old USD
> amounts and the retired 14-month coupon. Trust [`billing-and-pricing.md`](./billing-and-pricing.md)
> for anything money-related. (The variable *names* below are correct.)

## Build-time vs runtime — read this first

Two variables are **inlined at build time**, not read at runtime:

| Variable | Consequence |
|---|---|
| `NEXT_PUBLIC_PAYMENTS_ENABLED` | Decides whether paid CTAs open Stripe Checkout or a contact modal. Changing it requires a **redeploy** — editing it in Vercel alone does nothing. |
| `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_SITE_URL` | Baked into absolute links and `<meta>` tags. |

Everything else is read at runtime and takes effect on the next deploy (or immediately, if the
platform reloads).

---

## Database

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | ✅ | Postgres connection string. On Neon use the **pooled** URL (`-pooler`). |
| `DATABASE_URL_UNPOOLED` | — | **Direct** URL, needed only for migrations/`setup-neon-db.sh`. |
| `SETUP_SECRET` | — | Bearer secret for `POST /api/setup-db`, a one-time repair endpoint. **Fails closed**: unset → 503. |

The app reconciles its own schema on first use (`src/lib/db-schema-migrations.ts`), so
`SETUP_SECRET` is only needed for a manual repair.

## Auth

| Variable | Required | Notes |
|---|---|---|
| `AUTH_SECRET` | ✅ | Generate with `openssl rand -base64 32`. |
| `NEXTAUTH_URL` | ✅ | Absolute production URL, **no trailing slash**. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | — | Leave empty to hide "Continue with Google". |

⚠️ Auth.js fails CSRF checks on a **host mismatch**. Locally, `NEXTAUTH_URL`, `AUTH_URL` and
`NEXT_PUBLIC_APP_URL` must all point at the **same origin you browse**, and `AUTH_TRUST_HOST=true`
must be set. Browse `localhost`, not `127.0.0.1`.

## Admin

| Variable | Required | Notes |
|---|---|---|
| `ADMIN_EMAILS` | ✅ | Comma-separated allowlist. **This is the only thing that grants admin** — `User.role` is ignored. Case-insensitive, whitespace-trimmed. |

🔴 **Fails closed.** Unset in production → the allowlist is empty → every admin route returns 404/403
and nobody can administer the site. Outside production an unset value falls back to a single built-in
address.

## Stripe

Checkout stays closed until `NEXT_PUBLIC_PAYMENTS_ENABLED=true` **and** the secret **and** all eight
`STRIPE_PRICE_*` vars are present — see [`payments-go-live.md`](./payments-go-live.md) for the ordered
procedure, the verification checklist and the rollback.

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_PAYMENTS_ENABLED` | ✅ | **Build-time.** |
| `STRIPE_SECRET_KEY` | ✅ | Server-side only. |
| `STRIPE_PRICE_{CAREER,SALES}_{PRO,ELITE}` | ✅ | The four **monthly** recurring prices. |
| `STRIPE_PRICE_{CAREER,SALES}_{PRO,ELITE}_ANNUAL` | ✅ | The four **annual** prices. |
| `STRIPE_COUPON_{CAREER,SALES}_{PRO,ELITE}_TERM12` | — | Term coupons. **Currently unreachable from checkout.** |
| `STRIPE_WEBHOOK_SECRET` | ✅ | Verifies webhook signatures. |
| `STRIPE_BILLING_PORTAL_CONFIGURATION_ID` | — | Enables the branded customer portal. |

There is **no publishable key** anywhere — checkout is created server-side, so none is needed.

⚠️ **A price's currency is locked at creation.** Changing it means creating a new price, which means a
new env var value **and** a redeploy.

→ Amounts, arithmetic and the quoted-vs-charged rule: [`billing-and-pricing.md`](./billing-and-pricing.md).

## Email (Resend)

| Variable | Required | Notes |
|---|---|---|
| `RESEND_API_KEY` | ✅ | From resend.com. |
| `RESEND_FROM_EMAIL` | ✅ | The envelope sender. |
| `MENTOR_NOTIFY_EMAIL` | — | Inbox that receives new mentor questions. |
| `ADMIN_NOTIFY_EMAIL` | — | Extra recipients for operator lead emails. Comma-separated. |
| `DEMO_EMAIL_LOG` | — | Set `"true"` to log demo emails instead of sending. **Local only** — leave unset in production. |

> ⚠️ `MENTOR_NOTIFY_EMAIL`, `ADMIN_NOTIFY_EMAIL` and `ADMIN_EMAILS` sit **outside** the code's brand
> consolidation and can silently keep an old address alive. `vercel env ls` shows "Encrypted" for all
> three and **cannot** tell you which are Sensitive — `vercel env pull` returns the real value for
> non-Sensitive variables and an empty string for Sensitive ones.

## URLs

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | ✅ | Canonical host. Used for absolute links in emails and redirects — **whatever is here is the hostname members see in every email**. |
| `NEXT_PUBLIC_SITE_URL` | — | Canonical origin for `<meta>`, Open Graph and canonical links. Falls back to a built-in default. |

## Optional

| Variable | Notes |
|---|---|
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | Rate limiting. Unset → an in-process `Map`, fine locally but **not durable across Vercel instances**. |

## Traps

- **Local production env files are redacted.** `.env.production.local` pins `DATABASE_URL=""` and
  `AUTH_SECRET=""`. Running `next start` locally therefore needs `AUTH_URL`, `NEXTAUTH_URL` and
  `NEXT_PUBLIC_APP_URL` overridden to the local origin.
- **`sync:cms` writes to `DATABASE_URL`**, so a build touches the database. Source the env before
  building, or the sync runs against the wrong target.
- **A red build can be a rate limit, not your code.** See [`runbook.md`](./runbook.md).
