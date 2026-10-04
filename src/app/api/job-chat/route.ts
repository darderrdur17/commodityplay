import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasResolvedAccess } from "@/lib/entitlements";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getJobOpeningsData } from "@/lib/content/accessors";
import {
  canCandidateSend,
  jobChatRespondUrl,
  parseJobChatMessages,
  type JobChatMessage,
} from "@/lib/job-chat";
import { sendJobChatQuestionToHirer } from "@/lib/email";
import { ensureJobChatInfrastructure } from "@/lib/setup-database";

const postSchema = z.object({
  jobId: z.string().min(1),
  message: z.string().min(10, "Message must be at least 10 characters").max(500),
});

function serializeThread(
  thread: {
    id: string;
    jobId: string;
    jobTitle: string;
    company: string;
    hirerEmail: string;
    hirerToken: string;
    messages: unknown;
    exchangeCount: number;
    interviewOffered: boolean;
    updatedAt: Date;
  },
  isAdmin: boolean
) {
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
    canReset: isAdmin,
    ...(isAdmin
      ? {
          hirerRespondUrl: jobChatRespondUrl(thread.hirerToken),
          hirerEmail: thread.hirerEmail,
        }
      : {}),
  };
}

async function loadChatUser(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    // `email` (already selected) feeds the administrator override; the billing
    // columns are required by `hasResolvedAccess` at the call sites, so a lapsed
    // Elite subscription cannot keep opening chat threads.
    select: {
      tier: true,
      role: true,
      email: true,
      name: true,
      stripeStatus: true,
      stripeCurrentPeriodEnd: true,
      stripePriceId: true,
    },
  });
}

export async function GET(req: NextRequest) {
  await ensureJobChatInfrastructure();
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await loadChatUser(session.user.id);
  if (!user || !hasResolvedAccess(user, "ELITE")) {
    return NextResponse.json({ error: "Elite membership required" }, { status: 403 });
  }
  const isAdmin = user.role === "ADMIN";

  const jobId = req.nextUrl.searchParams.get("jobId");
  if (jobId) {
    const thread = await prisma.jobChatThread.findUnique({
      where: { userId_jobId: { userId: session.user.id, jobId } },
    });
    if (!thread) {
      return NextResponse.json({
        thread: null,
        canReset: false,
        ...(isAdmin ? { adminRetest: true } : {}),
      });
    }
    return NextResponse.json({ thread: serializeThread(thread, isAdmin) });
  }

  const threads = await prisma.jobChatThread.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    // Safety cap. Threads are per-user and nothing derives counts from this
    // array, so a cap cannot skew any displayed total.
    take: 100,
  });
  return NextResponse.json({ threads: threads.map((t) => serializeThread(t, isAdmin)) });
}

export async function POST(req: NextRequest) {
  await ensureJobChatInfrastructure();
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await loadChatUser(session.user.id);
  if (!user || !hasResolvedAccess(user, "ELITE")) {
    return NextResponse.json({ error: "Elite membership required" }, { status: 403 });
  }
  const isAdmin = user.role === "ADMIN";

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

  const listingHirer = {
    jobTitle: job.title,
    company: job.company,
    hirerEmail: job.hirerEmail.trim(),
    hirerName: job.hirerName?.trim() || null,
  };

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
        ...listingHirer,
        messages: messages as unknown as import("@prisma/client/runtime/library").InputJsonValue,
      },
    });
  } else {
    thread = await prisma.jobChatThread.update({
      where: { id: thread.id },
      data: {
        ...listingHirer,
        messages: messages as unknown as import("@prisma/client/runtime/library").InputJsonValue,
      },
    });
  }

  sendJobChatQuestionToHirer({
    to: listingHirer.hirerEmail,
    hirerName: listingHirer.hirerName,
    jobTitle: listingHirer.jobTitle,
    company: listingHirer.company,
    candidateLabel: user.name?.trim() || user.email,
    message: newMessage.text,
    respondToken: thread.hirerToken,
    exchangeNumber: messages.filter((m) => m.role === "candidate").length,
  }).catch((err) => console.error("[job-chat] hirer notify failed", err));

  return NextResponse.json({ thread: serializeThread(thread, isAdmin) }, { status: 201 });
}

/** Admin retest: clear this member's thread with this job. Email Log is left intact. */
export async function DELETE(req: NextRequest) {
  await ensureJobChatInfrastructure();
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await loadChatUser(session.user.id);
  if (!user || !hasResolvedAccess(user, "ELITE")) {
    return NextResponse.json({ error: "Elite membership required" }, { status: 403 });
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const jobId = req.nextUrl.searchParams.get("jobId");
  if (!jobId) {
    return NextResponse.json({ error: "jobId is required" }, { status: 400 });
  }

  await prisma.jobChatThread.deleteMany({
    where: { userId: session.user.id, jobId },
  });

  return NextResponse.json({ thread: null, canReset: false, adminRetest: true });
}
