import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getLibraryContent } from "@/lib/content/accessors";
import { hasAccess } from "@/lib/utils";
import { LibraryClient } from "./library-client";
import { BRAND_NAME } from "@/lib/brand";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: `Resource Library — ${BRAND_NAME}`,
  description: "Free and Elite library resources — guides, reference PDFs, and desk materials.",
};

export default async function LibraryPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/library");

  const { files, hero } = await getLibraryContent();
  const hasEliteAccess = hasAccess(session.user.tier ?? "STARTER", "ELITE");
  const memberTrack = session.user.track ?? "BOTH";

  return <LibraryClient files={files} hero={hero} hasEliteAccess={hasEliteAccess} memberTrack={memberTrack} />;
}
