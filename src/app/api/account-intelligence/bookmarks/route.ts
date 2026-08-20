import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireEliteSession } from "@/lib/account-intelligence-auth";

const createSchema = z.object({
  accountId: z.string().uuid(),
  sourceType: z.enum(["PREP_LIBRARY", "MARKET_NUDGE"]),
  sourceId: z.string().min(1).max(200),
  sourceTitle: z.string().min(1).max(300),
});

export async function GET(req: NextRequest) {
  const authResult = await requireEliteSession();
  if ("error" in authResult) return authResult.error;

  const accountId = req.nextUrl.searchParams.get("accountId");
  if (!accountId) {
    return NextResponse.json({ error: "accountId is required" }, { status: 400 });
  }

  const account = await prisma.trackedAccount.findFirst({
    where: { id: accountId, userId: authResult.user.id },
  });
  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const bookmarks = await prisma.accountBookmark.findMany({
    where: { userId: authResult.user.id, accountId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    bookmarks.map((bookmark) => ({
      id: bookmark.id,
      accountId: bookmark.accountId,
      sourceType: bookmark.sourceType,
      sourceId: bookmark.sourceId,
      sourceTitle: bookmark.sourceTitle,
      createdAt: bookmark.createdAt.toISOString(),
    }))
  );
}

export async function POST(req: NextRequest) {
  const authResult = await requireEliteSession();
  if ("error" in authResult) return authResult.error;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const account = await prisma.trackedAccount.findFirst({
    where: { id: parsed.data.accountId, userId: authResult.user.id },
  });
  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const bookmark = await prisma.accountBookmark.upsert({
    where: {
      userId_accountId_sourceType_sourceId: {
        userId: authResult.user.id,
        accountId: parsed.data.accountId,
        sourceType: parsed.data.sourceType,
        sourceId: parsed.data.sourceId,
      },
    },
    update: {
      sourceTitle: parsed.data.sourceTitle.trim(),
    },
    create: {
      userId: authResult.user.id,
      accountId: parsed.data.accountId,
      sourceType: parsed.data.sourceType,
      sourceId: parsed.data.sourceId,
      sourceTitle: parsed.data.sourceTitle.trim(),
    },
  });

  return NextResponse.json(
    {
      id: bookmark.id,
      accountId: bookmark.accountId,
      sourceType: bookmark.sourceType,
      sourceId: bookmark.sourceId,
      sourceTitle: bookmark.sourceTitle,
      createdAt: bookmark.createdAt.toISOString(),
    },
    { status: 201 }
  );
}
