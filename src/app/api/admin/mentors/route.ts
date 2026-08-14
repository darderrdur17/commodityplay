import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getResolvedMentorSegments } from "@/lib/content/accessors";
import { getContentModulePayload, updateContentModule } from "@/lib/content/repository";
import type { MentorOverride, MentorOverridesPayload } from "@/data/mentors";

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

  const resolvedSegments = await getResolvedMentorSegments();

  // Surface pending applications first within each segment so admins spot them at a glance.
  const segments = resolvedSegments.map((seg) => ({
    id: seg.id,
    num: seg.num,
    title: seg.title,
    blurb: seg.blurb,
    questionCount: countBySegment[seg.id] ?? 0,
    mentors: [...seg.mentors]
      .sort((a, b) => {
        const aPending = (a.status ?? "active") === "pending" ? 0 : 1;
        const bPending = (b.status ?? "active") === "pending" ? 0 : 1;
        return aPending - bPending;
      })
      .map((m) => ({
        id: m.id,
        years: m.years,
        headline: m.headline,
        bio: m.bio,
        tags: m.tags,
        name: m.name ?? null,
        email: m.email ?? null,
        company: m.company ?? null,
        track: m.track ?? "both",
        status: m.status ?? "active",
        isNew: m.isNew ?? false,
        segmentId: seg.id,
      })),
  }));

  const pendingCount = segments.reduce(
    (n, seg) => n + seg.mentors.filter((m) => m.status === "pending").length,
    0
  );

  return NextResponse.json({ segments, pendingCount });
}

const patchSchema = z.object({
  id: z.string().min(1),
  headline: z.string().min(1).max(200).optional(),
  bio: z.string().min(1).max(2000).optional(),
  years: z.number().int().min(0).max(80).optional(),
  tags: z.array(z.string().min(1).max(40)).max(12).optional(),
  name: z.string().max(200).nullable().optional(),
  email: z.preprocess(
    (v) => (v === "" ? null : v),
    z.string().email().max(200).nullable().optional()
  ),
  company: z.string().max(200).nullable().optional(),
  track: z.enum(["career", "sales", "both"]).optional(),
  /** Approve (or re-open) a pending self-submitted application. */
  status: z.enum(["pending", "active"]).optional(),
  /** Reassign a new application (or move it out of "Unassigned") to a real segment. */
  segmentId: z.string().min(1).max(60).optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { id, ...patch } = parsed.data;

  const existingPayload = await getContentModulePayload<Partial<MentorOverridesPayload>>("mentors");
  const overrides = existingPayload?.overrides ?? [];

  const idx = overrides.findIndex((o) => o.id === id);
  const nextOverride: MentorOverride = {
    ...(idx >= 0 ? overrides[idx] : { id }),
    id,
    updatedAt: new Date().toISOString(),
  };

  if (patch.headline !== undefined) nextOverride.headline = patch.headline;
  if (patch.bio !== undefined) nextOverride.bio = patch.bio;
  if (patch.years !== undefined) nextOverride.years = patch.years;
  if (patch.tags !== undefined) nextOverride.tags = patch.tags;
  if (patch.name !== undefined) {
    nextOverride.name = patch.name === null ? undefined : patch.name;
  }
  if (patch.email !== undefined) {
    nextOverride.email = patch.email === null ? undefined : patch.email;
  }
  if (patch.company !== undefined) {
    nextOverride.company = patch.company === null ? undefined : patch.company;
  }
  if (patch.track !== undefined) nextOverride.track = patch.track;
  if (patch.status !== undefined) nextOverride.status = patch.status;
  if (patch.segmentId !== undefined) nextOverride.segmentId = patch.segmentId;

  const nextOverrides =
    idx >= 0
      ? overrides.map((o, i) => (i === idx ? nextOverride : o))
      : [...overrides, nextOverride];

  await updateContentModule(
    "mentors",
    { payload: { overrides: nextOverrides }, published: true },
    session.user.id
  );

  revalidatePath("/mentor-connect");

  return NextResponse.json({ ok: true, override: nextOverride });
}
