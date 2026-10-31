# Billing & pricing

Read this before changing anything about plans, prices, or Stripe.

## The model

Two **tracks** × three **tiers** × two **terms**.

- **Tier** — `STARTER` (free), `PRO`, `ELITE`. Decides how much you get.
- **Track** — `CAREER` or `SALES`. Decides which content set you get. Same tier, different content.
- **Term** — `monthly` (1 month) or `"12"` (annually, paid up front).

**Currency is SGD**, rendered as `S$` with **no space** (`S$19`, not `S$ 19` and never a bare `$`).

### Terms

| Term | `paidMonths` | `accessMonths` | Pricing |
|---|---|---|---|
| `monthly` | 1 | 1 | list price |
| `"12"` | 12 | 12 | list price × 12, **flat 15% discount** |

There is **no trial** and **no free-month offer**. Both were removed. Never use the word "trial" in
member-facing copy — it implies a price rise afterwards, which is false.

### Current amounts

> ⚠️ **This table is a snapshot and will go stale. `src/data/pricing-shared.ts` is authoritative.**
> `PLAN_BASE_PRICE` holds the monthly list price; the annual figures are derived.

| Plan | Monthly | Annual (`base × 12 × 0.85`) |
|---|---|---|
| Career Pro | S$19 | S$193.80 |
| Career Elite | S$34 | S$346.80 |
| Sales Pro | S$39 | S$397.80 |
| Sales Elite | S$56 | S$571.20 |

## 🔴 The money rule

> **The quoted price and the charged price are ONE decision.**

They live in two places, and they must move together:

| | Source | Role |
|---|---|---|
| **Quoted** | `PLAN_BASE_PRICE`, `src/data/pricing-shared.ts` | What the page shows |
| **Charged** | The Stripe price behind `STRIPE_PRICE_*` env vars | What the member is billed |

**Stripe prices are immutable.** You cannot edit an amount. A new amount means:

1. Create a **new** price in Stripe (the currency is locked at creation),
2. put its ID in the matching env var,
3. update `PLAN_BASE_PRICE`,
4. redeploy.

Skipping step 4, or doing one without the other, is how the site ends up quoting one price and
charging another. **This has already happened twice.** A receipt is the proof of what was charged —
not this repo.

### Where a price may be written

`src/data/pricing-shared.ts` is the **only** place. `landing-content.ts`, `TIER_LABELS`
(`src/lib/utils.ts`), both landing panels and the `/pricing` grid all **derive** from it. A literal
price anywhere else is a bug.

The symbol and its separator live in one constant (`CURRENCY_PREFIX`). Never hand-concatenate.

## How the app talks to Stripe

**The app never creates products or prices.** It reads price IDs from env vars and passes them to
Checkout:

```ts
line_items: [{ price: priceId, quantity: 1 }]
```

Everything else — products, prices, coupons, subscriptions, invoices, dunning, renewal reminders —
is a **Stripe Dashboard object**. There is no script and no API call to re-run, and nothing in the
repo depends on the shape of the product catalogue.

### The eight price variables

`STRIPE_PRICE_{CAREER,SALES}_{PRO,ELITE}` (monthly) and the same four with `_ANNUAL`.

### Coupons

`STRIPE_COUPON_{CAREER,SALES}_{PRO,ELITE}_TERM12` — one per tier, term-suffixed so a deeper 12-month
discount stays a Dashboard edit rather than a PR.

⚠️ `getStripeCoupon()` currently **cannot be reached from checkout** — the route rejects a 12-month
term that is not billed annually, and the helper returns `null` for `monthly`. It is kept
deliberately.

### Entitlement

Tier is resolved from the **price ID**, never from an amount — amounts are ours to change and a total
can never identify a plan. An unknown price ID resolves to `null` so a paying member is never
silently downgraded.

Access = Stripe status ∈ {`active`, `trialing`} **and** an unelapsed `stripeCurrentPeriodEnd`.

## What Stripe owns (not code)

These are Dashboard settings. Building them in code would be wrong — Stripe already does them, and a
second implementation would email members twice.

| Behaviour | Where it lives |
|---|---|
| Renewal reminder (7 days before) | Settings → Billing → Subscriptions and emails |
| The **day count** for that reminder | Same page → *Prevent failed payments* → *Upcoming renewal events* |
| Subscription Management links | Same page — Stripe's docs say these are needed for FTC / California compliance |
| Customer portal (invoices, cancel, update card) | Settings → Billing → Customer portal |
| Receipt emails | Settings → Emails |

## Managing the product catalogue

Stripe's rules, which shape what is possible:

> *"You can't delete products that have an associated price, but you can archive them."*
> *"You can only delete prices that you've never used. Otherwise, you can archive them."*
> 🔴 *"You can't delete a price through the API."*

Consequences:

- **A product can only be deleted once it has zero prices.**
- **A price can only be deleted if it has never been used** in a subscription or invoice.
- **Price deletion is Dashboard-only** — it cannot be scripted.
- To delete: *Product → Pricing → overflow menu next to the price → Delete price*, then *overflow
  menu at the top → Delete product*.

**Archiving is safe and is the normal answer.** Existing subscriptions keep running; only new
purchases are blocked; the item moves to the "Archived" tab. Because the app never lists the
catalogue, archiving is invisible to the site.

> ⚠️ **Never delete a price that is one of the eight live `STRIPE_PRICE_*` values** — checkout would
> break immediately.

## Traps

- **`NEXT_PUBLIC_PAYMENTS_ENABLED` is build-time.** Set to `false`, `isPaymentsLive()` routes paid
  CTAs to a contact modal instead of checkout. It must be `true` in production, and changing it needs
  a redeploy.
- **Production's CMS overrides repo defaults.** Tier CTA labels come from the CMS, so a code default
  change will not appear on the live site.
- **The owner also works in Stripe's Sandbox** — a separate test copy whose objects do not exist in
  live and do not affect the site. **Check the banner on a screenshot before concluding anything.**
- **`checkout/route.ts` pins its own Stripe `apiVersion` per request.** The shared client and the
  webhook use a different one. Do not tidy them into one.
