import { effectiveTier, type EntitlementFields } from "@/lib/billing";
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

/**
 * Mentor credits are an Elite benefit, so they follow the EFFECTIVE tier.
 *
 * Takes the user row rather than a bare tier string so a caller cannot pass the
 * stored `tier` value and hand a lapsed subscriber another month of credits.
 * The caller's Prisma `select` must therefore include the billing columns.
 */
export async function getMentorCreditUsageForUser(
  user: { id: string } & EntitlementFields
): Promise<MentorCreditUsage | null> {
  if (effectiveTier(user) !== "ELITE") return null;
  const used = await countMentorCreditsUsedThisMonth(user.id);
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
