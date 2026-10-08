# CommodityPlay — Site Revamp PRD

**Product:** CommodityPlay (commodityplay.ai) — career & sales guide for commodity trading
**Date:** 2026-10-08
**Author:** Xu (Product Manager)
**Status:** Draft for client confirmation
**Language:** English
**Programming Language / Stack:** Existing app — Next.js 16 (App Router) + React + Tailwind + MUI-style components. No stack change.
**Project name (snake_case):** `commodityplay_revamp`

## Original request (verbatim)

> "Revamp the website based on the following feedback. First, remove two specified sections from the current page and relocate their content into new pages. Replace those two vacated sections with new content that will be added and updated later. Create a dedicated pricing page to host the relocated content. Redesign the site to resemble TradingView: place a 'Get Started' button in the top corner of our page, and also add a centered call-to-action later down the page that redirects users to the pricing page, similar to the TradingView pricing header link. Build pricing tiers for the two different tracks, following the pricing layout and style used on TradingView. For the new account creation and login pages, include two sections: one for agreeing to the terms and conditions with required asterisks, and an optional communication/marketing consent section."

The two "specified sections" are the **pricing sections currently embedded in each landing page** (Career and Sales).

---

## 1. Product goals

1. **Give pricing its own home.** Consolidate the two in-page pricing blocks into one dedicated, linkable `/pricing` page so pricing can be marketed, linked and updated independently of the landing pages.
2. **Adopt a proven, high-conversion pricing pattern.** Present all four paid tiers in a TradingView-style comparison table (light theme, existing brand colours) so prospective members can compare tiers and terms at a glance, and reach checkout in one click.
3. **Tighten the path to purchase and clean up consent.** Add persistent entry points to pricing (nav "Get Started" + a centered CTA band), and split the current bundled signup checkbox into a required legal agreement and a separate, optional, server-persisted marketing consent.

Non-goals at the goal level: this is a **structure-only** TradingView resemblance. Brand colours, light theme, and existing visual identity are unchanged.

---

## 2. User stories

**Prospective member (signed out)**
- As a prospective member, I want a single pricing page that compares Career and Sales plans side by side, so I can pick the right track and tier without hunting through two landing pages.
- As a prospective member, I want an obvious "Get Started" entry point in the nav and a pricing CTA further down the page, so I always know how to see plans and buy.
- As a prospective member, I want to switch between monthly and the "12 months + 2 free" term and see the savings, so I can choose the better-value option.

**Existing member (signed in)**
- As a signed-in member, I want the nav to show my account rather than a "Get Started" CTA, so I am not pushed toward a purchase I have already made.
- As a signed-in member, I want to reach the pricing page to upgrade my tier, so I can move from Pro to Elite (or into the Sales track) when ready.

**Site operator (Frances / admin)**
- As the site operator, I want every displayed price to come from one source of truth, so I can change a price in one place and have the whole site update consistently.
- As the site operator, I want pricing content in one page rather than duplicated in two, so I can update offers without editing multiple landing pages.
- As the site operator, I want marketing consent captured and stored per member, so I can honour opt-in/opt-out and demonstrate compliance.

---

## 3. Requirements pool

Priorities: **P0 = must have**, **P1 = should have**, **P2 = nice to have**.
Workstreams map to the three staged PRs: **PR1** = pricing page + section removal, **PR2** = nav CTA + centered CTA, **PR3** = auth consent.

### Workstream A — Remove embedded pricing, relocate to a dedicated page (PR1)

| # | Priority | Requirement |
|---|----------|-------------|
| A1 | P0 | Remove the `<section id="pricing">` block from the Career landing page (`src/components/landing/landing-page-client.tsx`, ~line 293) and from the Sales landing panel (`src/components/landing/sales-landing-panel.tsx`, ~line 331). |
| A2 | P0 | Build `/pricing` as a **real page** (replacing the current redirect at `src/app/pricing/pricing-redirect.tsx`) that hosts the relocated pricing content and the shared tier grid + term selector. |
| A3 | P0 | The new `/pricing` page **must remain a valid anchor/route target**. Existing links (`CAREER_PRICING_HREF`, `SALES_PRICING_HREF`, `CAREER_PLAN_HREF`, `SALES_PLAN_HREF`, `CAREER_PRICING_PATH`, `SALES_PRICING_PATH` in `src/lib/pricing-routes.ts`, plus Stripe checkout success/cancel flows) must be repointed to `/pricing` so **no dead anchor remains**. |
| A4 | P0 | `/pricing` must be **indexable** (remove the current `robots: { index: false }`). |
| A5 | P0 | All displayed prices must continue to derive from `src/data/pricing-shared.ts`. **No hardcoded price strings.** |
| A6 | P1 | Support deep-links to a specific track and plan on `/pricing` (e.g. `/pricing?track=career#plan-pro`) so old anchor semantics still resolve. |

