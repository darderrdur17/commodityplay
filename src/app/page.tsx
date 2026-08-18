import { Suspense } from "react";
import { getLandingContent, getLandingEdgeNotes } from "@/lib/content/accessors";
import { applyContentStatsToLandingContent, getContentStats } from "@/lib/content/content-stats";
import { LandingPageClient } from "@/components/landing/landing-page-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const [contentRaw, edgeNotes, contentStats] = await Promise.all([
    getLandingContent(),
    getLandingEdgeNotes(),
    getContentStats(),
  ]);
  const content = applyContentStatsToLandingContent(contentRaw, contentStats);

  return (
    <Suspense fallback={null}>
      <LandingPageClient content={content} edgeNotes={edgeNotes} />
    </Suspense>
  );
}
