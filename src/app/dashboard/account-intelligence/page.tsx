import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AccountIntelligenceSection } from "@/components/dashboard/account-intelligence-section";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Account Intelligence",
};

export default async function AccountIntelligencePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/dashboard/account-intelligence");
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

  return (
    <div className="page-container py-8 sm:py-10">
      <AccountIntelligenceSection userTier={user.tier} />
    </div>
  );
}
