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

export default async function MentorInboxPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/mentor-connect/inbox");

  if (!isMentorAccount(session.user)) {
    redirect("/mentor-connect");
  }

  const mentorUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true },
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

  const questions = await prisma.mentorQuestion.findMany({
    where: { userId: { not: mentorUser.id } },
    orderBy: [{ isAnswered: "asc" }, { createdAt: "desc" }],
    include: {
      user: {
        select: { id: true, track: true, persona: true },
      },
    },
  });

  const pending = questions.filter((q) => !q.isAnswered).length;
  const answered = questions.filter((q) => q.isAnswered).length;

  return (
    <MentorInboxClient
      mentorName={mentorUser.name ?? "Mentor"}
      rewardProgress={rewardProgress}
      initialStats={{ pending, answered, total: questions.length }}
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
