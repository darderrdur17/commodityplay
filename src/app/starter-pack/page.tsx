import { auth } from "@/lib/auth";
import { getStarterPackAssetUrls, getStarterPackContent } from "@/lib/content/accessors";
import { getContentStats } from "@/lib/content/content-stats";
import { StarterPackClient } from "./starter-pack-client";
import { BRAND_NAME } from "@/lib/brand";

export const dynamic = "force-dynamic";

export const metadata = {
  title: `Starter Pack — ${BRAND_NAME}`,
  description: "Free starter pack — 5 infographics, weekly market note, Chapter A preview, and Desk Glossary.",
};

export default async function StarterPackPage() {
  const session = await auth();
  const [content, assetUrls, contentStats] = await Promise.all([
    getStarterPackContent(),
    session?.user ? getStarterPackAssetUrls() : Promise.resolve({}),
    getContentStats(),
  ]);

  return (
    <StarterPackClient
      infographics={content.infographics}
      marketNote={content.marketNote}
      chapterPreview={content.chapterPreview}
      assetUrls={assetUrls}
      isLoggedIn={!!session?.user}
      glossaryCount={contentStats.glossaryCount}
      chapterCount={contentStats.chapterCount}
    />
  );
}
