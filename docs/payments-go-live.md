# Turning paid checkout on — and off

**Today paid checkout is CLOSED.** It opens only when the release green flag is given, and it is a
two-part switch that cannot be flipped by accident.

Read [`billing-and-pricing.md`](./billing-and-pricing.md) for the pricing model and
[`environment.md`](./environment.md) for the full variable list. This page is the *procedure*.

---

## The two gates, and why there are two

| Gate | Where | When it is read | What it decides |
|---|---|---|---|
| `isPaymentsLive()` | `src/lib/payments.ts` | **Build time** | Whether paid CTAs open the checkout flow or a contact modal |
| `isCheckoutConfigured()` | `src/lib/payments.ts` | **Per request, server-side** | Whether a checkout could actually complete |

`isCheckoutConfigured()` is `paymentsReadiness().ready`, which requires **all three**:

1. `NEXT_PUBLIC_PAYMENTS_ENABLED === "true"` — the explicit intent.
2. `STRIPE_SECRET_KEY` present.
3. **All eight** `STRIPE_PRICE_*` vars present — the four monthly and the four annual.

### Why the price check exists

Until this was tightened, the server gate was only *flag plus secret*. Production was in exactly the
state that made that dangerous: `NEXT_PUBLIC_PAYMENTS_ENABLED=true`, a secret key present, and **not
one** of the eight price vars. So the gate passed, checkout proceeded, and price resolution threw —
the member got a generic **`503 Checkout failed`** from a path that had never been configured.

Two consequences, both bad:

- The failure was **indistinguishable from a real fault**. "Checkout failed" tells nobody that the
  deployment is simply not for sale.
- **Adding price vars alone would have gone live.** The flag was already `true`, so the moment
  someone set eight IDs, checkout would start charging real cards with no deliberate flip and no
  verification.

Now the gate is all-or-nothing: either every prerequisite is present and checkout works, or it
refuses with `503` and `reason: "PAYMENTS_NOT_CONFIGURED"`, logging *which* variable is missing
(names only, never values).

⚠️ **All eight, not four.** `/pricing` sells a monthly and a 12-month term, and the annual term
resolves through its own variables. A launch with only the monthly four would take money for monthly
and 503 every annual purchase — in front of a paying member.

---

## Prerequisites — owner-supplied, cannot be self-served

| # | Item | Notes |
|---|---|---|
| 1 | **Eight price IDs** | Four monthly, four annual. Created in the **Stripe Dashboard**; the app never creates products or prices. |
| 2 | **`STRIPE_SECRET_KEY`** | Live mode (`sk_live_…`) for real money. |
| 3 | **`STRIPE_WEBHOOK_SECRET`** | From the endpoint created in step 3 below. |
| 4 | **Referral reward decision** | Which reward, and its `STRIPE_REFERRAL_COUPON_ID`. Until decided, referral codes are accepted but no discount is applied. |

🔴 **A Stripe price is immutable.** Its amount and currency are fixed at creation. Changing either
means a **new price ID**, a **new env value**, and a **redeploy**. There is no "edit the price" path.

⚠️ The eight amounts must equal `PLAN_BASE_PRICE` in `src/data/pricing-shared.ts` — that file is what
the page **quotes**, the Stripe price is what the member is **billed**. They are two halves of one
decision.

---

## Step order — do not reorder

**1. Create the eight prices in the Stripe Dashboard (live mode).**
Career Pro / Elite and Sales Pro / Elite, monthly and annual, each recurring. Copy the eight
`price_…` IDs.

**2. Set the variables in Vercel → Production.**

```
STRIPE_SECRET_KEY=sk_live_…
STRIPE_WEBHOOK_SECRET=whsec_…
STRIPE_PRICE_CAREER_PRO=price_…            STRIPE_PRICE_CAREER_PRO_ANNUAL=price_…
STRIPE_PRICE_CAREER_ELITE=price_…          STRIPE_PRICE_CAREER_ELITE_ANNUAL=price_…
STRIPE_PRICE_SALES_PRO=price_…             STRIPE_PRICE_SALES_PRO_ANNUAL=price_…
STRIPE_PRICE_SALES_ELITE=price_…           STRIPE_PRICE_SALES_ELITE_ANNUAL=price_…
```

Do **not** set `NEXT_PUBLIC_PAYMENTS_ENABLED` yet. Leave it `false`, or unset.

