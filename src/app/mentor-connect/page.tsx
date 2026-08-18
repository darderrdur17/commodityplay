import { getMentorCreditUsageForUser } from "@/lib/mentor-credits-server";
import { MentorConnectClient } from "./mentor-connect-client";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isMentorDemoUser } from "@/lib/mentor-demo";
import { Suspense } from "react";
import {
  getMentorConnectHero,
  getMentorConnectHowItWorks,
  getPublishedMentorSegments,
} from "@/lib/content/accessors";

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

  const mentorCreditUsage = await getMentorCreditUsageForUser(user.id, user.tier);

  const [mentorSegments, mentorConnectHero, mentorConnectHowItWorks] = await Promise.all([
    getPublishedMentorSegments(),
    getMentorConnectHero(),
    getMentorConnectHowItWorks(),
  ]);

  return (
    <Suspense fallback={<div className="page-container py-20 text-center text-muted-fg">Loading…</div>}>
      <MentorConnectClient
        userTier={user.tier}
        userTrack={user.track}
        mentorCreditUsage={mentorCreditUsage}
        mentorSegments={mentorSegments}
        mentorConnectHero={mentorConnectHero}
        mentorConnectHowItWorks={mentorConnectHowItWorks}
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
    </Suspense>
  );
}
