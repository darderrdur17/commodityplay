# Deploy to Vercel — complete step-by-step guide

Project: `darderdur17/commodityplay` · Vercel project: **`commodityplay.`** (note the
trailing period) under team `darderdur17s-projects` · Live domain:
**`https://www.commodityplay.ai`**

Branch `security/audit-2026-09-26` is pushed and ready. **Two commits:**

- `d84f35e` — makes the security commit deployable without hand-run SQL
- `cdbc430` — fixes an infinite redirect loop that makes the live site unreachable

> ⚠️ **The live site is currently broken and this branch fixes it.** Right now every
> page on `www.commodityplay.ai` returns `308` to itself, forever. Static assets
> load, which is why it looks like a DNS/domain problem — it is not, it is an
> application bug in the middleware. See step 6 for the full explanation. Merging
> this branch repairs production.

---

## Step 1 — Fix `DATABASE_URL` in Vercel (this is THE blocker)

The build fails at `sync:cms` with `Can't reach database server at localhost:5432`.
Confirmed from the real Vercel build logs, not inferred.

1. Open <https://vercel.com/darderdur17s-projects/commodityplay.> → **Settings** → **Environment Variables**.
2. Find **`DATABASE_URL`**.
3. It is currently set to something containing `localhost:5432`. Replace it with your
   **Neon pooled** connection string:

   ```
   postgresql://USER:PASSWORD@ep-xxxx-xxxx-pooler.REGION.aws.neon.tech/neondb?sslmode=require
   ```

   The `-pooler` segment and `?sslmode=require` both matter. Copy it from the Neon
   dashboard → your project → **Connection string** → **Pooled connection**.
4. **Tick all three environments: Production, Preview and Development.** A variable
   scoped to only one environment is the most common cause of "works in prod, fails
   in preview".
5. Save.

> Why Preview specifically: Vercel builds a preview deployment for every branch push.
> If Preview has its own stale `localhost` value it overrides nothing but *does* get
> used for that build — which is exactly what happened.

---

## Step 2 — Set the remaining environment variables

Vercel → **Settings** → **Environment Variables**. Set each of these for **all three
environments** unless noted.

### Required — the deploy will fail or auth will break without these

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Neon **pooled** URL (step 1) |
| `AUTH_SECRET` | `openssl rand -base64 32` — must be a **fresh** value for production, not the dev one |
| `ADMIN_EMAILS` | `francestho@gmail.com` |

> **`ADMIN_EMAILS` fails closed.** If it is unset in production the allowlist is empty
> and **nobody** gets admin — not even Frances. Every admin route returns 404/403.
> This is intentional, but it means admin is dark until you set it.

### Required for the app to link and behave correctly

| Variable | Value |
| --- | --- |
| `NEXTAUTH_URL` | `https://www.commodityplay.ai` |
| `NEXT_PUBLIC_APP_URL` | `https://www.commodityplay.ai` |
| `NEXT_PUBLIC_SITE_URL` | `https://www.commodityplay.ai` |
| `NEXT_PUBLIC_PAYMENTS_ENABLED` | `true` (set `false` to keep checkout closed) |

> **`NEXT_PUBLIC_*` values are baked in at build time.** Changing one does nothing
> until you redeploy. If you get one wrong, fix it and redeploy — don't just reload.

### Required for payments

| Variable | Value |
| --- | --- |
| `STRIPE_SECRET_KEY` | `sk_live_...` |
| `STRIPE_PRO_PRICE_ID` | `price_...` — the **one-time** SGD 99 product |
| `STRIPE_ELITE_PRICE_ID` | `price_...` — the **monthly recurring** product |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (from step 7) |
| `STRIPE_BILLING_PORTAL_CONFIGURATION_ID` | `bpc_...` (optional — enables the branded portal) |

> The Pro plan **must** be a one-time price. A previous bug created it as a recurring
> subscription and rebilled members monthly on a one-time product; the code now forces
> `mode: "payment"` for Pro, but make sure the Stripe product itself is a one-time price.

### Required for email

| Variable | Value |
| --- | --- |
| `RESEND_API_KEY` | `re_...` |
| `RESEND_FROM_EMAIL` | e.g. `hello@commodityplay.com` — **must be a verified sender domain in Resend** |
| `MENTOR_NOTIFY_EMAIL` | where new mentor questions go |
| `ADMIN_NOTIFY_EMAIL` | extra operator notifications (comma-separated, optional) |

### Optional — durable rate limiting (Upstash Redis)

