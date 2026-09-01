import { prisma } from "@/lib/prisma";

export type DemoEmailKind =
  | "mentee_answer"
  | "mentor_reminder"
  | "new_question"
  | "job_chat_question"
  | "job_chat_answer"
  | "job_interview_offer"
  | "billing_receipt";

const DEMO_EMAIL_KIND_LABELS: Record<DemoEmailKind, string> = {
  mentee_answer: "Answer sent to member",
  mentor_reminder: "Admin reminder to mentor",
  new_question: "New question for mentor pool",
  job_chat_question: "Job chat question to hirer",
  job_chat_answer: "Job chat answer to candidate",
  job_interview_offer: "Interview offer to both parties",
  billing_receipt: "Subscription payment receipt",
};

export function demoEmailKindLabel(kind: string): string {
  return DEMO_EMAIL_KIND_LABELS[kind as DemoEmailKind] ?? kind;
}

function isDemoRecipient(to: string | string[]): boolean {
  const list = Array.isArray(to) ? to : [to];
  return list.some((e) => e.endsWith("@demo.com") || e.includes("@example.com"));
}

const PRIVATE_LIVE_CHAT_KINDS = new Set<DemoEmailKind>([
  "job_chat_question",
  "job_chat_answer",
  "job_interview_offer",
]);

/** Job Live Chat bodies are private — admin log keeps metadata (+ hirer link for demo testing only). */
function redactPrivateLiveChatLog(
  kind: DemoEmailKind,
  text?: string,
  html?: string
): { text: string; html: string } {
  const respondLink =
    kind === "job_chat_question" ? text?.match(/https?:\/\/[^\s]+/)?.[0] : undefined;
  const demoLinkNote = respondLink
    ? `\n\nHirer reply link (demo testing only): ${respondLink}`
    : "";

  return {
    text: `[Private Live Chat notification — conversation content is not stored in admin logs.]${demoLinkNote}`,
    html: html
      ? "[Private Live Chat notification — conversation content is not stored in admin logs.]"
      : "",
  };
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

  const redacted = PRIVATE_LIVE_CHAT_KINDS.has(params.kind)
    ? redactPrivateLiveChatLog(params.kind, params.text, params.html)
    : { text: params.text ?? params.subject, html: params.html };

  try {
    await prisma.demoEmailLog.create({
      data: {
        kind: params.kind,
        to,
        subject: params.subject,
        bodyText: redacted.text,
        bodyHtml: redacted.html,
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
