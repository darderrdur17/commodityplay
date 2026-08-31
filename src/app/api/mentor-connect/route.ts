import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { notifyMentorPoolNewQuestion } from "@/lib/mentor-questions";
import { assertMentorCreditAvailable } from "@/lib/mentor-credits-server";
import { apiSegmentAllowedForTrack } from "@/lib/mentor-segments";
import { parseMemberShareOptIn } from "@/lib/mentor-share-consent";

const schema = z.object({
  segment: z.enum([
    "physical-trading",
    "finance",
    "analytics",
    "operations",
    "sales",
    "sales-advisory",
  ]),
  question: z.string().min(20, "Question must be at least 20 characters").max(500),
  memberShareOptIn: z.boolean().optional(),
  isPublic: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tier: true, track: true },
  });

  if (!user || user.tier !== "ELITE") {
    return NextResponse.json({ error: "Elite membership required" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  if (!apiSegmentAllowedForTrack(parsed.data.segment, user.track)) {
    return NextResponse.json(
      { error: "This mentor segment is only available on the Sales track" },
      { status: 403 }
    );
  }

  const creditCheck = await assertMentorCreditAvailable(session.user.id);
  if (!creditCheck.ok) {
    return NextResponse.json({ error: creditCheck.error }, { status: creditCheck.status });
  }

  const question = await prisma.mentorQuestion.create({
    data: {
      userId: session.user.id,
      segment: parsed.data.segment,
      question: parsed.data.question,
      memberShareOptIn: parseMemberShareOptIn(parsed.data),
    },
  });

  notifyMentorPoolNewQuestion(question.id).catch((err) =>
    console.error("[mentor-connect] mentor pool notify failed", err)
  );

  return NextResponse.json({ id: question.id, success: true }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const questions = await prisma.mentorQuestion.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(questions);
}
