import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireProSession } from "@/lib/prep-library-auth";
import { KEY_POINTS_MAX } from "@/data/prep-library";
import { CATEGORY_TO_PRISMA, serializeTalkingPoint } from "@/lib/prep-library-serialize";

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  category: z
    .enum(["Market mechanics", "Current event", "Risk & pricing", "Logistics", "Other"])
    .optional(),
  keyPoints: z.array(z.string().min(1).max(500)).min(1).max(KEY_POINTS_MAX).optional(),
  source: z.string().max(200).optional(),
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
      ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
      ...(parsed.data.category !== undefined
        ? { category: CATEGORY_TO_PRISMA[parsed.data.category] }
        : {}),
      ...(parsed.data.keyPoints !== undefined ? { keyPoints: parsed.data.keyPoints } : {}),
      ...(parsed.data.source !== undefined ? { source: parsed.data.source || null } : {}),
      ...(parsed.data.prepStatus !== undefined ? { prepStatus: parsed.data.prepStatus } : {}),
      ...(parsed.data.usedInNote !== undefined
        ? { usedInNote: parsed.data.usedInNote || null }
        : {}),
      ...(parsed.data.canUseFor !== undefined
        ? { canUseFor: parsed.data.canUseFor || null }
        : {}),
    },
  });

  return NextResponse.json(serializeTalkingPoint(authResult.user.id, row));
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
