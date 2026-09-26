import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getLibraryContent } from "@/lib/content/accessors";
import { hasAccess } from "@/lib/utils";
import { getEntitlements } from "@/lib/entitlements";
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
  if (!session?.user?.id) redirect("/login?callbackUrl=/library");

  // AUTHORISATION: read the entitlement from the database. `session.user.tier` lives in
  // the Auth.js JWT and can be up to 30 days stale after a downgrade, refund or a
  // lapsed card, so it must never decide access.
  const entitlements = await getEntitlements(session.user.id);
  if (!entitlements.exists) redirect("/login?callbackUrl=/library");

  const hasEliteAccess = hasAccess(entitlements.tier, "ELITE");

  const { files, hero, freeSection, eliteSection } = await getLibraryContent();

  // PAYWALL: strip Elite file descriptors server-side. A non-entitled member must not
  // receive Elite rows in the RSC payload at all (no labels, file names or asset ids —
  // not blurred, not hidden, absent).
  const visibleFiles = hasEliteAccess
    ? files
    : files.filter((file) => file.accessTier !== "elite");

  // COSMETIC ONLY: the track badge filter. Track is not a paid entitlement, so the
  // (possibly stale) JWT value is fine here.
  const memberTrack = session.user.track ?? "BOTH";

  return (
    <LibraryClient
      files={visibleFiles}
      hero={hero}
      freeSection={freeSection}
      // Elite section copy is marketing/upsell text, not gated content, so it stays.
      eliteSection={hasEliteAccess ? eliteSection : undefined}
      hasEliteAccess={hasEliteAccess}
      memberTrack={memberTrack}
    />
  );
}
