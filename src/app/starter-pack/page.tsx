import { auth } from "@/lib/auth";
import { getStarterPackAssetUrls, getStarterPackContent } from "@/lib/content/accessors";
import { resolveStarterMarketNote } from "@/data/starter-pack";
import { getContentStats, formatContentPlaceholders } from "@/lib/content/content-stats";
import { StarterPackClient } from "./starter-pack-client";
import { canonicalAlternates } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = {
  // ⚠️ No `${BRAND_NAME}`: the layout's `title.template` appends "| CommodityPlay.".
  title: "Starter Pack",
  description: "Free starter pack — desk infographics, weekly community email, Chapter A preview, and Desk Glossary.",
  alternates: canonicalAlternates("/starter-pack"),
};

export default async function StarterPackPage() {
  const session = await auth();
  const [content, assetUrls, contentStats] = await Promise.all([
    getStarterPackContent(),
    getStarterPackAssetUrls(),
    getContentStats(),
  ]);

  const marketNote = resolveStarterMarketNote(content.emailDigest);
  const upgradeCta = {
    ...content.upgradeCta,
    description: formatContentPlaceholders(content.upgradeCta.description, contentStats),
  };

  return (
    <StarterPackClient
      hero={content.hero}
      infographics={content.infographics}
      popupHeadline={content.popupHeadline}
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
