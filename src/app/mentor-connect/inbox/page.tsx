import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isMentorAccount, memberDisplayId } from "@/lib/mentor-demo";
import { MentorInboxClient } from "./mentor-inbox-client";
import { computeMentorRewardProgress } from "@/lib/mentor-reward-ladder";
import { normalizeMentorConnectPayload } from "@/lib/content/mentor-connect-schema";
import { tryReadPublishedPayload } from "@/lib/content/repository";

export const metadata = { title: "Mentor Inbox" };

export const dynamic = "force-dynamic";

/**
 * Safety cap on the mentor's own question list.
 *
 * The inbox client renders its month-archive sidebar and its per-month stat
 * cards from whatever this query returns, so the query must not grow with
 * platform-wide volume. It is already scoped to a single mentor profile, so a
 * few hundred rows sits far above realistic lifetime volume for one mentor —
 * this is a guard against the pathological case, not a real bound.
 *
 * `orderBy` puts unanswered first, so the cap can never drop a question that
 * still needs an answer; only the oldest *answered* history would be trimmed.
 */
const MENTOR_INBOX_MAX_ROWS = 500;

export default async function MentorInboxPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/mentor-connect/inbox");

  if (!isMentorAccount(session.user)) {
    redirect("/mentor-connect");
  }

  const mentorUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, mentorProfileId: true },
  });
  if (!mentorUser) redirect("/login");

  const answeredCount = await prisma.mentorQuestion.count({
    where: {
      isAnswered: true,
      answeredByEmail: { equals: mentorUser.email, mode: "insensitive" },
    },
  });
  const mentorConnectCms = await tryReadPublishedPayload("mentor-connect");
  const rewardRungs = normalizeMentorConnectPayload(mentorConnectCms ?? {}).rewardLadder.rungs;
  const rewardProgress = computeMentorRewardProgress(answeredCount, rewardRungs);

  // Per-mentor targeting: a mentor only sees questions addressed to their
  // anonymous profile. Questions with no recorded target (sent before this
  // change) are hidden from mentors — admins still see them.
  const mentorProfileId = mentorUser.mentorProfileId;

  const questions = mentorProfileId
    ? await prisma.mentorQuestion.findMany({
        where: { mentorProfileId },
        orderBy: [{ isAnswered: "asc" }, { createdAt: "desc" }],
        take: MENTOR_INBOX_MAX_ROWS,
        include: {
          user: {
            select: { id: true, track: true, persona: true },
          },
        },
      })
    : [];

  // The all-time total is counted in the database rather than read off the
  // (now capped) array, so the archive's "All time" figure stays true even if
  // the cap is ever reached. The per-month stat cards remain derived on the
  // client, because they are scoped to the selected month rather than to all
  // time.
  const allTimeTotal = mentorProfileId
    ? await prisma.mentorQuestion.count({ where: { mentorProfileId } })
    : 0;

  return (
    <MentorInboxClient
      mentorName={mentorUser.name ?? "Mentor"}
      rewardProgress={rewardProgress}
      allTimeTotal={allTimeTotal}
      initialRequests={questions.map((q) => ({
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
          track: q.user.track,
          persona: q.user.persona,
        },
      }))}
    />
  );
}
