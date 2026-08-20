import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireProSession } from "@/lib/prep-library-auth";

const updateSchema = z.object({
  prepStatus: z.string().min(1).max(50).optional(),
  usedInNote: z.string().max(500).optional(),
  canUseFor: z.string().max(200).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireProSession();
  if ("error" in authResult) return authResult.error;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.talkingPoint.findUnique({ where: { id } });
  if (!existing || existing.userId !== authResult.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const row = await prisma.talkingPoint.update({
    where: { id },
    data: {
      ...(parsed.data.prepStatus !== undefined ? { prepStatus: parsed.data.prepStatus } : {}),
      ...(parsed.data.usedInNote !== undefined
        ? { usedInNote: parsed.data.usedInNote || null }
        : {}),
      ...(parsed.data.canUseFor !== undefined
        ? { canUseFor: parsed.data.canUseFor || null }
        : {}),
    },
  });

  return NextResponse.json({
    id: row.id,
    userId: row.userId,
    track: row.track,
    createdAt: row.createdAt,
    title: row.title,
    category: row.category,
    keyPoints: row.keyPoints,
    source: row.source ?? undefined,
    prepStatus: row.prepStatus,
    usedInNote: row.usedInNote ?? undefined,
    canUseFor: row.canUseFor ?? undefined,
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireProSession();
  if ("error" in authResult) return authResult.error;

  const { id } = await params;

  const existing = await prisma.talkingPoint.findUnique({ where: { id } });
  if (!existing || existing.userId !== authResult.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.accountBookmark.deleteMany({
      where: {
        userId: authResult.user.id,
        sourceType: "PREP_LIBRARY",
        sourceId: id,
      },
    }),
    prisma.talkingPoint.delete({ where: { id } }),
  ]);

  return NextResponse.json({ success: true });
}
