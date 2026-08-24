import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAccountIntelligenceContent } from "@/lib/content/accessors";
import { AccountIntelligenceSection } from "@/components/dashboard/account-intelligence-section";
import { Pencil } from "lucide-react";

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

  const content = await getAccountIntelligenceContent();

  return (
    <div className="page-container py-8 sm:py-10">
      {isAdmin && (
        <Link
          href="/admin?tab=content&slug=account-intelligence"
          className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-gray-900 text-white text-sm font-semibold px-4 py-2.5 shadow-xl hover:bg-gray-800 transition-colors"
        >
          <Pencil className="w-4 h-4" /> Edit page copy
        </Link>
      )}
      <AccountIntelligenceSection userTier={user.tier} content={content} />
    </div>
  );
}
