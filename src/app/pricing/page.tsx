import { auth } from "@/lib/auth";
import { requireSoleAdmin } from "@/lib/admin-access";
import { getFaqContent, getLandingContent, getStarterPackContent } from "@/lib/content/accessors";
import { applyContentStatsToLandingContent, getContentStats } from "@/lib/content/content-stats";
import { PricingPageClient } from "@/components/pricing/pricing-page-client";
import { canonicalAlternates } from "@/lib/seo";

/**
 * The dedicated pricing page. `force-dynamic` because it reads the session (to pin
 * a signed-in member to their own track) and the CMS content on every request.
 *
 * It MUST stay reachable by anonymous crawlers: it is listed in `sitemap.ts` and
 * deliberately NOT in `proxy.ts` PROTECTED_PATHS, so this returns HTTP 200 to an
 * anonymous request. `robots: { index: false }` was removed — the page is now the
 * canonical pricing surface and should be indexed.
 *
 * It also carries the FAQ. That used to be its own `/faq` route; the owner moved
 * it here (11 Oct 2026) because the FAQ is entirely about plans, billing and
 * access. `/faq` now 308-redirects to `/pricing#faq`.
 */
export const dynamic = "force-dynamic";

export const metadata = {
  // ⚠️ No `${BRAND_NAME}` here: the root layout's `title.template` already appends
  // "| CommodityPlay." to every child segment. Interpolating it too produced
  // "Pricing — CommodityPlay. | CommodityPlay." in the live <title>.
  title: "Pricing",
  description:
    "Compare Career and Sales plans side by side — billed monthly, or annually and save 15%. Start free with the Starter Pack.",
  alternates: canonicalAlternates("/pricing"),
};

export default async function PricingPage() {
  const session = await auth();
  // Administrators are NOT pinned to their own track on /pricing (see R-1 below):
  // they may preview both tracks. Authority comes from the ADMIN_EMAILS allowlist
  // via the DB-backed `requireSoleAdmin()`, never from `User.role`. This resolves
  // to `null` (not a throw) for anonymous or non-admin callers, so the page stays
  // publicly reachable for crawlers.
  const admin = await requireSoleAdmin();
  const [contentRaw, contentStats, starterPack, faq] = await Promise.all([
    getLandingContent(),
    getContentStats(),
    getStarterPackContent(),
    getFaqContent(),
  ]);
  const content = applyContentStatsToLandingContent(contentRaw, contentStats);
  const starterPackItems = starterPack.infographics.map((info) => info.title);

  return (
    <PricingPageClient
      content={content}
      starterPackItems={starterPackItems}
      starterPackHeadline={starterPack.popupHeadline}
      userTrack={session?.user?.track ?? null}
      isAdmin={admin !== null}
      faq={faq}
    />
  );
}
