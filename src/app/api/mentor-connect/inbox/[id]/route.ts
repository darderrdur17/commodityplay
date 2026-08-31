import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isMentorAccount } from "@/lib/mentor-demo";
import { answerMentorQuestion } from "@/lib/mentor-questions";

const schema = z.object({
  answer: z.string().min(10).max(2000),
  mentorShareOptIn: z.boolean().optional().default(false),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || !isMentorAccount(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const mentorUser = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: { id: true },
  });
  if (!mentorUser) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await prisma.mentorQuestion.findUnique({ where: { id } });
  if (!existing || existing.userId === mentorUser.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const result = await answerMentorQuestion({
      questionId: id,
      answer: parsed.data.answer,
      mentorShareOptIn: parsed.data.mentorShareOptIn,
      answeredByEmail: session.user.email!,
    });

    return NextResponse.json({
      id: result.question.id,
      answer: result.question.answer,
      isAnswered: result.question.isAnswered,
      memberShareOptIn: result.question.memberShareOptIn,
      mentorShareOptIn: result.question.mentorShareOptIn,
      answeredAt: result.question.answeredAt?.toISOString() ?? null,
      menteeNotifiedAt: result.question.menteeNotifiedAt?.toISOString() ?? null,
      menteeEmail: result.email,
    });
  } catch (err) {
    const code = err instanceof Error ? err.message : "";
    if (code === "NOT_FOUND") return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (code === "ALREADY_ANSWERED") return NextResponse.json({ error: "Already answered" }, { status: 409 });
    console.error("[mentor-inbox/answer]", err);
    return NextResponse.json({ error: "Failed to save answer" }, { status: 500 });
  }
}
