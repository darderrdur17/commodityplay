# CommodityPlay.

The definitive career and sales guide for commodity trading — a Next.js web app plus an Expo mobile
client.

- **Production:** <https://www.commodityplay.ai>
- **This app:** the `commodity-playbook-app/` directory (the git repo root)
- **Deeper docs:** [`docs/`](./docs/README.md) — read the index there for anything beyond "how do I
  run it"

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js **16.2.9** (App Router) · React 19 · TypeScript |
| Database | Neon Postgres via **Prisma 5.22** |
| Auth | Auth.js v5 (NextAuth) + bcrypt; Google OAuth optional |
| Payments | **Stripe 17** — subscriptions only (no one-time products) |
| Email | Resend |
| Styling | Tailwind CSS · Framer Motion · Radix UI primitives |
| Mobile | Expo (React Native) — `mobile/` |
| Hosting | Vercel, region `sin1` |

## Plans

Two **tracks** (Career, Sales) × three **tiers** (Starter, Pro, Elite). All prices are **SGD**, billed
monthly. The track decides *which* content you see; the tier decides *how much*.

| Tier | Price / month | Unlocks |
|---|---|---|
| **Starter** | Free | Desk Glossary, Chapter A preview, weekly digest, Starter Pack |
| **Pro** | Career **S$19** · Sales **S$39** | Full Playbook, resume templates, career roadmap, interview questions, knowledge test (Sales adds Market Nudges) |
| **Elite** | Career **S$34** · Sales **S$56** | Everything in Pro, plus case studies, Desk Channel, Mentor Connect, job openings, library (Sales adds Account Intelligence) |

Two **terms**: **Monthly**, or **Annually** (12 months up front, a flat **15% discount**). There is no
trial and no free-month offer.

> ⚠️ **A price is written in exactly one place** — `src/data/pricing-shared.ts`. The Stripe price IDs
> that actually charge the member are env vars. Those are two halves of one decision and must move
> together. See [`docs/billing-and-pricing.md`](./docs/billing-and-pricing.md).

---

## Quick start

```bash
cd commodity-playbook-app
npm install                 # runs `prisma generate` via postinstall
cp .env.example .env.local  # then fill it in — see docs/environment.md
npm run db:push             # create the schema in your database
npm run dev                 # http://localhost:3000
```

The app reconciles its own schema on first use (`src/lib/db-schema-migrations.ts`), so a fresh
database does not need a separate migration step.

### Useful scripts

| Script | What it does |
|---|---|
| `npm run dev` | Dev server with Turbopack |
| `npm run build` | `build:content` → `prisma generate` → `sync:cms` → `next build --webpack` |
| `npm run start` | Serve a production build |
| `npm run lint` | **`tsc --noEmit`** — this is the only CI gate |
| `npm run db:push` | Push the Prisma schema |
| `npm run db:seed` | Seed demo accounts |

> ⚠️ Building locally needs `NODE_OPTIONS=` cleared, or `next build` fails with
> `ENOENT … mkdir .next/server/app/_not-found`. See [`docs/runbook.md`](./docs/runbook.md).

### Mobile app

```bash
cd mobile
npm install
npx expo start
```

The mobile client talks to the web app's `/api/mobile/*` routes.

---

## Admin

Admin authority is the **`ADMIN_EMAILS` allowlist** — never `User.role`, which is ignored. It **fails
closed**: unset in production means nobody is an admin. Outside production an unset allowlist falls
back to a single built-in address.

| Surface | Path |
|---|---|
| Admin panel | `/admin` (content, users, mentors, email preview, database) |
| Member dashboard | `/dashboard` |

Unauthenticated requests to `/admin` and `/api/admin/*` return **404, not 403** — deliberate, so a 403
cannot confirm the admin surface exists.

---

## Documentation map

| Doc | Covers |
|---|---|
| [`docs/README.md`](./docs/README.md) | Index — start here |
| [`docs/architecture.md`](./docs/architecture.md) | How the pieces fit together |
| [`docs/environment.md`](./docs/environment.md) | Every env var, and what breaks without it |
| [`docs/billing-and-pricing.md`](./docs/billing-and-pricing.md) | Plans, Stripe wiring, the money rules |
| [`docs/runbook.md`](./docs/runbook.md) | Build, deploy, verify, common failures |

Older design documents (PRDs, the revamp architecture, the admin-access audit) also live in `docs/`.
Some are historical and describe superseded designs — check their dates before trusting them.

## Conventions

- **Merge commits only.** Never `--admin`; the PR head must be up to date with `main`.
- **No `prisma/migrations/`** — schema changes go into `CORE_MIGRATION_SQL`
  (`src/lib/db-schema-migrations.ts`), which is additive and idempotent.
- **`tsc --noEmit` is the only CI gate** (plus the Vercel build).
