import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getContentTiersMap, getMemberDashboardContent, getNavigationGuides } from "@/lib/content/accessors";
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
  const progressPct = user.progress.length > 0
    ? Math.round(user.progress.reduce((s, p) => s + p.progress, 0) / (5 * 100) * 100)
    : 0;

  const contentTiers = await getContentTiersMap();
  const navigationGuides = await getNavigationGuides();
  const dashboardContent = await getMemberDashboardContent();

  return (
    <DashboardClient
      contentTiers={contentTiers}
      navigationGuides={navigationGuides}
      dashboardContent={dashboardContent}
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
      isAdmin={session.user.role === "ADMIN"}
    />
  );
}
