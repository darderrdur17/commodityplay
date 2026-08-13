import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    where: { isMentor: false },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      tier: true,
      track: true,
      persona: true,
      mentorCredits: true,
      resumeCredits: true,
      onboardingDone: true,
      stripeStatus: true,
      stripeCurrentPeriodEnd: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      jobWaitlist: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          mentorQuestions: true,
          progress: true,
        },
      },
    },
  });

  return NextResponse.json(users);
}

const updateSchema = z.object({
  userId: z.string(),
  tier: z.enum(["STARTER", "PRO", "ELITE"]).optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
  track: z.enum(["CAREER", "SALES"]).optional(),
  persona: z
    .enum(["FRESH_GRAD", "CAREER_SWITCHER", "INSIDER", "ANALYST_TRADER", "VENDOR"])
    .nullable()
    .optional(),
  mentorCredits: z.number().min(0).optional(),
  resumeCredits: z.number().min(0).optional(),
  onboardingDone: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { userId, ...data } = parsed.data;

  if (userId === session.user.id && data.role === "USER") {
    return NextResponse.json({ error: "Cannot demote yourself" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      email: true,
      tier: true,
      role: true,
      mentorCredits: true,
      resumeCredits: true,
      track: true,
      persona: true,
      onboardingDone: true,
    },
  });

  return NextResponse.json(user);
}