In-process limits reset per Vercel instance. For shared counters, create a Redis
database at [Upstash](https://console.upstash.com/) (free tier is enough) and set:

| Variable | Notes |
| --- | --- |
| `UPSTASH_REDIS_REST_URL` | REST URL from the Upstash console |
| `UPSTASH_REDIS_REST_TOKEN` | REST token from the Upstash console |

Leave both unset to keep the in-memory fallback (local `npm run build` / `npm start`
still work). On Vercel, a missing pair logs a warning and falls back.

### Optional

| Variable | Notes |
| --- | --- |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Leave unset to hide "Continue with Google". Members can still set a password via /forgot-password |
| `SETUP_SECRET` | Only for the manual `POST /api/setup-db` repair endpoint. `openssl rand -hex 32`. Not needed for a normal deploy |
| `DEMO_EMAIL_LOG` | Dev aid — leave unset in production |

**Do NOT set `NODE_ENV`.** Next.js sets it. Forcing it can disable production optimisations.

### Variables you can delete

`NEXT_PUBLIC_SALES_DEMO_URL` and `STRIPE_PUBLISHABLE_KEY` are referenced nowhere in the
code. Safe to remove.

---

## Step 3 — Redeploy the preview and confirm it is green

1. Vercel → **Deployments**, or push an empty commit:

   ```bash
   git commit --allow-empty -m "chore: trigger preview rebuild" && git push
   ```

   Simplest is to open the failing deployment and click **Redeploy** — but you must
   **untick "Use existing Build Cache"** so the new `DATABASE_URL` is picked up.
2. Watch the build. It must get past `sync:cms`. A healthy log looks like:

   ```
   [sync-cms] Content modules synced: 20 (...)
   [sync-cms] Download assets: 125 expected, ...
   [sync-cms] Resume templates synced: 5/5
   ✓ Compiled successfully
   ƒ Proxy (Middleware)
   ```

3. If it still says `localhost:5432`, the variable is still wrong for the environment
   that build used — re-check step 1.4.

> **Preview ≠ Production.** Preview deployments are built from this branch and use the
> Preview-scoped variables. Getting Preview green is what proves the merge is safe.

---

## Step 4 — Merge to `main`

1. Open <https://github.com/darderrdur17/commodityplay/pull/1>.
2. Click **Ready for review** (it is currently a **draft**, so it cannot be merged).
3. Review the diff, then **Merge pull request**.
4. Vercel auto-deploys `main` to production. Watch that deployment the same way as step 3.

> `main` deploys automatically, which is why this work was kept on a branch: the
> earlier code expected columns the database did not have yet. That is now handled
> automatically at startup, so merging is safe.

---

## Step 5 — Verify the live site

Once the production deployment is **Ready**, check in this order:

```bash
# 1. The domain must serve the app, not redirect to itself.
curl -s -o /dev/null -w "%{http_code}\n" https://www.commodityplay.ai/pricing
#    expect 200

# 2. The vercel.app alias must still bounce to the canonical domain.
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" https://commodityplay.vercel.app/pricing
#    expect 308 https://www.commodityplay.ai/pricing

# 3. No redirect chain.
curl -s -o /dev/null -w "redirects=%{num_redirects} final=%{url_effective}\n" -L https://www.commodityplay.ai/
#    expect redirects=0
```

Then in a browser:

- [ ] `/` loads the marketing site
- [ ] `/pricing` loads
- [ ] `/login` loads (not a redirect loop)
- [ ] Sign in as Frances → `/admin` loads
- [ ] `/admin/database` loads and lists member counts
- [ ] `/demo` is refused for non-admins (404)
- [ ] A demo account (`admin@demo.com` / `Demo1234!`) **cannot** sign in — expected, they are disabled in production

---

## Step 6 — What `cdbc430` fixes (and why the site was down)

Before the fix, verified against production:

| Request | Result |
| --- | --- |
| `www.commodityplay.ai/pricing` | `308` → **itself** (infinite loop) |
| `www.commodityplay.ai/icon.png` | `200` — static assets bypass middleware |
| `commodityplay.vercel.app/icon.png` | `308` → `www` — `vercel.json`, applied at the edge |

The middleware compared `req.nextUrl.hostname` against the blocked-alias list. On
Vercel that value is the deployment's **internal** hostname — always one of the blocked
aliases — not the host the visitor typed. So the check matched on every request to the
real domain, redirected to `https://www.commodityplay.ai/...`, and since that URL is
served by the same deployment it matched again. Forever.

It now compares the client-visible host (`x-forwarded-host`, falling back to `host`).
Checking a client-visible host is also what guarantees termination: once the visitor is
on the canonical domain, the check no longer matches.

Verified locally after the fix:

| Request Host | Result |
| --- | --- |
| `www.commodityplay.ai/pricing` | `200`, no redirect |
| `commodityplay.vercel.app/pricing` | `308` → `www` |
| `commodity-playbook-app.vercel.app/pricing` | `308` → `www` |

---

## Step 7 — Point Stripe at the live webhook

1. Stripe Dashboard → **Developers** → **Webhooks** → **Add endpoint**.
2. URL: `https://www.commodityplay.ai/api/stripe/webhook`
3. Events to send: `checkout.session.completed`, `payment_intent.succeeded`,
   `invoice.paid`, `customer.subscription.updated`, `customer.subscription.deleted`,
   `charge.refunded`, `charge.dispute.created`.
4. Copy the signing secret (`whsec_...`) into the `STRIPE_WEBHOOK_SECRET` Vercel variable.
5. **Redeploy** so the new value is picked up.
6. Send a test event from Stripe and confirm the endpoint returns `200`.

> If the endpoint was previously registered against a `*.vercel.app` alias, delete that
> endpoint. Point it directly at the canonical domain so it never depends on a redirect.

---

## Step 8 — Confirm the database self-migrated

You no longer need to run any SQL by hand. On the first request after deploy, the app
reconciles its own schema (`src/instrumentation.ts` → `ensureCoreInfrastructure()`).

To confirm, in the Neon SQL editor:

```sql
-- 1. The new column exists.
SELECT column_name FROM information_schema.columns
WHERE table_name = 'User' AND column_name = 'tokenVersion';

-- 2. The legacy isPublic column was renamed, keeping member consent.
SELECT column_name FROM information_schema.columns
WHERE table_name = 'MentorQuestion'
  AND column_name IN ('memberShareOptIn', 'isPublic');
-- expect exactly one row: memberShareOptIn

-- 3. The foreign key exists.
SELECT conname, convalidated FROM pg_constraint
WHERE conname = 'KnowledgeTestResult_userId_fkey';
```

`prisma/manual-migrations-2026-09-26.sql` is now **optional**. Its only remaining value
is producing a fully *validated* FK: it deletes orphan `KnowledgeTestResult` rows and
then validates the constraint. The runtime version leaves it `NOT VALID` so it can never
fail and never deletes data — the constraint is still enforced for all new writes.

`prisma/neutralize-demo-accounts.sql` is also no longer required: `POST /api/setup-db`
now clears demo passwords itself in production.

---

## Step 9 — Two decisions still open

### 9a. The build silently deletes 3 interview questions

`npm run build` regenerates `src/data/interview-questions-bank.json` from
`content-sources/` and, in doing so, drops `iv-c-cm-01`, `iv-c-cm-02`, `iv-c-cm-03`
(count 18 → 15). They exist in the committed file but not in the content source, so
**every build drops them — including on Vercel.** Production is probably already
serving 15.

Choose one:
- **Keep them:** add the three questions to the relevant file under `content-sources/`
  so the extractor emits them.
- **Accept the removal:** commit the regenerated file so the diff stops reappearing.

Related: the build writes into tracked source files (`src/data/*.ts`, `*.json`), so every
build dirties the working tree. Generated artifacts probably should not be committed.

### 9b. Domain inconsistency

The app's canonical host is `www.commodityplay.ai` (`src/lib/canonical-host.ts`,
`vercel.json`), but `src/lib/brand.ts` sets `BRAND_DOMAIN = "commodityplay.com"`, which
drives `BRAND_SITE_URL` and the `hello@` / `legal@` / `privacy@` addresses.

