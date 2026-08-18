import { prisma } from "@/lib/prisma";
import {
  getCurrentMonthStart,
  getMentorCreditUsage,
  MENTOR_CREDITS_MONTHLY_LIMIT,
  type MentorCreditUsage,
} from "@/lib/mentor-credits";

/** Count mentor questions submitted in the current calendar month. */
export async function countMentorCreditsUsedThisMonth(userId: string): Promise<number> {
  return prisma.mentorQuestion.count({
    where: {
      userId,
      createdAt: { gte: getCurrentMonthStart() },
    },
  });
}

export async function getMentorCreditUsageForUser(
  userId: string,
  tier: string
): Promise<MentorCreditUsage | null> {
  if (tier !== "ELITE") return null;
  const used = await countMentorCreditsUsedThisMonth(userId);
  return getMentorCreditUsage(used);
}

export async function assertMentorCreditAvailable(userId: string): Promise<
  | { ok: true; usedThisMonth: number }
  | { ok: false; error: string; status: number }
> {
  const usedThisMonth = await countMentorCreditsUsedThisMonth(userId);
  if (usedThisMonth >= MENTOR_CREDITS_MONTHLY_LIMIT) {
    return {
      ok: false,
      error: "No mentor credits remaining this month",
      status: 402,
    };
  }
  return { ok: true, usedThisMonth };
}