### Workstream B — Replace vacated sections with placeholder content (PR1)

| # | Priority | Requirement |
|---|----------|-------------|
| B1 | P0 | In each landing page, where the pricing section was removed, insert a **clearly-marked TODO placeholder section** (visibly a placeholder, e.g. a commented/`TODO` heading with neutral copy). |
| B2 | P0 | Placeholder must be trivially replaceable later — a single self-contained component per landing page, no pricing logic inside. |
| B3 | P1 | Placeholder must not break page flow or the anchor order of neighbouring sections (Testimonials/Final CTA on Career; the two following sections + Team licences on Sales). |

### Workstream C — TradingView-style pricing table (PR1)

| # | Priority | Requirement |
|---|----------|-------------|
| C1 | P0 | Present **four paid tiers across two tracks** — Career Pro $19/mo, Career Elite $39/mo, Sales Pro $39/mo, Sales Elite $59/mo — plus the free **Starter** tier (Career track). |
| C2 | P0 | Adopt the TradingView **pricing table structure**: one column per tier, each with tier name → price + billing-period sub-label → savings line → CTA button → long ✓/✗ feature list. |
| C3 | P0 | Keep **existing brand colours / light theme**. No dark site-wide theme. |
| C4 | P0 | Term selector (Monthly / 12 + 2 free) drives price + savings display, reusing `PlanTermSelector` and `monthlyRateUsd()` / `termTotalUsd()` / `priceLabel()`. |
| C5 | P0 | Savings line reflects the real arithmetic: the 12 + 2 free term is **always ~14.29% off** the monthly rate (render as "Save 14%"). |
| C6 | P0 | The "Most Popular"/recommended highlight stays on **Career Elite**. |
| C7 | P1 | Long ✓/✗ feature list per column, so tiers are genuinely comparable (replace today's short bullet list). |
| C8 | P1 | CTA button label uses the TradingView convention ("Get Started" / "Choose plan"); free Starter uses "Join Free". |

**Track presentation (decision):** use a **single table with a track switcher** (segmented control: *Career | Sales*) at the top of the pricing page, combined with the existing billing-term toggle. Rationale: TradingView presents one comparison surface with toggle controls rather than stacked tables; a switcher keeps the feature lists aligned and comparable, avoids doubling page height, and stays mobile-friendly. Career is the default. Starter appears only in the Career view (it is free and Career-scoped). *(This is a defaulted decision — see Open Questions Q3.)*

### Workstream D — Nav "Get Started" CTA (PR2)

| # | Priority | Requirement |
|---|----------|-------------|
| D1 | P0 | Add a **"Get Started"** button in the top corner of the nav (`src/components/nav.tsx`), in the right-hand action cluster. |
| D2 | P0 | It links to the new `/pricing` page. |
| D3 | P0 | **Signed-out only.** When signed in, keep the existing avatar + tier badge + dropdown; do not show "Get Started". |
| D4 | P1 | Coexist sensibly with the existing `Sign in` (ghost) and `Join Free` (primary) buttons — recommend replacing `Join Free` with `Get Started` to avoid two competing primaries. |
| D5 | P1 | Mirror the CTA in the mobile menu. |

### Workstream E — Centered CTA band (PR2)

| # | Priority | Requirement |
|---|----------|-------------|
| E1 | P0 | Add a **centered call-to-action band lower down the page**, analogous to TradingView's pricing header link, that redirects to `/pricing`. |
| E2 | P0 | Applies to the landing page(s); place it in the vacated flow so it reads naturally with the surrounding sections. |
| E3 | P1 | Copy follows the existing `PRICING_CTA` pattern in `pricing-shared.ts` (headline + supporting line + button). |
| E4 | P2 | Reuse a single shared component so Career and Sales stay in sync. |

### Workstream F — Signup / login consent (PR3)

| # | Priority | Requirement |
|---|----------|-------------|
| F1 | P0 | **Split the current single `gdpr` checkbox** in `src/app/(auth)/signup/page.tsx` into **two separate sections**. |
| F2 | P0 | **Section 1 — Terms & Conditions (REQUIRED).** A required checkbox agreeing to the Terms of Service and Privacy Policy, with links to `/terms` and `/privacy`. The label carries a **required asterisk (`*`)**, and the field is **mandatory**: form submission is blocked with an inline validation message until checked. |
| F3 | P0 | **Section 2 — Marketing / communication consent (OPTIONAL).** A separate, **optional** checkbox for receiving the Email Digest and onboarding/marketing emails. It has **no asterisk**, defaults to **unchecked**, and **does not block submission**. |
| F4 | P0 | The optional marketing consent value **must be persisted server-side**. Requires a schema change: add field(s) to the `User` model (e.g. `marketingConsent BOOLEAN NOT NULL DEFAULT false` and `marketingConsentAt TIMESTAMP(3)`), and record terms acceptance (e.g. `termsAcceptedAt`). Implement via the **idempotent SQL in `src/lib/db-schema-migrations.ts`** (`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS …`) — **do not use `prisma/migrations/`** — and keep `prisma/schema.prisma` in sync. |
| F5 | P0 | The register API (`/api/auth/register`) currently accepts only name/email/password/plan/track; extend it to accept and store the two consent values. |
| F6 | P0 | **Login page** (`src/app/(auth)/login/login-form.tsx`) gets the two-section treatment consistent with signup. *Defaulting:* because login creates no account, the **required asterisk / blocking checkbox applies to signup only**; on login, present Section 1 as a passive Terms & Privacy acknowledgment (links, no blocking control) and Section 2 as an optional marketing opt-in. *(See Open Questions Q1.)* |
| F7 | P1 | Distinguish the two sections visually (spacing, sub-heading, or divider) so it is obvious which is mandatory and which is optional. |

---

## 4. UI / interaction notes

### 4.1 TradingView-style pricing table (adapted to CommodityPlay, light theme)

One column per tier; columns render top-to-bottom as:

1. **Tier name** (e.g. "Pro", "Elite") — with a "Most Popular" badge on Career Elite.
2. **Price + billing-period sub-label** — big price from `pricing-shared.ts` (e.g. `USD 19` on the monthly term; `USD 16.29` on the 12 + 2 term), with a smaller sub-label beneath: `/month` for monthly, or `billed USD 228 · 12 months + 2 free` for the long term.
3. **Savings line** — only shown on the 12 + 2 term: "Save 14%" (14.29% rounded down). Hidden on monthly.
4. **CTA button** — full-width, per tier: "Get Started" (paid), "Join Free" (Starter). Routes to the correct track/plan checkout.
5. **Long ✓ / ✗ feature list** — every row present in every column, with a check or cross, so the columns align into a true comparison matrix (replaces today's short per-tier bullets).

Adaptation notes:
- **Light theme, existing brand blue/teal** — do not introduce TradingView's dark palette.
- The term toggle sits above the table (shared control), and the **track switcher** (Career | Sales) sits alongside it. Changing either re-renders price, sub-label, savings and CTA without a page reload.
- Mobile: the table collapses to horizontally-scrollable columns or stacked cards (keep the switcher/toggle sticky at the top).

### 4.2 Entry points
- **Nav (top corner):** "Get Started" button → `/pricing`, signed-out only.
- **Centered CTA band (lower page):** headline + supporting line + button → `/pricing`.

### 4.3 Auth consent blocks
Two clearly separated blocks on the signup form:
- **Required:** `I agree to the Terms of Service and Privacy Policy *` — asterisk present, blocking validation.
- **Optional:** `Send me the Email Digest and onboarding emails` — no asterisk, unchecked, non-blocking, persisted server-side.

---

## 5. Open questions

Only genuine ambiguities; everything else is defaulted and stated above.

1. **Login page consent — interactive or passive?** The request names both "account creation **and** login pages". A login screen creates no new account, so a *required* agreement with asterisks has nothing to bind to. **Default taken:** signup gets the full two-section treatment (required terms + optional marketing); login gets a passive Terms/Privacy acknowledgment plus an optional marketing opt-in. **Please confirm** whether the client instead wants an interactive required-consent block on login as well.
2. **Nav button naming.** The request says "Get Started"; the nav currently has "Join Free". **Default taken:** replace "Join Free" with "Get Started" (→ `/pricing`) so there is one clear primary action. Confirm if "Join Free" must be retained alongside it.
3. **Track presentation.** We defaulted to a single table with a **track switcher**. Confirm the client is happy with a switcher rather than two separate stacked tables.

---

## 6. Out of scope

- **No competitor or market analysis** — the client did not request it; this is a simple PRD.
- **No dark theme / brand restyle.** Structure-only TradingView resemblance; existing light theme and colours stay.
- **No real content for the two vacated sections** — placeholders only (clearly marked TODO). Final content is supplied later.
- **No price changes.** Prices stay exactly as in `pricing-shared.ts`; this PRD only re-presents them.
- **No changes to the subscription/billing model** — monthly USD subscriptions and the 12 + 2 free term are unchanged.
- **No new marketing automations.** We store marketing consent; we do not build the email sending.
- **No changes to checkout/Stripe logic** beyond repointing anchors to `/pricing`.
