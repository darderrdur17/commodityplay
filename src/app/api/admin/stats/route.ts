import { NextResponse } from "next/server";
import { assertSoleAdmin } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const denied = await assertSoleAdmin();
  if (denied) return denied;

  const [
    totalUsers,
    starterCount,
    proCount,
    eliteCount,
    adminCount,
    waitlistCount,
    pendingMentor,
    answeredMentor,
    subscribers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { tier: "STARTER", role: "USER" } }),
    prisma.user.count({ where: { tier: "PRO" } }),
    prisma.user.count({ where: { tier: "ELITE", role: "USER" } }),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.jobWaitlistEntry.count(),
    prisma.mentorQuestion.count({ where: { isAnswered: false } }),
    prisma.mentorQuestion.count({ where: { isAnswered: true } }),
    prisma.emailSubscriber.count({ where: { subscribed: true } }),
  ]);

  const personaBreakdown = await prisma.user.groupBy({
    by: ["persona"],
    _count: { persona: true },
    where: { persona: { not: null } },
  });

  return NextResponse.json({
    totalUsers,
    tiers: { starter: starterCount, pro: proCount, elite: eliteCount },
    adminCount,
    waitlistCount,
    mentor: { pending: pendingMentor, answered: answeredMentor },
    subscribers,
    personas: personaBreakdown.map((p) => ({
      persona: p.persona,
      count: p._count.persona,
    })),
  });
}
