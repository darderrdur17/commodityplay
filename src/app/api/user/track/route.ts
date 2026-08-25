import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  track: z.enum(["CAREER", "SALES"]),
  completeOnboarding: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const { track, completeOnboarding } = parsed.data;

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      track,
      ...(completeOnboarding ? { onboardingDone: true } : {}),
    },
  });

  return NextResponse.json({ success: true, track });
}
