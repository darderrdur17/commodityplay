import { NextRequest, NextResponse } from "next/server";
import { hasResolvedAccess } from "@/lib/entitlements";
import { getContentTierForSlug } from "@/lib/content/accessors";
import { getModuleMeta } from "@/lib/content/modules";
import { getMobileUser } from "@/lib/mobile-auth";

export async function requireMobileContentAccess(req: NextRequest, slug: string) {
  const meta = getModuleMeta(slug);
  if (!meta) {
    return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  }

  const user = await getMobileUser(req);
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const requiredTier = await getContentTierForSlug(slug);
  // Effective tier, not the stored one — a lapsed Elite subscription must not
  // keep streaming paid content to the mobile app. `getMobileUser` returns the
  // row's `email`, so the administrator override applies here too.
  if (!hasResolvedAccess(user, requiredTier)) {
    return {
      error: NextResponse.json(
        { error: `${requiredTier} membership required` },
        { status: 403 }
      ),
    };
  }

  return { user, requiredTier };
}
