import type { PrismaClient } from "@prisma/client";
import { resolveMemberPersonaLabel } from "@/lib/persona-display";
import { getContentStats } from "@/lib/content/content-stats";

/** Demo accounts referenced in product feedback (Maya, Chris, Jamie). */
export const FEEDBACK_DEMO_USER_EMAILS = [
  "starter.fresh@demo.com",
  "starter.vendor@demo.com",
  "pro.vendor@demo.com",
] as const;

const FEEDBACK_DEMO_PATCHES = [
  {
    email: "starter.fresh@demo.com",
    name: "Maya Tan (Starter)",
    track: "CAREER" as const,
    tier: "STARTER" as const,
    persona: "FRESH_GRAD" as const,
    resumePersonaDone: false,
  },
  {
    email: "starter.vendor@demo.com",
    name: "Chris Lim (Starter)",
    track: "SALES" as const,
    tier: "STARTER" as const,
    persona: "VENDOR" as const,
    resumePersonaDone: false,
  },
  {
    email: "pro.vendor@demo.com",
    name: "Jamie Chen (Pro – Sales)",
    track: "SALES" as const,
    tier: "PRO" as const,
    persona: "VENDOR" as const,
    resumePersonaDone: false,
  },
];

/** Force feedback demo users into the expected DB state after general seed. */
export async function ensureFeedbackDemoUsers(prisma: PrismaClient): Promise<void> {
  for (const patch of FEEDBACK_DEMO_PATCHES) {
    await prisma.user.updateMany({
      where: { email: patch.email },
      data: {
        name: patch.name,
        track: patch.track,
        tier: patch.tier,
        persona: patch.persona,
        resumePersonaDone: patch.resumePersonaDone,
        onboardingDone: true,
      },
    });
  }
}

export type FeedbackDemoUserStatus = {
  email: string;
  track: string;
  tier: string;
  persona: string | null;
  resumePersonaDone: boolean;
  displayPersona: string | null;
  chaptersLabel: string;
};

export async function getFeedbackDemoUserStatuses(
  prisma: PrismaClient
): Promise<FeedbackDemoUserStatus[]> {
  const contentStats = await getContentStats();
  const users = await prisma.user.findMany({
    where: { email: { in: [...FEEDBACK_DEMO_USER_EMAILS] } },
    select: {
      email: true,
      track: true,
      tier: true,
      persona: true,
      resumePersonaDone: true,
      progress: { select: { completed: true } },
    },
  });

  return FEEDBACK_DEMO_USER_EMAILS.map((email) => {
    const user = users.find((u) => u.email === email);
    if (!user) {
      return {
        email,
        track: "MISSING",
        tier: "MISSING",
        persona: null,
        resumePersonaDone: false,
        displayPersona: null,
        chaptersLabel: "user not found",
      };
    }

    const completedChapters = user.progress.filter((p) => p.completed).length;
    const chaptersLabel =
      user.tier === "STARTER"
        ? `Chapter A preview · ${contentStats.chapterCount} total`
        : `${completedChapters}/${contentStats.chapterCount} completed`;

    return {
      email: user.email,
      track: user.track,
      tier: user.tier,
      persona: user.persona,
      resumePersonaDone: user.resumePersonaDone,
      displayPersona: resolveMemberPersonaLabel(
        user.track,
        user.persona,
        user.resumePersonaDone
      ),
      chaptersLabel,
    };
  });
}
