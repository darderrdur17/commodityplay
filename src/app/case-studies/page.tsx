import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { resolveAccessTier } from "@/lib/entitlements";
import { getCaseStudiesPageData, getContentTierForSlug } from "@/lib/content/accessors";
export const dynamic = "force-dynamic";
export const revalidate = 0;
import { CaseStudiesClient } from "./case-studies-client";

export const metadata = { title: "Case Studies" };

export default async function CaseStudiesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/case-studies");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, tier: true },
  });

  if (!user) redirect("/login");

  const [pageData, requiredTier] = await Promise.all([
    getCaseStudiesPageData(),
    getContentTierForSlug("case-studies"),
  ]);
  return (
    <CaseStudiesClient
      userTier={resolveAccessTier(user)}
      studies={pageData.studies}
      hero={pageData.hero}
      requiredTier={requiredTier as "PRO" | "ELITE"}
    />
  );
}
