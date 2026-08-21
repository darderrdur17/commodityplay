import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getSalesMarketNudgesContent, getContentTierForSlug } from "@/lib/content/accessors";
import { SalesMarketNudgesSection } from "@/components/dashboard/sales-market-nudges-section";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Sales Market Nudges",
};

export default async function SalesMarketNudgesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/dashboard/sales-market-nudges");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tier: true, track: true },
  });

  if (!user) redirect("/login");

  const isAdmin = session.user.role === "ADMIN";
  const isCareerTrack = user.track === "CAREER";

  if (isCareerTrack && !isAdmin) {
    redirect("/dashboard");
  }

  const [content, requiredTier] = await Promise.all([
    getSalesMarketNudgesContent(),
    getContentTierForSlug("sales-market-nudges"),
  ]);

  return (
    <div className="page-container py-8 sm:py-10">
      <Suspense fallback={<p className="text-sm text-muted-fg">Loading market nudges…</p>}>
        <SalesMarketNudgesSection
          content={content}
          userTier={user.tier}
          requiredTier={requiredTier as "PRO" | "ELITE"}
        />
      </Suspense>
    </div>
  );
}
