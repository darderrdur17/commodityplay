import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getContentTierForSlug, getInterviewQuestionsData } from "@/lib/content/accessors";
export const dynamic = "force-dynamic";
export const revalidate = 0;
import { InterviewQuestionsClient } from "./interview-questions-client";

export const metadata = { title: "Interview Questions" };

export default async function InterviewQuestionsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/interview-questions");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tier: true },
  });

  if (!user) redirect("/login");

  const [data, requiredTier] = await Promise.all([
    getInterviewQuestionsData(),
    getContentTierForSlug("interview-questions"),
  ]);
  return (
    <InterviewQuestionsClient
      userTier={user.tier}
      questions={data.questions}
      categories={data.categories}
      tabs={data.tabs}
      requiredTier={requiredTier as "PRO" | "ELITE"}
      hero={data.hero}
      lastRefreshed={data.lastRefreshed}
    />
  );
}
