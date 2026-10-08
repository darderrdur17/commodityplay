import { auth } from "@/lib/auth";
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
    "Compare Career and Sales plans side by side. Monthly, or 12 months + 2 free. Starter is free forever.",
};

export default async function PricingPage() {
  const session = await auth();
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
    />
  );
}
