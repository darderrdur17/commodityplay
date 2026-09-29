import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { resolveAccessTier } from "@/lib/entitlements";
import { getContentTiersMap, getMemberDashboardContent, getNavigationGuides, getStarterPackAssetUrls, getStarterPackContent } from "@/lib/content/accessors";
import {
  applyContentStatsToMemberDashboard,
  getContentStats,
} from "@/lib/content/content-stats";
import { getMentorCreditUsageForUser } from "@/lib/mentor-credits-server";
import { isMentorAccount } from "@/lib/mentor-demo";
export const dynamic = "force-dynamic";
export const revalidate = 0;
import { DashboardClient } from "./dashboard-client";

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ previewTrack?: string; previewTier?: string }>;
}) {
  const { previewTrack, previewTier } = await searchParams;
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/dashboard");
  }

  const isAdmin = session.user.role === "ADMIN";

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      progress: true,
      mentorQuestions: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!user) redirect("/login");

  const isMentorUser = isMentorAccount({ isMentor: user.isMentor, email: session.user.email });

  const completedChapters = user.progress.filter((p) => p.completed).length;
  const mentorCreditUsage = await getMentorCreditUsageForUser(user);

  let mentorStats: {
    dateJoined: string;
    totalRequests: number;
    answered: number;
    pending: number;
  } | null = null;

  if (isMentorUser) {
    // Mirrors the query used in mentor-connect/inbox/page.tsx: all member
    // questions not asked by the mentor themselves.
    const [totalRequests, answered] = await Promise.all([
      prisma.mentorQuestion.count({ where: { userId: { not: user.id } } }),
      prisma.mentorQuestion.count({ where: { userId: { not: user.id }, isAnswered: true } }),
    ]);
    mentorStats = {
      dateJoined: user.createdAt.toISOString(),
      totalRequests,
      answered,
      pending: totalRequests - answered,
    };
  }

  const [contentTiers, navigationGuides, dashboardContentRaw, contentStats, starterPackContent, starterPackAssetUrls] = await Promise.all([
    getContentTiersMap(),
    getNavigationGuides(),
    getMemberDashboardContent(),
    getContentStats(),
    getStarterPackContent(),
    getStarterPackAssetUrls(),
  ]);

  const dashboardContent = applyContentStatsToMemberDashboard(dashboardContentRaw, contentStats);

  const progressPct =
    contentStats.chapterCount > 0
      ? Math.round(
          user.progress.reduce((s, p) => s + p.progress, 0) / (contentStats.chapterCount * 100) * 100
        )
      : 0;

  return (
    <DashboardClient
      contentTiers={contentTiers}
      navigationGuides={navigationGuides}
      dashboardContent={dashboardContent}
      contentStats={contentStats}
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        // Authoritative access tier: an allowlisted admin resolves to ELITE
        // (superadmin), so every card unlocks and no Starter upsell is shown.
        tier: resolveAccessTier(user),
        track: user.track,
        persona: user.persona,
        resumePersonaDone: user.resumePersonaDone,
        mentorCredits: user.mentorCredits,
        resumeCredits: user.resumeCredits,
        stripeCurrentPeriodEnd: user.stripeCurrentPeriodEnd?.toISOString(),
      }}
      stats={{
        completedChapters,
        progressPct,
        mentorQuestions: user.mentorQuestions.length,
      }}
      mentorCreditUsage={mentorCreditUsage}
      salesDeliverables={dashboardContent.salesDeliverables}
      isAdmin={isAdmin}
      isMentorUser={isMentorUser}
      previewTrack={isAdmin ? previewTrack : undefined}
      previewTier={isAdmin ? previewTier : undefined}
      mentorStats={mentorStats}
      starterPackInfographics={starterPackContent.infographics}
      starterPackAssetUrls={starterPackAssetUrls}
    />
  );
}
