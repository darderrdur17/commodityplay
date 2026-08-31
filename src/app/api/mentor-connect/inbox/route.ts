import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isMentorDemoUser, memberDisplayId } from "@/lib/mentor-demo";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !isMentorDemoUser(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const mentorUser = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: { id: true },
  });
  if (!mentorUser) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const questions = await prisma.mentorQuestion.findMany({
    where: { userId: { not: mentorUser.id } },
    orderBy: [{ isAnswered: "asc" }, { createdAt: "desc" }],
    include: {
      user: {
        select: {
          id: true,
          tier: true,
          track: true,
          persona: true,
        },
      },
    },
  });

  const pending = questions.filter((q) => !q.isAnswered).length;
  const answered = questions.filter((q) => q.isAnswered).length;

  return NextResponse.json({
    stats: { pending, answered, total: questions.length },
    requests: questions.map((q) => ({
      id: q.id,
      segment: q.segment,
      question: q.question,
      answer: q.answer,
      isAnswered: q.isAnswered,
      memberShareOptIn: q.memberShareOptIn,
      mentorShareOptIn: q.mentorShareOptIn,
      createdAt: q.createdAt.toISOString(),
      answeredAt: q.answeredAt?.toISOString() ?? null,
      member: {
        id: memberDisplayId(q.user.id),
        tier: q.user.tier,
        track: q.user.track,
        persona: q.user.persona,
      },
    })),
  });
}
