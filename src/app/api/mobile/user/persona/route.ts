import { NextRequest, NextResponse } from "next/server";
import { verify } from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  persona: z.enum(["FRESH_GRAD", "CAREER_SWITCHER", "INSIDER", "ANALYST_TRADER", "VENDOR"]).optional(),
  track: z.enum(["CAREER", "SALES"]).optional(),
  source: z.enum(["resume", "onboarding"]).optional(),
});

async function getMobileUserId(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const payload = verify(authHeader.slice(7), process.env.AUTH_SECRET!) as { userId: string };
    return payload.userId ?? null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const userId = await getMobileUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { persona: true, track: true, onboardingDone: true, resumePersonaDone: true },
  });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json(user);
}

export async function POST(req: NextRequest) {
  const userId = await getMobileUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { track: true },
  });
  if (!existing) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { persona, track, source } = parsed.data;
  const resolvedTrack = track ?? existing.track ?? "CAREER";

  if (source === "resume") {
    if (!persona) {
      return NextResponse.json({ error: "Persona required" }, { status: 400 });
    }
    await prisma.user.update({
      where: { id: userId },
      data: { persona, track: resolvedTrack, onboardingDone: true, resumePersonaDone: true },
    });
    return NextResponse.json({ success: true, persona, track: resolvedTrack, resumePersonaDone: true });
  }

  if (resolvedTrack === "SALES") {
    const salesPersona = persona ?? "VENDOR";
    await prisma.user.update({
      where: { id: userId },
      data: { persona: salesPersona, track: resolvedTrack, onboardingDone: true },
    });
    return NextResponse.json({ success: true, persona: salesPersona, track: resolvedTrack });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { track: resolvedTrack, onboardingDone: true },
  });

  return NextResponse.json({ success: true, track: resolvedTrack });
}
