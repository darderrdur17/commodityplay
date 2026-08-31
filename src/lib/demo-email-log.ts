import { prisma } from "@/lib/prisma";

export type DemoEmailKind =
  | "mentee_answer"
  | "mentor_reminder"
  | "new_question"
  | "job_chat_question"
  | "job_chat_answer"
  | "job_interview_offer";

const DEMO_EMAIL_KIND_LABELS: Record<DemoEmailKind, string> = {
  mentee_answer: "Answer sent to member",
  mentor_reminder: "Admin reminder to mentor",
  new_question: "New question for mentor pool",
  job_chat_question: "Job chat question to hirer",
  job_chat_answer: "Job chat answer to candidate",
  job_interview_offer: "Interview offer to both parties",
};

export function demoEmailKindLabel(kind: string): string {
  return DEMO_EMAIL_KIND_LABELS[kind as DemoEmailKind] ?? kind;
}

function isDemoRecipient(to: string | string[]): boolean {
  const list = Array.isArray(to) ? to : [to];
  return list.some((e) => e.endsWith("@demo.com") || e.includes("@example.com"));
}

export async function logDemoEmail(params: {
  kind: DemoEmailKind;
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  delivered: boolean;
}): Promise<void> {
  const to = Array.isArray(params.to) ? params.to.join(", ") : params.to;
  const shouldLog = !params.delivered || isDemoRecipient(params.to) || process.env.DEMO_EMAIL_LOG === "true";
  if (!shouldLog) return;

  try {
    await prisma.demoEmailLog.create({
      data: {
        kind: params.kind,
        to,
        subject: params.subject,
        bodyText: params.text ?? params.subject,
        bodyHtml: params.html,
        delivered: params.delivered,
      },
    });
    // Keep log manageable
    const excess = await prisma.demoEmailLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: 50,
      select: { id: true },
    });
    if (excess.length > 0) {
      await prisma.demoEmailLog.deleteMany({
        where: { id: { in: excess.map((e) => e.id) } },
      });
    }
  } catch (err) {
    console.warn("[demo-email-log]", err);
  }
}

export async function listDemoEmails(limit = 20) {
  return prisma.demoEmailLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
