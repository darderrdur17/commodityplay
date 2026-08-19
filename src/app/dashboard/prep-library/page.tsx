import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PrepLibraryBody } from "@/components/dashboard/prep-library-section";
import type { PrepLibraryTrack } from "@/data/prep-library";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Prep Library",
};

export default async function PrepLibraryPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/dashboard/prep-library");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tier: true, track: true },
  });

  if (!user) redirect("/login");

  const track: PrepLibraryTrack = user.track === "CAREER" ? "CAREER" : "SALES";
  const isAdmin = session.user.role === "ADMIN";

  return (
    <div className="page-container py-8 sm:py-10">
      <div className="mb-8">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900">
          Your Prep Library
        </h1>
        <p className="text-sm text-muted-fg mt-1">
          Build and manage your private talking points for interviews and client meetings.
        </p>
      </div>

      {(isAdmin || track === "CAREER") && (
        <PrepLibraryBody track="CAREER" userTier={user.tier} />
      )}
      {(isAdmin || track === "SALES") && (
        <PrepLibraryBody track="SALES" userTier={user.tier} />
      )}
    </div>
  );
}
