import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { resolveAccessTier } from "@/lib/entitlements";
import { getContentTierForSlug, getPlaybookChapters, getPlaybookHubHero } from "@/lib/content/accessors";
import { getContentStats } from "@/lib/content/content-stats";
import { memberMayAccessCareerPlaybook } from "@/lib/dashboard-module-visibility";
export const dynamic = "force-dynamic";
export const revalidate = 0;
import { PlaybookHubClient } from "./playbook-hub-client";

export const metadata = { title: "Full Playbook" };

export default async function PlaybookPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/playbook");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { progress: true },
  });

  if (!user) redirect("/login");

  if (!memberMayAccessCareerPlaybook({ track: user.track, role: user.role })) {
    redirect("/dashboard");
  }

  const [chapters, requiredTier, contentStats, hubHero] = await Promise.all([
    getPlaybookChapters(),
    getContentTierForSlug("playbook"),
    getContentStats(),
    getPlaybookHubHero(),
  ]);

  return (
    <PlaybookHubClient
      chapters={chapters}
      userTier={resolveAccessTier(user)}
      requiredTier={requiredTier as "PRO" | "ELITE"}
      contentStats={contentStats}
      hubHero={hubHero}
      canPreviewReleasingSoon={user.role === "ADMIN"}
      progress={user.progress.map((p) => ({
        chapterId: p.chapterId,
        progress: p.progress,
        completed: p.completed,
      }))}
    />
  );
}
