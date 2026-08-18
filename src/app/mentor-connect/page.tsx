import { getContentStats } from "@/lib/content/content-stats";
import { MentorConnectClient } from "./mentor-connect-client";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isMentorDemoUser } from "@/lib/mentor-demo";
import { getMentorConnectHero, getPublishedMentorSegments } from "@/lib/content/accessors";

export const metadata = { title: "Mentor Connect" };

export const dynamic = "force-dynamic";

export default async function MentorConnectPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/mentor-connect");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      mentorQuestions: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!user) redirect("/login");

  if (isMentorDemoUser(user.email)) {
    redirect("/mentor-connect/inbox");
  }

  const [mentorSegments, mentorConnectHero, contentStats] = await Promise.all([
    getPublishedMentorSegments(),
    getMentorConnectHero(),
    getContentStats(),
  ]);

  return (
    <MentorConnectClient
      userTier={user.tier}
      mentorCredits={user.mentorCredits}
      mentorSegments={mentorSegments}
      mentorCount={contentStats.mentorCount}
      segmentCount={contentStats.segmentCount}
      mentorConnectHero={mentorConnectHero}
      questions={user.mentorQuestions.map((q) => ({
        id: q.id,
        segment: q.segment,
        question: q.question,
        answer: q.answer,
        isAnswered: q.isAnswered,
        createdAt: q.createdAt.toISOString(),
        answeredAt: q.answeredAt?.toISOString(),
      }))}
    />
  );
}
