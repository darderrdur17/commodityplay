import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getJobOpeningsData } from "@/lib/content/accessors";
import {
  canCandidateSend,
  parseJobChatMessages,
  type JobChatMessage,
} from "@/lib/job-chat";
import { sendJobChatQuestionToHirer } from "@/lib/email";
import { ensureJobChatInfrastructure } from "@/lib/setup-database";

const postSchema = z.object({
  jobId: z.string().min(1),
  message: z.string().min(10, "Message must be at least 10 characters").max(500),
});

function serializeThread(thread: {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  messages: unknown;
  exchangeCount: number;
  interviewOffered: boolean;
  updatedAt: Date;
}) {
  const messages = parseJobChatMessages(thread.messages);
  return {
    id: thread.id,
    jobId: thread.jobId,
    jobTitle: thread.jobTitle,
    company: thread.company,
    messages,
    exchangeCount: thread.exchangeCount,
    interviewOffered: thread.interviewOffered,
    canSend: canCandidateSend(messages, thread.exchangeCount),
    updatedAt: thread.updatedAt.toISOString(),
  };
}

export async function GET(req: NextRequest) {
  await ensureJobChatInfrastructure();
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tier: true },
  });
  if (!user || user.tier !== "ELITE") {
    return NextResponse.json({ error: "Elite membership required" }, { status: 403 });
  }

  const jobId = req.nextUrl.searchParams.get("jobId");
  if (jobId) {
    const thread = await prisma.jobChatThread.findUnique({
      where: { userId_jobId: { userId: session.user.id, jobId } },
    });
    if (!thread) {
      return NextResponse.json({ thread: null });
    }
    return NextResponse.json({ thread: serializeThread(thread) });
  }

  const threads = await prisma.jobChatThread.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ threads: threads.map(serializeThread) });
}

export async function POST(req: NextRequest) {
  await ensureJobChatInfrastructure();
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tier: true, email: true, name: true },
  });
  if (!user || user.tier !== "ELITE") {
    return NextResponse.json({ error: "Elite membership required" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { jobs } = await getJobOpeningsData();
  const job = jobs.find((j) => j.id === parsed.data.jobId);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
  if (!job.hirerEmail?.trim()) {
    return NextResponse.json({ error: "This listing does not support live chat yet" }, { status: 400 });
  }

  let thread = await prisma.jobChatThread.findUnique({
    where: { userId_jobId: { userId: session.user.id, jobId: job.id } },
  });

  const existingMessages = thread ? parseJobChatMessages(thread.messages) : [];
  if (!canCandidateSend(existingMessages, thread?.exchangeCount ?? 0)) {
    return NextResponse.json(
      { error: "Wait for the hirer's reply or you've reached the 3-question limit" },
      { status: 400 }
    );
  }

  const newMessage: JobChatMessage = {
    role: "candidate",
    text: parsed.data.message.trim(),
    createdAt: new Date().toISOString(),
  };
  const messages = [...existingMessages, newMessage];

  if (!thread) {
    thread = await prisma.jobChatThread.create({
      data: {
        userId: session.user.id,
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        hirerEmail: job.hirerEmail.trim(),
        hirerName: job.hirerName?.trim() || null,
        messages: messages as unknown as import("@prisma/client/runtime/library").InputJsonValue,
      },
    });
  } else {
    thread = await prisma.jobChatThread.update({
      where: { id: thread.id },
      data: { messages: messages as unknown as import("@prisma/client/runtime/library").InputJsonValue },
    });
  }

  sendJobChatQuestionToHirer({
    to: thread.hirerEmail,
    hirerName: thread.hirerName,
    jobTitle: thread.jobTitle,
    company: thread.company,
    candidateLabel: user.name?.trim() || user.email,
    message: newMessage.text,
    respondToken: thread.hirerToken,
    exchangeNumber: messages.filter((m) => m.role === "candidate").length,
  }).catch((err) => console.error("[job-chat] hirer notify failed", err));

  return NextResponse.json({ thread: serializeThread(thread) }, { status: 201 });
}
