import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applyCmsSchemaSql } from "@/lib/setup-database";

export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await applyCmsSchemaSql();

  const status = req.nextUrl.searchParams.get("status") ?? "all";

  const where =
    status === "pending"
      ? { isAnswered: false }
      : status === "answered"
        ? { isAnswered: true }
        : status === "queue"
          ? {
              isAnswered: true,
              memberShareOptIn: true,
              mentorShareOptIn: true,
              deskChannelStatus: "none",
            }
          : {};

  const questions = await prisma.mentorQuestion.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true, tier: true } },
    },
  });

  return NextResponse.json(questions);
}
