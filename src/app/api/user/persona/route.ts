import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  persona: z.enum(["FRESH_GRAD", "CAREER_SWITCHER", "INSIDER", "ANALYST_TRADER", "VENDOR"]).optional(),
  track: z.enum(["CAREER", "SALES"]),
  source: z.enum(["resume", "onboarding"]).optional(),
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

  const { persona, track, source } = parsed.data;

  if (source === "resume") {
    if (!persona) {
      return NextResponse.json({ error: "Persona required" }, { status: 400 });
    }
    await prisma.user.update({
      where: { id: session.user.id },
      data: { persona, track, onboardingDone: true, resumePersonaDone: true },
    });
    return NextResponse.json({ success: true, persona, track, resumePersonaDone: true });
  }

  if (track === "SALES") {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { persona: persona ?? "VENDOR", track, onboardingDone: true },
    });
    return NextResponse.json({ success: true, persona: persona ?? "VENDOR", track });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { track, onboardingDone: true },
  });

  return NextResponse.json({ success: true, track });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { persona: true, track: true, onboardingDone: true, resumePersonaDone: true },
  });

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(user);
}
