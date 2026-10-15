# Runbook

Build, deploy, verify, and debug. For the full set of verification traps see the project memory notes;
this file covers what a normal change needs.

## Local development

```bash
npm install
cp .env.example .env.local     # then fill it in — see environment.md
npm run db:push
npm run dev                    # http://localhost:3000
```

The app reconciles its own schema on first use, so an existing database does not need a migration
step.

### Running a production build locally

```bash
set -a && source .env.local && set +a
NODE_OPTIONS= npm run build
node ./node_modules/next/dist/bin/next start -p 3001
```

> ⚠️ **`NODE_OPTIONS=` is required.** Without it the build dies with
> `ENOENT … mkdir .next/server/app/_not-found`.
>
> ⚠️ **Use `node ./node_modules/next/dist/bin/next start`, never `npx next start`** — the latter can
> silently listen on a different port.
>
> ⚠️ **`sync:cms` writes to `DATABASE_URL`.** A build touches the database, so source the env first
> or the sync runs against the wrong target.

### Testing a signed-in page locally

Auth.js rejects a host mismatch, so set `NEXTAUTH_URL`, `AUTH_URL` and `NEXT_PUBLIC_APP_URL` to the
**same origin you browse**, plus `AUTH_TRUST_HOST=true`. Browse `localhost`, not `127.0.0.1`.

> ⚠️ **A fixture on `@demo.com` cannot sign in against a local production server.** `authorize()`
> refuses demo addresses whenever the runtime looks like production — which a local `next start`
> does. The failure is a generic credentials error followed by a null session, so it *looks* like
> broken auth. Use a normal-looking address such as `qa.<thing>@example.com`.

## Deploying

Vercel auto-deploys on every push to `main`.

- **Merge commits only** — `gh pr merge <n> --merge`. Never `--admin`.
- The PR head must be up to date with `main`; `BEHIND` is normal — fix it with `gh pr update-branch`
  rather than forcing.
- **Delete the branch after merging**, locally and remotely.
- **`tsc --noEmit` (`npm run lint`) is the only CI gate**, plus the Vercel build. There is no test
  suite gating merges.

Region is pinned to `sin1` in `vercel.json`. That file also holds the two permanent redirects that
canonicalise the legacy Vercel hostnames onto `www.commodityplay.ai`.

## Verifying a deploy actually landed

A green check is not proof. The authoritative question — *did this commit reach Production?* — is
answered by the deployments API:

```bash
gh api "repos/<owner>/<repo>/deployments?sha=$(git rev-parse HEAD)" \
  --jq '.[] | "id=\(.id) env=\(.environment) ref=\(.ref) sha=\(.sha[0:7])"'

gh api "repos/<owner>/<repo>/deployments/<id>/statuses" \
  --jq '.[] | "state=\(.state) url=\(.environment_url)"'
```

Look for `env=Production` and `state=success`.

> ⚠️ **The `?sha=` filter needs the FULL 40-character SHA.** An abbreviated SHA returns `[]`
> **silently** — indistinguishable from "not deployed yet".
>
> ⚠️ `.../commits/<sha>/status` and `.../check-runs` return 404. Use `gh pr checks` instead.
>
> ⚠️ A Preview entry appears first and is easy to mistake for the answer.

Deploy lag is roughly 2.5 minutes; allow about 5.

### Verifying what the site actually renders

- The live origin is **`www.commodityplay.ai`**. The old Vercel hostnames redirect to it, so reading
  headers from them tells you about a *different* alias.
- **Grep the served HTML** — client components are server-rendered, so their strings appear there.
- ⚠️ **A raw HTML grep is not proof of a render.** CMS payloads are serialised into the HTML, so a
  removed string can survive in the RSC flight data. Only a browser `innerText` check is
  authoritative.
- ⚠️ **`innerText` reflects CSS `text-transform`** — an `uppercase` heading reads back upper-cased,
  so a case-sensitive comparison fails on correct code.
- ⚠️ **Count only rendered nodes.** React's streaming SSR leaves a hidden pre-hydration copy of the
  tree under `<body>`, so naive selectors see every element twice until hydration settles.
- ⚠️ **Chunk hashes are not reproducible across build environments.** Identical source can produce
  different hashes on Vercel than locally. Compare **file byte lengths and string-literal sets**, not
  hashes.

## Common failures

| Symptom | Cause | Fix |
|---|---|---|
| `ENOENT … mkdir .next/server/app/_not-found` | `NODE_OPTIONS` is set | Prefix the build with `NODE_OPTIONS=` |
| Vercel check red, `errorCode: "git_info_fail"`, no build logs | Vercel never started the build — usually a **GitHub rate limit** on its git lookup | Wait and retry. Check via the Vercel API, not `vercel inspect --logs`. |
| Admin routes 404 | `ADMIN_EMAILS` unset or the address is not on it | It fails closed by design |
| Paid CTAs open a contact modal | `NEXT_PUBLIC_PAYMENTS_ENABLED` is not `true` at build time | Set it and **redeploy** |
| A price on the page differs from the receipt | `PLAN_BASE_PRICE` and the Stripe price have drifted | See `billing-and-pricing.md` |
| Checkout 503 for one plan | That plan's price env var is missing | The gate is per-plan |

> ⚠️ `gh pr close` + `gh pr reopen` retriggers **Typecheck only** — it does **not** create a new
> Vercel deployment.

## Database

- **No `prisma/migrations/`.** Schema changes go into `CORE_MIGRATION_SQL`
  (`src/lib/db-schema-migrations.ts`) — additive, idempotent, guarded with
  `EXCEPTION WHEN undefined_table`. `src/instrumentation.ts` runs it on cold start.
- `npm run db:push` pushes the Prisma schema directly.
- `npm run db:studio` is a no-op — Prisma Studio is unsupported here. Sign in as an admin and open
  `/admin/database` instead.
- `POST /api/setup-db` is a one-time repair endpoint, gated by `SETUP_SECRET` and failing closed.

## Environment variables in Vercel

```bash
vercel env ls                                     # shows "Encrypted" — tells you nothing about Sensitive
vercel env pull                                   # real value for non-Sensitive, empty for Sensitive
vercel env add <NAME> production --value "…" --force
```

⚠️ `vercel env update` **refuses** on a Sensitive variable — use `env add … --force`.
