import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MENTOR_SEGMENTS } from "@/data/mentors";

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Count questions per segment from DB
  const questions = await prisma.mentorQuestion.groupBy({
    by: ["segment"],
    _count: { id: true },
  });
  const countBySegment: Record<string, number> = {};
  for (const q of questions) {
    countBySegment[q.segment] = q._count.id;
  }

  const segments = MENTOR_SEGMENTS.map((seg) => ({
    id: seg.id,
    num: seg.num,
    title: seg.title,
    blurb: seg.blurb,
    questionCount: countBySegment[seg.id] ?? 0,
    mentors: seg.mentors.map((m) => ({
      id: m.id,
      years: m.years,
      headline: m.headline,
      tags: m.tags,
    })),
  }));

  return NextResponse.json(segments);
}