Both apexes (`commodityplay.ai`, `commodityplay.com`) currently serve a registrar
parking page, so the live site is only `www.commodityplay.ai`. Setting
`NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_APP_URL` (step 2) overrides the site URL used in
metadata and email links, which resolves most of it. If the mailboxes really are on
`.com`, only `BRAND_DOMAIN` needs aligning — decide which domain is the real one and make
`brand.ts` match.

---

## Quick reference — the whole thing in order

1. Vercel → Settings → Environment Variables → set `DATABASE_URL` to the Neon **pooled** URL for **all 3** environments.
2. Add `AUTH_SECRET`, `ADMIN_EMAILS=francestho@gmail.com`, `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_PAYMENTS_ENABLED`, the Stripe and Resend variables.
3. Redeploy the preview **without** build cache; confirm `sync:cms` passes.
4. PR #1 → **Ready for review** → **Merge**.
5. Wait for the production deployment; verify `https://www.commodityplay.ai/pricing` returns 200.
6. Confirm no redirect loop (`curl -L` reports `redirects=0`).
7. Register the Stripe webhook at `https://www.commodityplay.ai/api/stripe/webhook`, set the secret, redeploy.
8. Sign in as Frances, open `/admin/database`.
9. Decide on the 3 interview questions and the `.com` / `.ai` inconsistency.

---

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Build fails: `Can't reach database server at localhost:5432` | `DATABASE_URL` wrong for that environment | Step 1 — set it for Preview too |
| Build fails: `Environment variable not found: DATABASE_URL` | Not set for that environment at all | Step 1 |
| Build fails: `type "Tier" does not exist` | Database is empty — base schema never pushed | Run `prisma db push` against Neon once |
| `www.commodityplay.ai` redirects to itself | Pre-`cdbc430` middleware | Merge this branch |
| A page 500s with `column "tokenVersion" does not exist` | Migration did not run — DB unreachable at boot | Check `DATABASE_URL`; the startup hook logs `[instrumentation] core schema reconciliation failed` |
| `/admin` returns 404 for Frances | `ADMIN_EMAILS` unset or wrong | Step 2 — it fails closed |
| Admin sees no data | Signed in with a stale JWT from before the allowlist | Sign out and back in (sessions are 7 days) |
| Payments button does nothing | `NEXT_PUBLIC_PAYMENTS_ENABLED` not `true`, or set after the build | Set it and **redeploy** |
| Emails not arriving | `RESEND_FROM_EMAIL` domain not verified in Resend | Verify the domain in Resend |
