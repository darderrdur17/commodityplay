import { NextRequest, NextResponse } from "next/server";
import { hasEffectiveAccess } from "@/lib/billing";
import { getContentTierForSlug, getPlaybookChapters } from "@/lib/content/accessors";
import { getPublishedPayload } from "@/lib/content/repository";
import { resolvePlaybookPayload, isPlaybookChapterReleasingSoon, playbookChapterHeroColor } from "@/lib/content/playbook-payload";
export const dynamic = "force-dynamic";
export const revalidate = 0;
import { getMobileUser } from "@/lib/mobile-auth";
import { memberMayAccessCareerPlaybook } from "@/lib/dashboard-module-visibility";

export async function GET(req: NextRequest) {
  const user = await getMobileUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!memberMayAccessCareerPlaybook({ track: user.track, role: user.role })) {
    return NextResponse.json({ error: "Playbook is not available for this account" }, { status: 403 });
  }

  const requiredTier = await getContentTierForSlug("playbook");
  // Effective tier, not the stored one: a lapsed Elite subscription must not keep
  // receiving paid playbook sections.
  const hasPlaybookAccess = hasEffectiveAccess(user, requiredTier);
  const [chapters, payload] = await Promise.all([
    getPlaybookChapters(),
    getPublishedPayload<unknown>("playbook"),
  ]);
  const resolved = resolvePlaybookPayload(payload);

  const isAdminUser = user.role === "ADMIN";

  /**
   * Whether a chapter's body may be sent to this caller at all.
   *
   * This is the gate that actually matters: the response used to include every
   * chapter's sections and rely on a client-side `unlocked` flag, so a Starter
   * member could read the entire paid playbook straight out of the JSON.
   */
  const mayReadChapter = (chapterId: string): boolean => {
    const chapter = chapters.find((c) => c.id === chapterId);
    if (!chapter) return false;
    if (isPlaybookChapterReleasingSoon(chapter) && !isAdminUser) return false;
    return hasPlaybookAccess || Boolean(chapter.preview);
  };

  return NextResponse.json(
    {
      requiredTier,
      // Gated bytes are omitted entirely, not merely flagged.
      sections: Object.fromEntries(
        Object.entries(resolved.sections).filter(([id]) => mayReadChapter(id))
      ),
      chapters: chapters.map((c) => {
        const releasingSoon = isPlaybookChapterReleasingSoon(c);
        const tierUnlocked = hasPlaybookAccess || c.preview;
        return {
          id: c.id,
          letter: c.letter,
          title: c.title,
          subtitle: c.subtitle,
          color: playbookChapterHeroColor(c),
          sectionCount: releasingSoon && !isAdminUser ? 0 : c.sections.length,
          preview: c.preview,
          releasingSoon,
          unlocked: tierUnlocked && (!releasingSoon || isAdminUser),
        };
      }),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
