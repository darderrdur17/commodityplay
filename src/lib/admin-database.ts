import { prisma } from "@/lib/prisma";
import { ensureContentInfrastructure } from "@/lib/content/repository";
import { ensureFeaturesInfrastructure } from "@/lib/setup-database";

export type AdminDatabaseTableCount = {
  model: string;
  label: string;
  group: "Accounts" | "Content" | "Leads" | "Activity";
  count: number | null;
};

export type AdminDatabaseUserRow = {
  id: string;
  name: string | null;
  email: string;
  company: string | null;
  role: string;
  tier: string;
  track: string;
  isMentor: boolean;
  hasPassword: boolean;
  createdAt: Date;
};

export type AdminDatabaseSubscriberRow = {
  id: string;
  email: string;
  name: string | null;
  source: string | null;
  subscribed: boolean;
  createdAt: Date;
};

export type AdminDatabaseContactRow = {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: Date;
};

const TABLE_DEFS: {
  model: string;
  label: string;
  group: AdminDatabaseTableCount["group"];
  count: () => Promise<number>;
}[] = [
  { model: "User", label: "Members", group: "Accounts", count: () => prisma.user.count() },
  { model: "Account", label: "Sign-in links", group: "Accounts", count: () => prisma.account.count() },
  { model: "Session", label: "Sessions", group: "Accounts", count: () => prisma.session.count() },
  { model: "VerificationToken", label: "Reset tokens", group: "Accounts", count: () => prisma.verificationToken.count() },
  { model: "ContentModule", label: "CMS modules", group: "Content", count: () => prisma.contentModule.count() },
  { model: "ContentModuleRevision", label: "CMS revisions", group: "Content", count: () => prisma.contentModuleRevision.count() },
  { model: "ContentAsset", label: "Uploaded files", group: "Content", count: () => prisma.contentAsset.count() },
  { model: "EmailSubscriber", label: "Newsletter", group: "Leads", count: () => prisma.emailSubscriber.count() },
  { model: "ContactMessage", label: "Contact Us", group: "Leads", count: () => prisma.contactMessage.count() },
  { model: "JobWaitlistEntry", label: "Job waitlist", group: "Leads", count: () => prisma.jobWaitlistEntry.count() },
  { model: "DemoEmailLog", label: "Email log", group: "Leads", count: () => prisma.demoEmailLog.count() },
  { model: "ChapterProgress", label: "Chapter progress", group: "Activity", count: () => prisma.chapterProgress.count() },
  { model: "MentorQuestion", label: "Mentor questions", group: "Activity", count: () => prisma.mentorQuestion.count() },
  { model: "QuizResult", label: "Persona quizzes", group: "Activity", count: () => prisma.quizResult.count() },
  { model: "KnowledgeTestResult", label: "Knowledge tests", group: "Activity", count: () => prisma.knowledgeTestResult.count() },
  { model: "TalkingPoint", label: "Prep notes", group: "Activity", count: () => prisma.talkingPoint.count() },
  { model: "TrackedAccount", label: "Tracked accounts", group: "Activity", count: () => prisma.trackedAccount.count() },
  { model: "AccountBookmark", label: "Bookmarks", group: "Activity", count: () => prisma.accountBookmark.count() },
  { model: "JobChatThread", label: "Job chat threads", group: "Activity", count: () => prisma.jobChatThread.count() },
  { model: "UserMarketNudgeStatus", label: "Nudge status", group: "Activity", count: () => prisma.userMarketNudgeStatus.count() },
];

export async function prepareAdminDatabase(): Promise<void> {
  try {
    await ensureContentInfrastructure();
  } catch (err) {
    console.error("[admin-database] CMS schema repair skipped:", err);
  }
  try {
    await ensureFeaturesInfrastructure();
  } catch (err) {
    console.error("[admin-database] Feature schema repair skipped:", err);
  }
}

export async function loadAdminDatabasePage(query: string) {
  await prepareAdminDatabase();
  const [tables, users, subscribers, contacts] = await Promise.all([
    getAdminDatabaseTableCounts(),
    searchAdminDatabaseUsers(query).catch((err) => {
      console.error("[admin-database] users query failed:", err);
      return [] as AdminDatabaseUserRow[];
    }),
    searchAdminDatabaseSubscribers(query).catch((err) => {
      console.error("[admin-database] subscribers query failed:", err);
      return [] as AdminDatabaseSubscriberRow[];
    }),
    searchAdminDatabaseContacts(query).catch((err) => {
      console.error("[admin-database] contacts query failed:", err);
      return [] as AdminDatabaseContactRow[];
    }),
  ]);
  return { tables, users, subscribers, contacts };
}

async function safeCount(def: (typeof TABLE_DEFS)[number]): Promise<AdminDatabaseTableCount> {
  try {
    return { model: def.model, label: def.label, group: def.group, count: await def.count() };
  } catch {
    return { model: def.model, label: def.label, group: def.group, count: null };
  }
}

export async function getAdminDatabaseTableCounts(): Promise<AdminDatabaseTableCount[]> {
  return Promise.all(TABLE_DEFS.map(safeCount));
}

export async function searchAdminDatabaseUsers(query: string): Promise<AdminDatabaseUserRow[]> {
  const q = query.trim();
  const users = await prisma.user.findMany({
    where: q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
            { company: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      name: true,
      email: true,
      company: true,
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
    company: user.company,
    role: user.role,
    tier: user.tier,
    track: user.track,
    isMentor: user.isMentor,
    hasPassword: Boolean(user.passwordHash),
    createdAt: user.createdAt,
  }));
}

export async function searchAdminDatabaseSubscribers(query: string): Promise<AdminDatabaseSubscriberRow[]> {
  const q = query.trim();
  return prisma.emailSubscriber.findMany({
    where: q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function searchAdminDatabaseContacts(query: string): Promise<AdminDatabaseContactRow[]> {
  const q = query.trim();
  return prisma.contactMessage.findMany({
    where: q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
            { message: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}
