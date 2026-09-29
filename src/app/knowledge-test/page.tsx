import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { resolveAccessTier } from "@/lib/entitlements";
import { getContentTierForSlug, getKnowledgeTestPageData } from "@/lib/content/accessors";
import { latestKnowledgeTestResultsBySet, type KnowledgeTestStoredResult } from "@/lib/content/knowledge-test-results";
import { DEFAULT_KNOWLEDGE_TEST_SET_ID } from "@/lib/content/knowledge-test-payload";
export const dynamic = "force-dynamic";
export const revalidate = 0;
import { KnowledgeTestClient } from "./knowledge-test-client";

export const metadata = { title: "Knowledge Test" };

export default async function KnowledgeTestPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/knowledge-test");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, tier: true },
  });

  if (!user) redirect("/login");

  const [{ questions, activeSetLabel, liveSets, upcomingSets, hero }, requiredTier] = await Promise.all([
    getKnowledgeTestPageData(),
    getContentTierForSlug("knowledge-test"),
  ]);

  let initialResults: Record<string, KnowledgeTestStoredResult> = {};
  try {
    const rows = await prisma.knowledgeTestResult.findMany({
      where: { userId: session.user.id },
      orderBy: { completedAt: "asc" },
    });
    initialResults = latestKnowledgeTestResultsBySet(rows, DEFAULT_KNOWLEDGE_TEST_SET_ID);
  } catch {
    initialResults = {};
  }

  return (
    <KnowledgeTestClient
      userTier={resolveAccessTier(user)}
      questions={questions}
      activeSetLabel={activeSetLabel}
      liveSets={liveSets}
      upcomingSets={upcomingSets}
      initialResults={initialResults}
      requiredTier={requiredTier as "PRO" | "ELITE"}
      hero={hero}
    />
  );
}
