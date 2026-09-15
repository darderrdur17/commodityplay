import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { Prisma, Track } from "@prisma/client";
import { canAccessPrepTrack, requireProSession } from "@/lib/prep-library-auth";
import { ensureStarterTopics } from "@/lib/prep-library-starters";
import { KEY_POINTS_MAX, type PrepLibraryTrack } from "@/data/prep-library";
import { CATEGORY_TO_PRISMA, serializeTalkingPoint } from "@/lib/prep-library-serialize";

const createSchema = z.object({
  track: z.enum(["CAREER", "SALES"]),
  title: z.string().min(1).max(200),
  category: z.enum([
    "Market mechanics",
    "Current event",
    "Risk & pricing",
    "Logistics",
    "Other",
  ]),
  keyPoints: z.array(z.string().min(1).max(500)).min(1).max(KEY_POINTS_MAX),
  source: z.string().max(200).optional(),
  prepStatus: z.string().min(1).max(50).default("Learning it"),
  usedInNote: z.string().max(500).optional(),
  canUseFor: z.string().max(200).optional(),
});

// ─── GET /api/prep-library?track=CAREER|SALES ────────────────────────────────

export async function GET(req: NextRequest) {
  const authResult = await requireProSession();
  if ("error" in authResult) return authResult.error;

  const trackParam = req.nextUrl.searchParams.get("track");
  if (trackParam === "CAREER" || trackParam === "SALES") {
    if (!canAccessPrepTrack(authResult.user, trackParam)) {
      return NextResponse.json({ error: "Track access denied" }, { status: 403 });
    }
    await ensureStarterTopics(authResult.user.id, trackParam as PrepLibraryTrack);
  }

  const where: Prisma.TalkingPointWhereInput = {
    userId: authResult.user.id,
    ...(trackParam === "CAREER" || trackParam === "SALES"
      ? { track: trackParam as Track }
      : {}),
  };

  const rows = await prisma.talkingPoint.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return NextResponse.json(
    rows.map((row) => serializeTalkingPoint(authResult.user.id, row))
  );
}

// ─── POST /api/prep-library ───────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const authResult = await requireProSession();
  if ("error" in authResult) return authResult.error;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { track, title, category, keyPoints, source, prepStatus, usedInNote, canUseFor } =
    parsed.data;

  if (!canAccessPrepTrack(authResult.user, track)) {
    return NextResponse.json({ error: "Track access denied" }, { status: 403 });
  }

  const row = await prisma.talkingPoint.create({
    data: {
      userId: authResult.user.id,
      track,
      title,
      category: CATEGORY_TO_PRISMA[category],
      keyPoints,
      source: source ?? null,
      prepStatus,
      usedInNote: usedInNote ?? null,
      canUseFor: canUseFor ?? null,
    },
  });

  return NextResponse.json(serializeTalkingPoint(authResult.user.id, row));
}
