import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { resolveAccessTier } from "@/lib/entitlements";
import { getCareerRoles, getContentTierForSlug } from "@/lib/content/accessors";
export const dynamic = "force-dynamic";
export const revalidate = 0;
import { CareerRoadmapClient } from "./career-roadmap-client";

export const metadata = { title: "Career Roadmap" };

export default async function CareerRoadmapPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/career-roadmap");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, tier: true, persona: true },
  });

  if (!user) redirect("/login");

  const [careerData, requiredTier] = await Promise.all([
    getCareerRoles(),
    getContentTierForSlug("career-roadmap"),
  ]);
  return (
    <CareerRoadmapClient
      userTier={resolveAccessTier(user)}
      persona={user.persona}
      roles={careerData.roles}
      functionMatrix={careerData.functionMatrix}
      timeline12Month={careerData.timeline12Month}
      compBenchmarks={careerData.compBenchmarks}
      pageHero={careerData.pageHero}
      functionMatrixSection={careerData.functionMatrixSection}
      timelineSection={careerData.timelineSection}
      bottomStrip={careerData.bottomStrip}
      careerNavigationGuide={careerData.careerNavigationGuide}
      requiredTier={requiredTier as "PRO" | "ELITE"}
    />
  );
}
