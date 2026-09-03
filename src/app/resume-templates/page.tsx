import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  getContentTierForSlug,
  getResumeTemplateAssetUrls,
  getResumeTemplatesData,
} from "@/lib/content/accessors";
export const dynamic = "force-dynamic";
export const revalidate = 0;
import { ResumeTemplatesClient } from "./resume-templates-client";

export const metadata = { title: "Resume Templates" };

export default async function ResumeTemplatesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/resume-templates");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tier: true, persona: true },
  });

  if (!user) redirect("/login");

  const [data, requiredTier, assetUrls] = await Promise.all([
    getResumeTemplatesData(),
    getContentTierForSlug("resume-templates"),
    getResumeTemplateAssetUrls(),
  ]);
  return (
    <ResumeTemplatesClient
      userTier={user.tier}
      persona={user.persona}
      templates={data.templates}
      quizSteps={data.quizSteps}
      industryMap={data.industryMap}
      assetUrls={assetUrls}
      requiredTier={requiredTier as "PRO" | "ELITE"}
      vettingSection={data.vettingSection}
      pageHero={data.pageHero}
      quizSection={data.quizSection}
      industryMapSection={data.industryMapSection}
      templatesSection={data.templatesSection}
      positioningPrinciple={data.positioningPrinciple}
      templateCardDetails={data.templateCardDetails}
    />
  );
}
