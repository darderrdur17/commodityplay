import { getMentorCreditUsageForUser } from "@/lib/mentor-credits-server";
import { MentorConnectClient } from "./mentor-connect-client";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { resolveAccessTier } from "@/lib/entitlements";
import { isMentorAccount } from "@/lib/mentor-demo";
import { Suspense } from "react";
import { unstable_noStore as noStore } from "next/cache";
import {
  getMentorConnectHero,
  getMentorConnectHowItWorks,
  getPublishedMentorSegments,
} from "@/lib/content/accessors";

export const metadata = { title: "Mentor Connect" };

export const dynamic = "force-dynamic";

export default async function MentorConnectPage() {
  noStore();
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/mentor-connect");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      mentorQuestions: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!user) redirect("/login");

  if (isMentorAccount(user)) {
    redirect("/mentor-connect/inbox");
  }

  // Pass the whole row so the helper can authorise on the effective tier; the
  // `include` above already carries the billing columns it needs.
  const mentorCreditUsage = await getMentorCreditUsageForUser(user);

  const [mentorSegments, mentorConnectHero, mentorConnectHowItWorks] = await Promise.all([
    getPublishedMentorSegments(),
    getMentorConnectHero(),
    getMentorConnectHowItWorks(),
  ]);

  return (
    <Suspense fallback={<div className="page-container py-20 text-center text-muted-fg">Loading…</div>}>
      <MentorConnectClient
        // Authoritative access tier: an allowlisted admin resolves to ELITE
        // (superadmin), so the Elite TierGate below opens for her.
        userTier={resolveAccessTier(user)}
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
