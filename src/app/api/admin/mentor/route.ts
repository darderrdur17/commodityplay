import { NextRequest, NextResponse } from "next/server";
import { assertSoleAdmin } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";
import { applyCmsSchemaSql } from "@/lib/setup-database";

export async function GET(req: NextRequest) {
  const denied = await assertSoleAdmin();
  if (denied) return denied;

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
