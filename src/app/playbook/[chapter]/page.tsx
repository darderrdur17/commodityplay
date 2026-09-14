import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getContentTierForSlug, getPlaybookChapters, getPlaybookSections, getPlaybookAssetUrls, getPlaybookChapterAssets } from "@/lib/content/accessors";
export const dynamic = "force-dynamic";
export const revalidate = 0;
import { hasAccess } from "@/lib/utils";
import { isPlaybookChapterReleasingSoon } from "@/lib/content/playbook-payload";
import { memberMayAccessCareerPlaybook } from "@/lib/dashboard-module-visibility";
import { ChapterClient } from "./chapter-client";

export async function generateMetadata({ params }: { params: Promise<{ chapter: string }> }) {
  const { chapter } = await params;
  const chapters = await getPlaybookChapters();
  const ch = chapters.find((c) => c.id === chapter);
  if (!ch) return { title: "Chapter Not Found" };
  return { title: `Chapter ${ch.letter}: ${ch.title}` };
}

export default async function ChapterPage({ params }: { params: Promise<{ chapter: string }> }) {
  const { chapter } = await params;
  const chapters = await getPlaybookChapters();
  const chapterData = chapters.find((c) => c.id === chapter);
  if (!chapterData) notFound();

  const session = await auth();
  if (!session?.user?.id) redirect(`/login?callbackUrl=/playbook/${chapter}`);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tier: true, track: true, role: true },
  });

  if (!user) redirect("/login");

  if (!memberMayAccessCareerPlaybook({ track: user.track, role: user.role })) {
    redirect("/dashboard");
  }

  const requiredTier = await getContentTierForSlug("playbook");
  const hasPlaybookAccess = hasAccess(user.tier, requiredTier as "PRO" | "ELITE");
  if (!hasPlaybookAccess && !chapterData.preview) {
    redirect("/pricing?locked=playbook");
  }

  const isAdminPreview = user.role === "ADMIN";
  if (isPlaybookChapterReleasingSoon(chapterData) && !isAdminPreview) {
    redirect("/playbook");
  }

  const sections = await getPlaybookSections(chapter);
  const [assetUrls, sectionAssetsMap] = await Promise.all([
    getPlaybookAssetUrls(),
    getPlaybookChapterAssets(chapter),
  ]);

  return (
    <ChapterClient
      chapter={chapterData}
      sections={sections}
      chapters={chapters}
      userTier={user.tier}
      hasPlaybookAccess={hasPlaybookAccess}
      assetUrls={assetUrls}
      sectionAssetsMap={sectionAssetsMap}
      skipReleasingSoonNav={!isAdminPreview}
    />
  );
}