⚠️ The two legacy vars `STRIPE_PRO_PRICE_ID` / `STRIPE_ELITE_PRICE_ID` are referenced **nowhere** in
the code. They are dead. Do not "reuse" them and do not let them suggest the prices are configured.

**3. Create the webhook endpoint** at `https://www.commodityplay.ai/api/stripe/webhook`, subscribed to:

`checkout.session.completed` · `customer.subscription.created` · `customer.subscription.updated` ·
`customer.subscription.deleted` · `invoice.paid` · `invoice.payment_failed` · `charge.refunded` ·
`charge.dispute.created`

Copy its signing secret into `STRIPE_WEBHOOK_SECRET` (step 2).

**4. Confirm readiness BEFORE flipping the flag.**
The variables are only half the answer — what matters is what the *running deployment* can see.

```bash
vercel env ls production | grep STRIPE_PRICE_      # all eight names must appear
```

A name missing here is a launch that will refuse to sell. Then, with the flag still off, read the
deployment logs after any checkout attempt: the gate logs `missingPriceVars`, so an empty array means
everything is present.

**5. Flip the flag.**

```bash
vercel env add NEXT_PUBLIC_PAYMENTS_ENABLED production --value "true" --force
```

**6. Redeploy.** 🔴 This step is not optional. The flag is **build-time** — Next inlines
`process.env.NEXT_PUBLIC_PAYMENTS_ENABLED` into the client bundle, so editing the variable in Vercel
alone changes nothing on the live site.

**7. Verify (§ below) before telling anyone it is live.**

---

## Verification — run in this order, stop at the first failure

Do this in **test mode first** (`sk_test_…`, test prices, a test card) against a preview deployment.
Only then repeat in live mode with a real card and refund it.

| # | Check | Expected |
|---|---|---|
| 1 | Anonymous visitor clicks a paid CTA on `/pricing` | Navigates to `/signup?plan=…`, **not** a contact modal |
| 2 | Signed-in member clicks a paid CTA | Lands on `/checkout`, plan and price match what the page quoted |
| 3 | `POST /api/stripe/checkout` while closed | `503`, `reason: "PAYMENTS_NOT_CONFIGURED"` |
| 4 | Complete a **monthly** purchase with a test card | Redirects to Stripe, returns to the success URL, `User.tier` becomes `PRO`/`ELITE` |
| 5 | Complete an **annual** purchase | Same, and the amount is 12 × base × 0.85. This is the one that 503s if only the monthly four are set |
| 6 | Webhook delivery | `checkout.session.completed` and `customer.subscription.created` both `200`. Tier and `stripeStatus` written, period end set |
| 7 | Cancel a subscription in Stripe | `customer.subscription.deleted` → tier back to `STARTER` |
| 8 | `/account` billing section | Shows "Manage billing"; the portal opens |
| 9 | Referral code at `/checkout` | Accepted, and a discount applied **only** if a reward is configured. With none, the copy must not claim a discount was applied |
| 10 | Receipt | The charged amount and **currency** equal what `/pricing` quoted. A receipt is the proof; the repo is not |
| 11 | Replay a webhook | Second delivery is ignored (idempotent), tier unchanged |

⚠️ `shouldApplyStripeTierWrites()` refuses a **test-key event on Vercel Production** and refuses a
live/test mismatch. So a test-mode purchase verified against the production deployment will
correctly **not** move any tier — verify test mode on a Preview deployment, or expect the tier write
to be skipped by design.

---

## Rollback

```bash
vercel env add NEXT_PUBLIC_PAYMENTS_ENABLED production --value "false" --force
# then redeploy
```

- Paid CTAs return to the contact modal. **No charge can be initiated.**
- Checkout subscriptions already created are **unaffected** — they keep billing. Closing checkout
  stops *new* purchases, it does not cancel existing subscriptions. To stop those, cancel in Stripe
  or the portal.
- ⚠️ The redeploy takes a couple of minutes. If a payment problem is live and needs to stop *now*,
  disable the prices in the Stripe Dashboard first — that takes effect immediately — then roll back.

---

## What this app will never do

It does not create Stripe products, prices or coupons. `checkout/route.ts` only passes
`line_items: [{ price: priceId, quantity: 1 }]` with an ID read from the environment. Products,
prices and coupons are Dashboard objects; there is nothing to re-run in the app when they change —
only a new variable value and a redeploy.
