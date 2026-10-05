import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isMentorAccount, memberDisplayId } from "@/lib/mentor-demo";
import { mentorInboxWhere } from "@/lib/mentor-inbox-scope";

/**
 * How much *answered* history this endpoint returns, in months.
 *
 * NOTE: no in-repo caller consumes this route today — the inbox page queries
 * Prisma directly, and the client only calls `inbox/[id]` to submit an answer.
 * It is bounded rather than deleted so that it stays safe if it is ever wired
 * up, and because an unbounded `findMany` should not sit on an API surface.
 */
const MENTOR_HISTORY_MONTHS = 12;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !isMentorAccount(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const mentorUser = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: { id: true, mentorProfileId: true },
  });
  if (!mentorUser) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Questions addressed to this mentor's anonymous profile, plus anything they
  // answered before per-mentor targeting existed — see `mentorInboxWhere`.
  const inboxWhere = mentorInboxWhere(mentorUser);

  const historySince = new Date();
  historySince.setMonth(historySince.getMonth() - MENTOR_HISTORY_MONTHS);

  const questions = await prisma.mentorQuestion.findMany({
    where: {
      // `AND`, not a spread: `mentorInboxWhere` already returns an `OR`, and
      // spreading would let the window's `OR` silently overwrite it.
      AND: [
        inboxWhere,
        // Everything still unanswered (any age) plus the recent settled
        // history. A pending question must never age out of the inbox.
        { OR: [{ createdAt: { gte: historySince } }, { isAnswered: false }] },
      ],
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
  });

  // Counted in the database rather than derived from the (now windowed) array,
  // so the stats stay true even when the history window trims the list.
  const [pending, answered, total] = await Promise.all([
    prisma.mentorQuestion.count({ where: { ...inboxWhere, isAnswered: false } }),
    prisma.mentorQuestion.count({ where: { ...inboxWhere, isAnswered: true } }),
    prisma.mentorQuestion.count({ where: inboxWhere }),
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
