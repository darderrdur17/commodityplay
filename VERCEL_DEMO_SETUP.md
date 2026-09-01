# Vercel Demo Account Setup Guide

Get demo logins working at **https://commodityplay.vercel.app/demo** on any device.

**Demo password for all accounts:** `Demo1234!`

> **Status (June 2025):** Production database has been seeded. Demo login is live. You can skip to [Step 6 — Test](#step-6--test-demo-accounts) unless you are setting up a new environment.

---

## What was broken (and why)

| Issue | Cause |
|---|---|
| Login returns 500 | Neon database had no tables or demo users |
| Local `db:push` fails (P1001) | Your Wi‑Fi blocks outbound port 5432 (common on school/corporate networks) |
| Stripe build error (fixed) | Stripe client initialized at import without env vars |

---

## Step 1 — Confirm Vercel environment variables

Go to **Vercel → commodity-playbook-app → Settings → Environment Variables**.

These must be set for **Production** (and ideally Preview):

| Variable | Correct value |
|---|---|
| `DATABASE_URL` | Neon **pooled** URL (`…-pooler….neon.tech/neondb?sslmode=require`) |
| `AUTH_SECRET` | Random string: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://commodityplay.vercel.app` |
| `NEXT_PUBLIC_APP_URL` | `https://commodityplay.vercel.app` |
| `SETUP_SECRET` | One-time secret for seeding (see Step 3) |

**Do not use** `localhost` in any production variable.

Optional (payments): `STRIPE_SECRET_KEY`, `STRIPE_PRO_PRICE_ID`, `STRIPE_ELITE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`

---

## Step 2 — Deploy latest code

From your project folder:

```bash
cd commodity-playbook-app
git pull
vercel deploy --prod --scope darderrdur17s-projects
```

Or push to `main` if Git auto-deploy is connected.

---

## Step 3 — Seed the Neon database (one time)

Choose **one** method:

### Method A — Vercel API (recommended if local network blocks port 5432)

After deploy, run (secret is set in Vercel as `SETUP_SECRET`):

```bash
curl -X POST https://commodityplay.vercel.app/api/setup-db \
  -H "Authorization: Bearer YOUR_SETUP_SECRET"
```

> **Important:** Redeploy production **after** adding `SETUP_SECRET` in Vercel, or this returns 401.

Success response:

```json
{
  "success": true,
  "message": "Database schema pushed and demo accounts seeded.",
  "demo": { "email": "elite.insider@demo.com", "password": "Demo1234!" }
}
```

Then **remove `SETUP_SECRET`** from Vercel (security) and redeploy.

### Method B — Local script (if port 5432 works)

Use phone hotspot if home Wi‑Fi blocks Postgres:

```bash
DATABASE_URL_UNPOOLED="postgresql://USER:PASS@ep-xxx.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require" \
  ./scripts/setup-neon-db.sh
```

Use the **direct** (unpooled) Neon URL from the Neon dashboard.

---

## Step 4 — Redeploy after env changes

**Deployments → ⋮ → Redeploy** (or `vercel deploy --prod`).

Required whenever you change `DATABASE_URL`, `AUTH_SECRET`, or `NEXTAUTH_URL`.

---

## Step 5 — Turn off deployment protection (if clients get 401)

**Settings → Deployment Protection** → disable for Production, or add testers as team members.

---

## Step 6 — Test demo accounts

Open **https://commodityplay.vercel.app/demo**

| Email | Tier | Use for |
|---|---|---|
| `admin@demo.com` | Admin / Elite | Admin panel `/admin` |
| `starter.fresh@demo.com` | Starter (Career) | Free tier — Chapter A preview (3 of 8 sections) |
| `starter.vendor@demo.com` | Starter (Sales) | Sales track Starter — dashboard, glossary, digest |
| `pro.switcher@demo.com` | Pro | Pro content (Career track) |
| `pro.vendor@demo.com` | Pro | Pro Sales — Prep Library, Market Nudges, industry guide |
| `elite.insider@demo.com` | Elite | Desk Channel, Mentor Connect, Jobs |
| `elite.mentor@demo.com` | Elite | **Mentor Connect** — opens `/mentor-connect` with 5 credits + sample Q&A |

Password for all: **`Demo1234!`**

Test on a phone (same URL) — no app install required for web demo.

---

## Step 7 — Optional: mobile app (Expo)

```bash
cd mobile
npm install
npx expo start
```

`mobile/app.json` points API to `https://commodity-playbook-app.vercel.app`.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| 500 on login | Re-run Step 3 (seed database) |
| Demo login fails | Check `GET /api/setup-db` — should return `"seeded": true` |
| 401 on site | Disable Deployment Protection |
| P1001 locally | Use Method A (Vercel API) or phone hotspot |
| `SETUP_SECRET not configured` | Add `SETUP_SECRET` to Vercel Production, redeploy |
| `DATABASE_URL does not look like Neon` | Set pooled Neon URL as `DATABASE_URL` on Production |
| Auth redirect loop | Set `NEXTAUTH_URL` to exact production URL (no trailing slash) |

---

## Security reminders

1. **Rotate Neon password** if it was ever shared in chat or tickets.
2. **Remove `SETUP_SECRET`** after seeding.
3. Use a **new** `AUTH_SECRET` for production (not your local `.env` value).

---

## Quick checklist

- [ ] `DATABASE_URL` = Neon pooled URL on Vercel Production
- [ ] `AUTH_SECRET` + `NEXTAUTH_URL` set on Production
- [ ] Latest code deployed
- [ ] Database seeded (Step 3)
- [ ] `/demo` login works
- [ ] Tested on a second device (phone)
