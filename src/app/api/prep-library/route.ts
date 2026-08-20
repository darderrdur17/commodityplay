import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { Prisma, PrepCategory, Track } from "@prisma/client";
import { canAccessPrepTrack, requireProSession } from "@/lib/prep-library-auth";
import {
  ensureStarterTopics,
  withStarterFlag,
} from "@/lib/prep-library-starters";
import type { PrepLibraryTrack } from "@/data/prep-library";

// ─── Category / Status maps ───────────────────────────────────────────────────

const CATEGORY_TO_PRISMA: Record<string, PrepCategory> = {
  "Market mechanics": "MARKET_MECHANICS",
  "Current event": "CURRENT_EVENT",
  "Risk & pricing": "RISK_PRICING",
  Logistics: "LOGISTICS",
  Other: "OTHER",
};

const CATEGORY_FROM_PRISMA: Record<PrepCategory, string> = {
  MARKET_MECHANICS: "Market mechanics",
  CURRENT_EVENT: "Current event",
  RISK_PRICING: "Risk & pricing",
  LOGISTICS: "Logistics",
  OTHER: "Other",
};

// ─── Schema ───────────────────────────────────────────────────────────────────

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
  keyPoints: z.array(z.string()).min(1).max(4),
  source: z.string().max(200).optional(),
  prepStatus: z.string().min(1).max(50).default("Learning it"),
  usedInNote: z.string().max(500).optional(),
  canUseFor: z.string().max(200).optional(),
});

function serializeRow(
  userId: string,
  r: {
    id: string;
    userId: string;
    track: Track;
    createdAt: Date;
    title: string;
    category: PrepCategory;
    keyPoints: string[];
    source: string | null;
    prepStatus: string;
    usedInNote: string | null;
    canUseFor: string | null;
  }
) {
  return withStarterFlag(userId, {
    id: r.id,
    userId: r.userId,
    track: r.track,
    createdAt: r.createdAt,
    title: r.title,
    category: CATEGORY_FROM_PRISMA[r.category],
    keyPoints: r.keyPoints,
    source: r.source ?? undefined,
    prepStatus: r.prepStatus,
    usedInNote: r.usedInNote ?? undefined,
    canUseFor: r.canUseFor ?? undefined,
  });
}

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
    rows.map((row) => serializeRow(authResult.user.id, row))
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

  return NextResponse.json(serializeRow(authResult.user.id, row));
}
