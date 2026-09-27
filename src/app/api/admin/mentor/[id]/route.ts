import { NextRequest, NextResponse } from "next/server";
import { recordAdminAudit, requireSoleAdmin } from "@/lib/admin-access";
import { z } from "zod";
import { answerMentorQuestion } from "@/lib/mentor-questions";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  answer: z.string().min(10).max(2000),
  mentorShareOptIn: z.boolean().optional().default(false),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireSoleAdmin();
  if (!admin?.user?.email) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  try {
    const result = await answerMentorQuestion({
      questionId: id,
      answer: parsed.data.answer,
      mentorShareOptIn: parsed.data.mentorShareOptIn,
      answeredByEmail: admin.user.email,
    });

    const question = await prisma.mentorQuestion.findUnique({
      where: { id },
      include: { user: { select: { name: true, email: true, tier: true } } },
    });

    await recordAdminAudit({
      actorEmail: admin.user.email,
      action: "mentor.answer",
      targetUserId: question?.userId,
      metadata: { questionId: id, mentorShareOptIn: parsed.data.mentorShareOptIn },
    });

    return NextResponse.json({ ...question, menteeEmail: result.email });
  } catch (err) {
    const code = err instanceof Error ? err.message : "";
    if (code === "NOT_FOUND") return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (code === "ALREADY_ANSWERED") return NextResponse.json({ error: "Already answered" }, { status: 409 });
    console.error("[admin/mentor/answer]", err);
    return NextResponse.json({ error: "Failed to save answer" }, { status: 500 });
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireSoleAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const question = await prisma.mentorQuestion.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true, tier: true } },
    },
  });

  if (!question) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(question);
}
