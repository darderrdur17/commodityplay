import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isMentorAccount, memberDisplayId } from "@/lib/mentor-demo";

/**
 * How much *answered* history this endpoint returns, in months.
 *
 * NOTE: as of this change no in-repo caller consumes this route (the inbox page
 * queries Prisma directly, and the client only calls `inbox/[id]` to answer).
 * It is bounded here rather than deleted so that it is safe if it is revived,
 * and because an unbounded `findMany` should not sit on an API surface.
 */
const MENTOR_HISTORY_MONTHS = 12;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !isMentorAccount(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const mentorUser = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: { id: true },
  });
  if (!mentorUser) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Stats are counted in the database rather than derived from the fetched
  // array, so they stay correct now that the request list is bounded.
  const answeredSince = new Date();
  answeredSince.setMonth(answeredSince.getMonth() - MENTOR_HISTORY_MONTHS);

  const scope = { userId: { not: mentorUser.id } };

  const [questions, pending, answered, total] = await Promise.all([
    prisma.mentorQuestion.findMany({
      where: {
        ...scope,
        // Everything pending (any age) plus the recent answered history.
        OR: [{ createdAt: { gte: answeredSince } }, { isAnswered: false }],
      },
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
    }),
    prisma.mentorQuestion.count({ where: { ...scope, isAnswered: false } }),
    prisma.mentorQuestion.count({ where: { ...scope, isAnswered: true } }),
    prisma.mentorQuestion.count({ where: scope }),
  ]);

  return NextResponse.json({
    stats: { pending, answered, total },
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
