import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { PrepLibraryPageClient } from "./prep-library-page-client";

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

  const userTrack = user.track === "SALES" ? "SALES" : "CAREER";
  const isAdmin = session.user.role === "ADMIN";

  return (
    <div className="page-container py-8 sm:py-10">
      <Suspense fallback={<p className="text-sm text-muted-fg">Loading prep library…</p>}>
        <PrepLibraryPageClient
          userTier={user.tier}
          userTrack={userTrack}
          isAdmin={isAdmin}
        />
      </Suspense>
    </div>
  );
}
