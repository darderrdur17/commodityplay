import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import {
  canHirerReply,
  canOfferInterview,
  isConversationComplete,
  parseJobChatMessages,
  type JobChatMessage,
} from "@/lib/job-chat";
import {
  sendJobChatAnswerToCandidate,
  sendJobInterviewOfferEmails,
} from "@/lib/email";
import { ensureJobChatInfrastructure } from "@/lib/setup-database";

function serializeForHirer(thread: {
  id: string;
  jobTitle: string;
  company: string;
  hirerName: string | null;
  messages: unknown;
  exchangeCount: number;
  interviewOffered: boolean;
  user: { email: string; name: string | null };
}) {
  const messages = parseJobChatMessages(thread.messages);
  return {
    id: thread.id,
    jobTitle: thread.jobTitle,
    company: thread.company,
    hirerName: thread.hirerName,
    candidateLabel: thread.user.name?.trim() || thread.user.email,
    messages,
    exchangeCount: thread.exchangeCount,
    interviewOffered: thread.interviewOffered,
    canReply: canHirerReply(messages, thread.exchangeCount),
    canOfferInterview: canOfferInterview(messages, thread.exchangeCount, thread.interviewOffered),
    isComplete: isConversationComplete(messages, thread.exchangeCount),
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  await ensureJobChatInfrastructure();
  const { token } = await params;
  const thread = await prisma.jobChatThread.findUnique({
    where: { hirerToken: token },
    include: { user: { select: { email: true, name: true } } },
  });
  if (!thread) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }
  return NextResponse.json({ thread: serializeForHirer(thread) });
}

const patchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("reply"),
    message: z.string().min(10, "Reply must be at least 10 characters").max(800),
  }),
  z.object({
    action: z.literal("offer_interview"),
  }),
]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  await ensureJobChatInfrastructure();
  const { token } = await params;
  const thread = await prisma.jobChatThread.findUnique({
    where: { hirerToken: token },
    include: { user: { select: { email: true, name: true } } },
  });
  if (!thread) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const messages = parseJobChatMessages(thread.messages);

  if (parsed.data.action === "reply") {
    if (!canHirerReply(messages, thread.exchangeCount)) {
      return NextResponse.json({ error: "Nothing to reply to or conversation is complete" }, { status: 400 });
    }

    const reply: JobChatMessage = {
      role: "hirer",
      text: parsed.data.message.trim(),
      createdAt: new Date().toISOString(),
    };
    const nextMessages = [...messages, reply];
    const exchangeCount = thread.exchangeCount + 1;

    const updated = await prisma.jobChatThread.update({
      where: { id: thread.id },
      data: { messages: nextMessages as unknown as import("@prisma/client/runtime/library").InputJsonValue, exchangeCount },
      include: { user: { select: { email: true, name: true } } },
    });

    sendJobChatAnswerToCandidate({
      to: updated.user.email,
      candidateName: updated.user.name,
      jobTitle: updated.jobTitle,
      company: updated.company,
      answer: reply.text,
      exchangeCount,
    }).catch((err) => console.error("[job-chat] candidate notify failed", err));

    return NextResponse.json({ thread: serializeForHirer(updated) });
  }

  if (!canOfferInterview(messages, thread.exchangeCount, thread.interviewOffered)) {
    return NextResponse.json(
      { error: "Complete all 3 Q&A exchanges before offering an interview" },
      { status: 400 }
    );
  }

  const updated = await prisma.jobChatThread.update({
    where: { id: thread.id },
    data: { interviewOffered: true, interviewOfferedAt: new Date() },
    include: { user: { select: { email: true, name: true } } },
  });

  sendJobInterviewOfferEmails({
    candidateEmail: updated.user.email,
    candidateName: updated.user.name,
    hirerEmail: updated.hirerEmail,
    hirerName: updated.hirerName,
    jobTitle: updated.jobTitle,
    company: updated.company,
    messages: parseJobChatMessages(updated.messages),
  }).catch((err) => console.error("[job-chat] interview offer emails failed", err));

  return NextResponse.json({ thread: serializeForHirer(updated) });
}
