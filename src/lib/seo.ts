import {
  BRAND_DOMAIN,
  BRAND_LEGAL_NAME,
  BRAND_NAME,
  BRAND_SITE_URL,
  BRAND_TAGLINE,
} from "@/lib/brand";

/**
 * Search-facing constants and structured data, in ONE place.
 *
 * Why this module exists: the canonical origin, the organisation identity and the
 * site description were previously implicit — `metadataBase` in the root layout,
 * `BRAND_SITE_URL` in `sitemap.ts`, and prose in the layout's `description`. Three
 * copies of "who we are" is how a brand entity gets split in Google's index, so
 * everything that feeds a crawler is derived from `src/lib/brand.ts` here.
 *
 * ⚠️ These are PLAIN exports (no `server-only`) so the audit harness can import
 * and assert them. Keep it that way.
 */

/** The canonical public origin. Must match `sitemap.ts` and `metadataBase`. */
export const CANONICAL_ORIGIN = BRAND_SITE_URL;

/** Homepage description, reused by metadata and the WebSite entity. */
export const SITE_DESCRIPTION =
  "The definitive career and sales guide for commodity trading. Starter, Pro, and Elite resources for anyone building a desk, breaking in, or selling into trading firms.";

/**
 * Paths that may appear as canonicals.
 *
 * Only the seven public marketing pages qualify. Everything else in the app is
 * gated by `src/proxy.ts` and 307-redirects an anonymous crawler to `/login` or
 * `/signup` — a canonical pointing at a redirect is worse than none, because it
 * tells Google to consolidate signals onto a URL it cannot fetch. This list is
 * deliberately the same set as `PUBLIC_ROUTES` in `src/app/sitemap.ts`; the audit
 * harness asserts the two agree.
 */
export const CANONICAL_PATHS = [
  "/",
  "/pricing",
  "/starter-pack",
  "/mentor-apply",
  "/waitlist",
  "/privacy",
  "/terms",
] as const;

export type CanonicalPath = (typeof CANONICAL_PATHS)[number];

/**
 * `alternates` block for a page's `metadata`.
 *
 * The value is RELATIVE on purpose: Next resolves it against `metadataBase`, so a
 * preview deployment still emits its own host rather than advertising production.
 * That is the opposite of `sitemap.ts`, which must always name the canonical origin
 * — see the comment in that file.
 */
export function canonicalAlternates(path: CanonicalPath): { canonical: CanonicalPath } {
  return { canonical: path };
}

/** Stable `@id` for the organisation, so other entities can reference it. */
export const ORGANIZATION_ID = `${CANONICAL_ORIGIN}/#organization`;
export const WEBSITE_ID = `${CANONICAL_ORIGIN}/#website`;

/**
 * `Organization` — lets Google build a brand ENTITY rather than a loose page.
 *
 * `sameAs` is intentionally empty rather than filled with guessed profile URLs:
 * an incorrect `sameAs` actively harms entity reconciliation, and the real
 * profiles (LinkedIn, etc.) are the owner's to confirm.
 */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: BRAND_NAME,
    legalName: BRAND_LEGAL_NAME,
    url: CANONICAL_ORIGIN,
    logo: `${CANONICAL_ORIGIN}/brand/logo-mark.png`,
    email: `hello@${BRAND_DOMAIN}`,
    slogan: BRAND_TAGLINE,
    description: SITE_DESCRIPTION,
    sameAs: [] as string[],
  };
}

/**
 * `WebSite` — the entity a brand-name query resolves against.
 *
 * 🔴 There is NO `potentialAction` / `SearchAction` here, and that is deliberate.
 * A `SearchAction` asserts that the site has a search endpoint of the form
 * `…?q={search_term_string}`. CommodityPlay does not have one yet, so declaring it
 * would be invalid structured data and could earn a manual action rather than a
 * sitelinks search box. Add it in the same change that ships real site search —
 * not before.
 */
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: CANONICAL_ORIGIN,
    name: BRAND_NAME,
    description: SITE_DESCRIPTION,
    inLanguage: "en",
    publisher: { "@id": ORGANIZATION_ID },
  };
}

/**
 * Everything the root layout should emit, in one array.
 *
 * The return type is an explicit TUPLE, not an inferred array. Inference gives
 * `(Organization | WebSite)[]`, which makes a positional destructure
 * (`const [org, site] = siteJsonLd()`) a union type and loses `publisher`. The
 * tuple keeps each position's real shape.
 */
export function siteJsonLd(): [
  ReturnType<typeof organizationJsonLd>,
  ReturnType<typeof websiteJsonLd>,
] {
  return [organizationJsonLd(), websiteJsonLd()];
}
