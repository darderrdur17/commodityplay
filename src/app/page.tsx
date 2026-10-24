import { Suspense } from "react";
import { getLandingContent, getLandingEdgeNotes, getStarterPackContent } from "@/lib/content/accessors";
import { applyContentStatsToLandingContent, getContentStats } from "@/lib/content/content-stats";
import { LandingPageClient } from "@/components/landing/landing-page-client";
import { canonicalAlternates } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * The landing page. Both tracks (career and sales) live on THIS route —
 * `LandingPageClient` switches on `?track=sales`, and SSR always renders career.
 *
 * The canonical is therefore `/` for both, deliberately: `?track=sales` is a
 * different view of the same document, not a different page, and giving it its own
 * canonical would create two competing URLs for one piece of content. The query
 * variant is not linked from anywhere a crawler follows — the track switcher is a
 * client-side control — so there is nothing to consolidate.
 *
 * ⚠️ No `title` here on purpose. The root layout sets
 * `title.template: "%s | CommodityPlay."`, and a template applies to CHILD
 * segments — so a page-level title of `${BRAND_NAME} — Build Your Career…` would
 * render as "CommodityPlay. — Build Your Career… | CommodityPlay.", duplicating the
 * brand. `title.default` already produces the right homepage title; only the
 * canonical needs adding. Same reasoning for `description` — it is already set in
 * the layout from `SITE_DESCRIPTION`.
 */
export const metadata = {
  alternates: canonicalAlternates("/"),
};

export default async function HomePage() {
  const [contentRaw, edgeNotes, contentStats, starterPack] = await Promise.all([
    getLandingContent(),
    getLandingEdgeNotes(),
    getContentStats(),
    getStarterPackContent(),
  ]);
  const content = applyContentStatsToLandingContent(contentRaw, contentStats);
  const starterPackItems = starterPack.infographics.map((info) => info.title);

  return (
    <Suspense fallback={null}>
      <LandingPageClient
        content={content}
        edgeNotes={edgeNotes}
        starterPackItems={starterPackItems}
        starterPackHeadline={starterPack.popupHeadline}
      />
    </Suspense>
  );
}
