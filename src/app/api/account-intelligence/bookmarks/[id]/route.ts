import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEliteSession } from "@/lib/account-intelligence-auth";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireEliteSession();
  if ("error" in authResult) return authResult.error;

  const { id } = await params;
  const existing = await prisma.accountBookmark.findFirst({
    where: { id, userId: authResult.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Bookmark not found" }, { status: 404 });
  }

  await prisma.accountBookmark.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
