import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireEliteSession } from "@/lib/account-intelligence-auth";
import { serializeTrackedAccount } from "@/lib/account-intelligence";

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  deskType: z.string().min(1).max(200).optional(),
  status: z.enum(["ACTIVE_DISCUSSION", "FIRST_CONTACT", "STALLED", "RESEARCHING"]).optional(),
  notes: z.string().max(2000).nullable().optional(),
  lastTouch: z.string().max(200).nullable().optional(),
  nextStep: z.string().max(200).nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireEliteSession();
  if ("error" in authResult) return authResult.error;

  const { id } = await params;
  const existing = await prisma.trackedAccount.findFirst({
    where: { id, userId: authResult.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const nextName = data.name !== undefined ? data.name.trim() : undefined;
  if (nextName && nextName !== existing.name) {
    const clash = await prisma.trackedAccount.findFirst({
      where: {
        userId: authResult.user.id,
        name: nextName,
        NOT: { id },
      },
    });
    if (clash) {
      return NextResponse.json(
        { error: "You already have an account with that name." },
        { status: 409 }
      );
    }
  }

  const account = await prisma.$transaction(async (tx) => {
    const updated = await tx.trackedAccount.update({
      where: { id },
      data: {
        ...(nextName !== undefined ? { name: nextName } : {}),
        ...(data.deskType !== undefined ? { deskType: data.deskType.trim() } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.notes !== undefined ? { notes: data.notes?.trim() || null } : {}),
        ...(data.lastTouch !== undefined ? { lastTouch: data.lastTouch?.trim() || null } : {}),
        ...(data.nextStep !== undefined ? { nextStep: data.nextStep?.trim() || null } : {}),
      },
      include: { bookmarks: { orderBy: { createdAt: "desc" } } },
    });

    if (nextName && nextName !== existing.name) {
      await tx.talkingPoint.updateMany({
        where: { userId: authResult.user.id, canUseFor: existing.name },
        data: { canUseFor: nextName },
      });
    }

    return updated;
  });

  return NextResponse.json(serializeTrackedAccount(account));
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireEliteSession();
  if ("error" in authResult) return authResult.error;

  const { id } = await params;
  const existing = await prisma.trackedAccount.findFirst({
    where: { id, userId: authResult.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  await prisma.trackedAccount.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
