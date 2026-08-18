import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getContentTiersMap, getMemberDashboardContent, getNavigationGuides } from "@/lib/content/accessors";
import {
  applyContentStatsToMemberDashboard,
  getContentStats,
} from "@/lib/content/content-stats";
import { getMentorCreditUsageForUser } from "@/lib/mentor-credits-server";
export const dynamic = "force-dynamic";
export const revalidate = 0;
import { DashboardClient } from "./dashboard-client";

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/dashboard");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      progress: true,
      mentorQuestions: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!user) redirect("/login");

  const completedChapters = user.progress.filter((p) => p.completed).length;
  const mentorCreditUsage = await getMentorCreditUsageForUser(user.id, user.tier);

  const [contentTiers, navigationGuides, dashboardContentRaw, contentStats] = await Promise.all([
    getContentTiersMap(),
    getNavigationGuides(),
    getMemberDashboardContent(),
    getContentStats(),
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
        tier: user.tier,
        track: user.track,
        persona: user.persona,
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
      isAdmin={session.user.role === "ADMIN"}
    />
  );
}
