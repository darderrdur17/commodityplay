import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { Prisma, PrepCategory, Track } from "@prisma/client";

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

// ─── GET /api/prep-library?track=CAREER|SALES ────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const track = req.nextUrl.searchParams.get("track");
  const where: Prisma.TalkingPointWhereInput = {
    userId: session.user.id,
    ...(track === "CAREER" || track === "SALES" ? { track: track as Track } : {}),
  };

  const rows = await prisma.talkingPoint.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  const data = rows.map((r) => ({
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
  }));

  return NextResponse.json(data);
}

// ─── POST /api/prep-library ───────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { track, title, category, keyPoints, source, prepStatus, usedInNote, canUseFor } =
    parsed.data;

  const row = await prisma.talkingPoint.create({
    data: {
      userId: session.user.id,
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

  return NextResponse.json({
    id: row.id,
    userId: row.userId,
    track: row.track,
    createdAt: row.createdAt,
    title: row.title,
    category: CATEGORY_FROM_PRISMA[row.category],
    keyPoints: row.keyPoints,
    source: row.source ?? undefined,
    prepStatus: row.prepStatus,
    usedInNote: row.usedInNote ?? undefined,
    canUseFor: row.canUseFor ?? undefined,
  });
}
