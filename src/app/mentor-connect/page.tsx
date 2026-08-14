import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isMentorDemoUser } from "@/lib/mentor-demo";
import { getLandingContent, getPublishedMentorSegments } from "@/lib/content/accessors";
import { DEFAULT_LANDING_CONTENT } from "@/data/landing-content";
import { resolveMentorConnect } from "@/lib/content/merge";
import { MentorConnectClient } from "./mentor-connect-client";

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

  const mentorSegments = await getPublishedMentorSegments();
  const mentorCount = mentorSegments.reduce((n, s) => n + s.mentors.length, 0);
  const landingContent = await getLandingContent();
  const mentorConnectHero = resolveMentorConnect(DEFAULT_LANDING_CONTENT, landingContent.mentorConnect);

  return (
    <MentorConnectClient
      userTier={user.tier}
      mentorCredits={user.mentorCredits}
      mentorSegments={mentorSegments}
      mentorCount={mentorCount}
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
