import { Suspense } from "react";
import { getLandingContent, getLandingEdgeNotes } from "@/lib/content/accessors";
import { LandingPageClient } from "@/components/landing/landing-page-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const [content, edgeNotes] = await Promise.all([getLandingContent(), getLandingEdgeNotes()]);
  return (
    <Suspense fallback={null}>
      <LandingPageClient content={content} edgeNotes={edgeNotes} />
    </Suspense>
  );
}
