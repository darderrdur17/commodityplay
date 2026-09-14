import { NextRequest, NextResponse } from "next/server";
import { getContentTierForSlug, getPlaybookChapters } from "@/lib/content/accessors";
import { getPublishedPayload } from "@/lib/content/repository";
import { resolvePlaybookPayload } from "@/lib/content/playbook-payload";
export const dynamic = "force-dynamic";
export const revalidate = 0;
import { getMobileUser, hasTierAccess } from "@/lib/mobile-auth";
import { memberMayAccessCareerPlaybook } from "@/lib/dashboard-module-visibility";

export async function GET(req: NextRequest) {
  const user = await getMobileUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!memberMayAccessCareerPlaybook({ track: user.track, role: user.role })) {
    return NextResponse.json({ error: "Playbook is not available for this account" }, { status: 403 });
  }

  const requiredTier = await getContentTierForSlug("playbook");
  const hasPlaybookAccess = hasTierAccess(user.tier, requiredTier);
  const [chapters, payload] = await Promise.all([
    getPlaybookChapters(),
    getPublishedPayload<unknown>("playbook"),
  ]);
  const resolved = resolvePlaybookPayload(payload);

  return NextResponse.json(
    {
      requiredTier,
      sections: resolved.sections,
      chapters: chapters.map((c) => ({
        id: c.id,
        letter: c.letter,
        title: c.title,
        subtitle: c.subtitle,
        color: c.color,
        sectionCount: c.sections.length,
        preview: c.preview,
        unlocked: hasPlaybookAccess || c.preview,
      })),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
