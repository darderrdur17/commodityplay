import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hasResolvedAccess, resolveAccessTier } from "@/lib/entitlements";
import { getCaseStudyBySlug, getContentTierForSlug } from "@/lib/content/accessors";
export const dynamic = "force-dynamic";
export const revalidate = 0;
import { CaseStudyDetailClient } from "./case-study-detail-client";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getCaseStudyBySlug(slug);
  if (!data) return { title: "Case Study Not Found" };
  return { title: data.card.title };
}

export default async function CaseStudyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getCaseStudyBySlug(slug);
  if (!data) notFound();

  const session = await auth();
  if (!session?.user?.id) redirect(`/login?callbackUrl=/case-studies/${slug}`);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    // `email` feeds the administrator override; the billing columns feed
    // `hasResolvedAccess` below, so a lapsed Elite subscription cannot keep
    // unlocking case studies on the stored tier alone.
    select: {
      email: true,
      tier: true,
      stripeStatus: true,
      stripeCurrentPeriodEnd: true,
      stripePriceId: true,
    },
  });

  if (!user) redirect("/login");

  const requiredTier = await getContentTierForSlug("case-studies");
  const memberTier = resolveAccessTier(user);
  if (!hasResolvedAccess(user, requiredTier as "PRO" | "ELITE")) {
    redirect("/pricing?locked=case-studies");
  }

  return (
    <CaseStudyDetailClient
      card={data.card}
      sections={data.sections}
      displayNumber={data.displayNumber}
      previousStudy={data.previousStudy}
      userTier={memberTier}
    />
  );
}
