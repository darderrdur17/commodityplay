import { NextRequest, NextResponse } from "next/server";
import { isAdminEmail, recordAdminAudit, requireSoleAdmin } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getCurrentMonthStart } from "@/lib/mentor-credits";

export async function GET() {
  const admin = await requireSoleAdmin();
  if (!admin) {
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

/**
 * Writable member fields.
 *
 * `role` and `tier` are deliberately absent. `role` is not the source of admin
 * authority (the `ADMIN_EMAILS` allowlist is), and `tier` is purchased through
 * Stripe — accepting either here would let any operator promote an account or
 * grant themselves ELITE for free.
 */
const updateSchema = z.object({
  userId: z.string(),
  email: z.string().email().max(200).optional(),
  company: z.string().max(120).nullable().optional(),
  profession: z.string().max(120).nullable().optional(),
  track: z.enum(["CAREER", "SALES"]).optional(),
  persona: z
    .enum(["FRESH_GRAD", "CAREER_SWITCHER", "INSIDER", "ANALYST_TRADER", "VENDOR"])
    .nullable()
    .optional(),
  resumeCredits: z.number().min(0).optional(),
  onboardingDone: z.boolean().optional(),
});

/** Fields an operator may never write through this endpoint. */
const FORBIDDEN_WRITE_FIELDS = ["role", "tier"] as const;

export async function PATCH(req: NextRequest) {
  const admin = await requireSoleAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  // Zod strips unknown keys, so `parsed.data` can never carry these. Rejecting
  // them explicitly turns a silent ignore into a loud, auditable refusal.
  const attemptedForbidden = FORBIDDEN_WRITE_FIELDS.filter(
    (field) => body && typeof body === "object" && field in body
  );
  if (attemptedForbidden.length > 0) {
    return NextResponse.json(
      {
        error: `Cannot change ${attemptedForbidden.join(" and ")}. Role is managed by the ADMIN_EMAILS allowlist; tier is managed by Stripe.`,
      },
      { status: 400 }
    );
  }

  const { userId, email, company, profession, ...data } = parsed.data;

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = { ...data };

  if (email !== undefined) {
    const nextEmail = email.trim().toLowerCase();

    // The allowlist is keyed on email, so moving an address moves admin
    // authority. Both directions are refused: changing an administrator's
    // address (locks the operator out) and changing anyone else's address to an
    // allowlisted one (hands authority over).
    if (isAdminEmail(target.email) || isAdminEmail(nextEmail)) {
      await recordAdminAudit({
        actorEmail: admin.user.email,
        action: "user.email_change.refused",
        targetUserId: userId,
        metadata: { currentEmail: target.email, requestedEmail: nextEmail },
      });
      return NextResponse.json(
        { error: "The email address of an administrator cannot be changed." },
        { status: 403 }
      );
    }

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

  await recordAdminAudit({
    actorEmail: admin.user.email,
    action: "user.update",
    targetUserId: userId,
    metadata: { fields: Object.keys(updateData) },
  });

  return NextResponse.json(user);
}
