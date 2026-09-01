import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getCurrentMonthStart } from "@/lib/mentor-credits";

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const monthStart = getCurrentMonthStart();

  const [users, usageRows] = await Promise.all([
    prisma.user.findMany({
      where: { isMentor: false },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        profession: true,
        role: true,
        tier: true,
        track: true,
        persona: true,
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
    }),
    prisma.mentorQuestion.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: monthStart } },
      _count: { id: true },
    }),
  ]);

  const usageByUserId = new Map(usageRows.map((row) => [row.userId, row._count.id]));

  return NextResponse.json(
    users.map((user) => ({
      ...user,
      mentorCreditsUsedThisMonth: usageByUserId.get(user.id) ?? 0,
    }))
  );
}

const updateSchema = z.object({
  userId: z.string(),
  email: z.string().email().max(200).optional(),
  company: z.string().max(120).nullable().optional(),
  profession: z.string().max(120).nullable().optional(),
  tier: z.enum(["STARTER", "PRO", "ELITE"]).optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
  track: z.enum(["CAREER", "SALES"]).optional(),
  persona: z
    .enum(["FRESH_GRAD", "CAREER_SWITCHER", "INSIDER", "ANALYST_TRADER", "VENDOR"])
    .nullable()
    .optional(),
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

  const { userId, email, company, profession, ...data } = parsed.data;

  if (userId === session.user.id && data.role === "USER") {
    return NextResponse.json({ error: "Cannot demote yourself" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = { ...data };

  if (email !== undefined) {
    const nextEmail = email.trim().toLowerCase();
    const taken = await prisma.user.findUnique({
      where: { email: nextEmail },
      select: { id: true },
    });
    if (taken && taken.id !== userId) {
      return NextResponse.json({ error: "That email is already in use." }, { status: 409 });
    }
    updateData.email = nextEmail;
  }

  if (company !== undefined) {
    updateData.company = company?.trim() ? company.trim() : null;
  }

  if (profession !== undefined) {
    updateData.profession = profession?.trim() ? profession.trim() : null;
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      email: true,
      company: true,
      profession: true,
      tier: true,
      role: true,
      resumeCredits: true,
      track: true,
      persona: true,
      onboardingDone: true,
    },
  });

  return NextResponse.json(user);
}
