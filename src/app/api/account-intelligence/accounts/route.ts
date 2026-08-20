import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireEliteSession } from "@/lib/account-intelligence-auth";
import { serializeTrackedAccount } from "@/lib/account-intelligence";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  deskType: z.string().min(1).max(200),
  status: z.enum(["ACTIVE_DISCUSSION", "FIRST_CONTACT", "STALLED", "RESEARCHING"]),
  notes: z.string().max(2000).optional(),
  lastTouch: z.string().max(200).optional(),
  nextStep: z.string().max(200).optional(),
});

export async function GET() {
  const authResult = await requireEliteSession();
  if ("error" in authResult) return authResult.error;

  const accounts = await prisma.trackedAccount.findMany({
    where: { userId: authResult.user.id },
    include: { bookmarks: { orderBy: { createdAt: "desc" } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(accounts.map(serializeTrackedAccount));
}

export async function POST(req: NextRequest) {
  const authResult = await requireEliteSession();
  if ("error" in authResult) return authResult.error;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const account = await prisma.trackedAccount.create({
    data: {
      userId: authResult.user.id,
      name: parsed.data.name.trim(),
      deskType: parsed.data.deskType.trim(),
      status: parsed.data.status,
      notes: parsed.data.notes?.trim() || null,
      lastTouch: parsed.data.lastTouch?.trim() || null,
      nextStep: parsed.data.nextStep?.trim() || null,
    },
    include: { bookmarks: true },
  });

  return NextResponse.json(serializeTrackedAccount(account), { status: 201 });
}
