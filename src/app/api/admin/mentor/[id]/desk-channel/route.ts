import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { applyCmsSchemaSql } from "@/lib/setup-database";
import {
  defaultDeskCategoryForSegment,
  publishMentorQuestionToDeskChannel,
  rejectMentorQuestionFromDeskChannel,
} from "@/lib/desk-channel-publish";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  action: z.enum(["publish", "reject"]),
  category: z.enum(["trading", "ops", "risk", "tools", "career"]).optional(),
  question: z.string().min(10).max(2000).optional(),
  answer: z.string().min(10).max(5000).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await applyCmsSchemaSql();

  const { id } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const question = await prisma.mentorQuestion.findUnique({ where: { id } });
  if (!question) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    if (parsed.data.action === "reject") {
      await rejectMentorQuestionFromDeskChannel(id);
      return NextResponse.json({ ok: true, deskChannelStatus: "rejected" });
    }

    const category = parsed.data.category ?? defaultDeskCategoryForSegment(question.segment);
    const result = await publishMentorQuestionToDeskChannel({
      questionId: id,
      category,
      adminUserId: session.user.id,
      questionText: parsed.data.question,
      answerText: parsed.data.answer,
    });
    return NextResponse.json({
      ok: true,
      deskChannelStatus: "published",
      deskChannelQaId: result.deskChannelQaId,
    });
  } catch (err) {
    const code = err instanceof Error ? err.message : "";
    if (code === "NOT_FOUND") return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (code === "NOT_ANSWERED") {
      return NextResponse.json({ error: "Question is not answered yet" }, { status: 409 });
    }
    if (code === "NO_DUAL_CONSENT") {
      return NextResponse.json({ error: "Both member and mentor must opt in" }, { status: 409 });
    }
    if (code === "INVALID_COPY") {
      return NextResponse.json({ error: "Question and answer must each be at least 10 characters" }, { status: 400 });
    }
    if (code === "ALREADY_PUBLISHED") {
      return NextResponse.json({ error: "Already published to Desk Channel" }, { status: 409 });
    }
    console.error("[admin/mentor/desk-channel]", err);
    return NextResponse.json({ error: "Could not update Desk Channel review" }, { status: 500 });
  }
}
