import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isMentorAccount } from "@/lib/mentor-demo";
import { findAnswerableMentorQuestion } from "@/lib/mentor-inbox-scope";
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
    select: { id: true, email: true, mentorProfileId: true },
  });
  if (!mentorUser) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Scoped lookup — never `findUnique({ where: { id } })`.
  //
  // The write must be confined to the caller's own inbox, exactly as the read
  // is. A bare id lookup let a mentor answer a question addressed to a
  // *different* mentor (attributed to their own email, so the write landed
  // outside that mentor's inbox and their queue looked untouched), and let an
  // admin write straight through the read-only inbox preview — a disabled
  // button is not an authorization control.
  //
  // The scope lives in `findAnswerableMentorQuestion` so this route cannot
  // forget it: it is the same predicate the inbox and the dashboard stat counts
  // use, so read and write cannot disagree.
  //
  // Admins who legitimately need to answer a question outside any mentor's
  // inbox — the untargeted pool — go through /api/admin/mentor/[id], which is
  // gated on the admin allowlist and writes an audit record.
  const existing = await findAnswerableMentorQuestion(mentorUser, id);
  if (!existing) {
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
