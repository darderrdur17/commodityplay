import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  chapterId: z.string().min(1).max(64).regex(/^[a-z0-9-]+$/i),
  progress: z.number().min(0).max(100),
  completed: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const { chapterId, progress, completed } = parsed.data;

  const record = await prisma.chapterProgress.upsert({
    where: { userId_chapterId: { userId: session.user.id, chapterId } },
    update: {
      progress,
      ...(completed !== undefined && { completed }),
      ...(completed && { completedAt: new Date() }),
    },
    create: {
      userId: session.user.id,
      chapterId,
      progress,
      completed: completed ?? progress === 100,
    },
  });

  return NextResponse.json(record);
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const progress = await prisma.chapterProgress.findMany({
    where: { userId: session.user.id },
  });

  return NextResponse.json(progress);
}
