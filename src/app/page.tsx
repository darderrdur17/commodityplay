import { Suspense } from "react";
import { getLandingContent, getLandingEdgeNotes, getStarterPackContent } from "@/lib/content/accessors";
import { applyContentStatsToLandingContent, getContentStats } from "@/lib/content/content-stats";
import { LandingPageClient } from "@/components/landing/landing-page-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
      />
    </Suspense>
  );
}
