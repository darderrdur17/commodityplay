import { auth } from "@/lib/auth";
import { requireSoleAdmin } from "@/lib/admin-access";
import { getLandingContent, getStarterPackContent } from "@/lib/content/accessors";
import { applyContentStatsToLandingContent, getContentStats } from "@/lib/content/content-stats";
import { PricingPageClient } from "@/components/pricing/pricing-page-client";
import { BRAND_NAME } from "@/lib/brand";

/**
 * The dedicated pricing page. `force-dynamic` because it reads the session (to pin
 * a signed-in member to their own track) and the CMS content on every request.
 *
 * It MUST stay reachable by anonymous crawlers: it is listed in `sitemap.ts` and
 * deliberately NOT in `proxy.ts` PROTECTED_PATHS, so this returns HTTP 200 to an
 * anonymous request. `robots: { index: false }` was removed — the page is now the
 * canonical pricing surface and should be indexed.
 */
export const dynamic = "force-dynamic";

export const metadata = {
  title: `Pricing — ${BRAND_NAME}`,
  description:
    "Compare Career and Sales plans side by side — billed monthly, or annually and save 15%. Start free with the Starter Pack.",
};

export default async function PricingPage() {
  const session = await auth();
  // Administrators are NOT pinned to their own track on /pricing (see R-1 below):
  // they may preview both tracks. Authority comes from the ADMIN_EMAILS allowlist
  // via the DB-backed `requireSoleAdmin()`, never from `User.role`. This resolves
  // to `null` (not a throw) for anonymous or non-admin callers, so the page stays
  // publicly reachable for crawlers.
  const admin = await requireSoleAdmin();
  const [contentRaw, contentStats, starterPack] = await Promise.all([
    getLandingContent(),
    getContentStats(),
    getStarterPackContent(),
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
    />
  );
}
