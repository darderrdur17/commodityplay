import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PrepLibraryBody } from "@/components/dashboard/prep-library-section";
import { PREP_LIBRARY_SEGMENTS, type PrepLibraryTrack } from "@/data/prep-library";

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
  const showCareer = track === "CAREER";
  const showSales = track === "SALES";

  return (
    <div className="page-container py-8 sm:py-10">
      {showCareer && (
        <div className="mb-8">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900">
            {PREP_LIBRARY_SEGMENTS.CAREER.title}
          </h1>
          <p className="text-sm text-muted-fg mt-1">
            {PREP_LIBRARY_SEGMENTS.CAREER.cardDescription}
          </p>
        </div>
      )}
      {showCareer && <PrepLibraryBody track="CAREER" userTier={user.tier} />}
      {showSales && <PrepLibraryBody track="SALES" userTier={user.tier} />}
    </div>
  );
}
