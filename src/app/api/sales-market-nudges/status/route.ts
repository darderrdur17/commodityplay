import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireProSession } from "@/lib/prep-library-auth";
import {
  isMarketNudgeKind,
  isMemberNudgeStatus,
  statusKey,
} from "@/lib/sales-nudge-member-status";

const putSchema = z.object({
  sourceId: z.string().min(1).max(80),
  kind: z.enum(["WEEKLY_NUDGE", "INTELLIGENCE_BRIEF"]),
  status: z.enum(["ACTIVE", "EXPIRED", "ARCHIVED"]),
});

export async function GET() {
  const gate = await requireProSession();
  if ("error" in gate) return gate.error;

  const rows = await prisma.userMarketNudgeStatus.findMany({
    where: { userId: gate.user.id },
    select: { sourceId: true, kind: true, status: true },
  });

  const statuses: Record<string, string> = {};
  for (const row of rows) {
    if (!isMarketNudgeKind(row.kind) || !isMemberNudgeStatus(row.status)) continue;
    statuses[statusKey(row.kind, row.sourceId)] = row.status;
  }

  return NextResponse.json({ statuses });
}

export async function PUT(req: NextRequest) {
  const gate = await requireProSession();
  if ("error" in gate) return gate.error;

  const parsed = putSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status payload" }, { status: 400 });
  }

  const row = await prisma.userMarketNudgeStatus.upsert({
    where: {
      userId_kind_sourceId: {
        userId: gate.user.id,
        kind: parsed.data.kind,
        sourceId: parsed.data.sourceId,
      },
    },
    create: {
      userId: gate.user.id,
      kind: parsed.data.kind,
      sourceId: parsed.data.sourceId,
      status: parsed.data.status,
    },
    update: { status: parsed.data.status },
    select: { sourceId: true, kind: true, status: true },
  });

  return NextResponse.json({
    key: statusKey(row.kind as "WEEKLY_NUDGE" | "INTELLIGENCE_BRIEF", row.sourceId),
    status: row.status,
  });
}
