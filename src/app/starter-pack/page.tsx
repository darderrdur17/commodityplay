import { auth } from "@/lib/auth";
import { getStarterPackAssetUrls, getStarterPackContent } from "@/lib/content/accessors";
import { StarterPackClient } from "./starter-pack-client";
import { BRAND_NAME } from "@/lib/brand";

export const dynamic = "force-dynamic";

export const metadata = {
  title: `Starter Pack — ${BRAND_NAME}`,
  description: "Free starter pack — 5 infographics, weekly market note, Chapter A preview, and Desk Glossary.",
};

export default async function StarterPackPage() {
  const session = await auth();
  const content = await getStarterPackContent();
  const assetUrls = session?.user ? await getStarterPackAssetUrls() : {};
  return (
    <StarterPackClient
      infographics={content.infographics}
      marketNote={content.marketNote}
      chapterPreview={content.chapterPreview}
      assetUrls={assetUrls}
      isLoggedIn={!!session?.user}
    />
  );
}
