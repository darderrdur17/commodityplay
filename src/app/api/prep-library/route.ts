import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { PrepCategory, PrepStatus } from "@prisma/client";

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

const STATUS_TO_PRISMA: Record<string, PrepStatus> = {
  "Learning it": "LEARNING_IT",
  "Interview-ready": "INTERVIEW_READY",
  "Used it": "USED_IT",
};

const STATUS_FROM_PRISMA: Record<PrepStatus, string> = {
  LEARNING_IT: "Learning it",
  INTERVIEW_READY: "Interview-ready",
  USED_IT: "Used it",
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
  prepStatus: z.enum(["Learning it", "Interview-ready", "Used it"]).default("Learning it"),
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
  const where = {
    userId: session.user.id,
    ...(track === "CAREER" || track === "SALES" ? { track } : {}),
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
    prepStatus: STATUS_FROM_PRISMA[r.prepStatus],
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
      prepStatus: STATUS_TO_PRISMA[prepStatus],
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
    prepStatus: STATUS_FROM_PRISMA[row.prepStatus],
    usedInNote: row.usedInNote ?? undefined,
    canUseFor: row.canUseFor ?? undefined,
  });
}
