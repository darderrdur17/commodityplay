import { auth } from "@/lib/auth";
import { getStarterPackAssetUrls, getStarterPackContent } from "@/lib/content/accessors";
import { resolveStarterMarketNote } from "@/data/starter-pack";
import { getContentStats, formatContentPlaceholders } from "@/lib/content/content-stats";
import { StarterPackClient } from "./starter-pack-client";
import { BRAND_NAME } from "@/lib/brand";

export const dynamic = "force-dynamic";

export const metadata = {
  title: `Starter Pack — ${BRAND_NAME}`,
  description: "Free starter pack — 5 infographics, biweekly email digest, Chapter A preview, and Desk Glossary.",
};

export default async function StarterPackPage() {
  const session = await auth();
  const [content, assetUrls, contentStats] = await Promise.all([
    getStarterPackContent(),
    getStarterPackAssetUrls(),
    getContentStats(),
  ]);

  const marketNote = resolveStarterMarketNote(content.emailDigest, session?.user?.track);
  const upgradeCta = {
    ...content.upgradeCta,
    description: formatContentPlaceholders(content.upgradeCta.description, contentStats),
  };

  return (
    <StarterPackClient
      infographics={content.infographics}
      marketNote={marketNote}
      chapterPreview={content.chapterPreview}
      assetUrls={assetUrls}
      isLoggedIn={!!session?.user}
      glossaryCount={contentStats.glossaryCount}
      chapterCount={contentStats.chapterCount}
      upgradeCta={upgradeCta}
    />
  );
}
