import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getContentTierForSlug, getJobOpeningsData } from "@/lib/content/accessors";
export const dynamic = "force-dynamic";
export const revalidate = 0;
import { JobOpeningsClient } from "./job-openings-client";

export const metadata = { title: "Job Openings" };

export default async function JobOpeningsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/job-openings");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tier: true },
  });
  if (!user) redirect("/login");

  const [jobs, requiredTier] = await Promise.all([
    getJobOpeningsData(),
    getContentTierForSlug("job-openings"),
  ]);
  return (
    <JobOpeningsClient
      userTier={user.tier}
      jobs={jobs.jobs}
      regions={jobs.regions}
      levels={jobs.levels}
      segments={jobs.segments}
      hero={jobs.hero}
      requiredTier={requiredTier as "PRO" | "ELITE"}
    />
  );
}
