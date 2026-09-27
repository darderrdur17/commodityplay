import { NextResponse } from "next/server";
import { assertSoleAdmin } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const denied = await assertSoleAdmin();
  if (denied) return denied;

  const entries = await prisma.jobWaitlistEntry.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, tier: true } },
    },
  });

  return NextResponse.json(entries);
}
