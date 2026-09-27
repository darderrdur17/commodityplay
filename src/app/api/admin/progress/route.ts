import { NextResponse } from "next/server";
import { assertSoleAdmin } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const denied = await assertSoleAdmin();
  if (denied) return denied;

  const records = await prisma.chapterProgress.findMany({
    include: {
      user: { select: { name: true, email: true, tier: true, track: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Group by userId
  const map = new Map<
    string,
    {
      userId: string;
      userName: string | null;
      userEmail: string;
      tier: string;
      track: string;
      chapters: Record<string, { completed: boolean; progress: number; completedAt: string | null }>;
    }
  >();

  for (const r of records) {
    if (!map.has(r.userId)) {
      map.set(r.userId, {
        userId: r.userId,
        userName: r.user.name,
        userEmail: r.user.email,
        tier: r.user.tier,
        track: r.user.track,
        chapters: {},
      });
    }
    map.get(r.userId)!.chapters[r.chapterId] = {
      completed: r.completed,
      progress: r.progress,
      completedAt: r.completedAt ? r.completedAt.toISOString() : null,
    };
  }

  return NextResponse.json(Array.from(map.values()));
}
