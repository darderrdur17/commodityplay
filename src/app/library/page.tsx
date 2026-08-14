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
  description: "Elite bonus guides and reference materials.",
};

export default async function LibraryPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/library");

  const { files } = await getLibraryContent();
  const hasLibraryAccess = hasAccess(session.user.tier ?? "STARTER", "ELITE");

  return <LibraryClient files={files} hasAccess={hasLibraryAccess} />;
}
