import { prisma } from "@/lib/prisma";

export type AdminDatabaseTableCount = {
  model: string;
  count: number | null;
};

export type AdminDatabaseUserRow = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  tier: string;
  track: string;
  isMentor: boolean;
  hasPassword: boolean;
  createdAt: Date;
};

async function safeCount(model: string, run: () => Promise<number>): Promise<AdminDatabaseTableCount> {
  try {
    return { model, count: await run() };
  } catch {
    return { model, count: null };
  }
}

export async function getAdminDatabaseTableCounts(): Promise<AdminDatabaseTableCount[]> {
  return Promise.all([
    safeCount("User", () => prisma.user.count()),
    safeCount("Account", () => prisma.account.count()),
    safeCount("Session", () => prisma.session.count()),
    safeCount("VerificationToken", () => prisma.verificationToken.count()),
    safeCount("ChapterProgress", () => prisma.chapterProgress.count()),
    safeCount("MentorQuestion", () => prisma.mentorQuestion.count()),
    safeCount("QuizResult", () => prisma.quizResult.count()),
    safeCount("KnowledgeTestResult", () => prisma.knowledgeTestResult.count()),
    safeCount("JobWaitlistEntry", () => prisma.jobWaitlistEntry.count()),
    safeCount("ContentModule", () => prisma.contentModule.count()),
    safeCount("ContentModuleRevision", () => prisma.contentModuleRevision.count()),
    safeCount("ContentAsset", () => prisma.contentAsset.count()),
    safeCount("EmailSubscriber", () => prisma.emailSubscriber.count()),
    safeCount("ContactMessage", () => prisma.contactMessage.count()),
    safeCount("TalkingPoint", () => prisma.talkingPoint.count()),
    safeCount("TrackedAccount", () => prisma.trackedAccount.count()),
    safeCount("AccountBookmark", () => prisma.accountBookmark.count()),
    safeCount("JobChatThread", () => prisma.jobChatThread.count()),
    safeCount("DemoEmailLog", () => prisma.demoEmailLog.count()),
    safeCount("UserMarketNudgeStatus", () => prisma.userMarketNudgeStatus.count()),
  ]);
}

export async function searchAdminDatabaseUsers(query: string): Promise<AdminDatabaseUserRow[]> {
  const q = query.trim();
  const users = await prisma.user.findMany({
    where: q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { email: "asc" },
    take: 200,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      tier: true,
      track: true,
      isMentor: true,
      passwordHash: true,
      createdAt: true,
    },
  });

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    tier: user.tier,
    track: user.track,
    isMentor: user.isMentor,
    hasPassword: Boolean(user.passwordHash),
    createdAt: user.createdAt,
  }));
}
