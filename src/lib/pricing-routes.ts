/**
 * Pricing URLs — the SINGLE SOURCE OF TRUTH for every pricing link in the app.
 *
 * These anchors used to point at the in-page `#pricing` sections on the two
 * landing pages. Pricing now lives on its own dedicated `/pricing` page, so every
 * helper points there. The `#pricing` / `#plan-*` fragments are PRESERVED so old
 * deep links (dashboard "Upgrade", footer "Be a Member", the in-app tier gates,
 * the Starter Pack signup callback) still land on the right column — `/pricing`
 * exposes `id="pricing"` on the controls wrapper and `id="plan-pro"` /
 * `id="plan-elite"` / `id="plan-starter"` on the tier columns.
 *
 * Never hardcode `"/pricing?track=…"` or `"/?track=…#plan-*"` anywhere else — this
 * file is the only place pricing URLs are constructed.
 */

/** Career pricing anchors — `/pricing` with the Career track pre-selected. */
export const CAREER_PRICING_HREF = "/pricing?track=career#pricing";
export const CAREER_PLAN_HREF = (plan: "pro" | "elite") => `/pricing?track=career#plan-${plan}`;

/** Sales pricing anchors — `/pricing` with the Sales track pre-selected. */
export const SALES_PRICING_HREF = "/pricing?track=sales#pricing";
export const SALES_PLAN_HREF = (plan: "pro" | "elite") => `/pricing?track=sales#plan-${plan}`;

/**
 * Path-only URLs for server redirects and signup callbacks. The hash is
 * deliberately omitted: signup appends `?fromSignup=1` to the callback, and a
 * param appended after a fragment would land in the fragment and be lost (R-3).
 */
export const CAREER_PRICING_PATH = "/pricing?track=career";
export const SALES_PRICING_PATH = "/pricing?track=sales";
