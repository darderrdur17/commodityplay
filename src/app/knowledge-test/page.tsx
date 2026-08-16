import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getContentTierForSlug, getKnowledgeTestPageData } from "@/lib/content/accessors";
export const dynamic = "force-dynamic";
export const revalidate = 0;
import { KnowledgeTestClient } from "./knowledge-test-client";

export const metadata = { title: "Knowledge Test" };

export default async function KnowledgeTestPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/knowledge-test");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tier: true },
  });

  if (!user) redirect("/login");

  const [{ questions, activeSetLabel }, requiredTier] = await Promise.all([
    getKnowledgeTestPageData(),
    getContentTierForSlug("knowledge-test"),
  ]);
  return (
    <KnowledgeTestClient
      userTier={user.tier}
      questions={questions}
      activeSetLabel={activeSetLabel}
      requiredTier={requiredTier as "PRO" | "ELITE"}
    />
  );
}
