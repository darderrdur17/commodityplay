import { prisma } from "@/lib/prisma";
import { countAnswersByMentorEmail } from "@/lib/mentor-reward-ladder";

/**
 * Answered-question counts keyed by mentor email (lowercase).
 * Uses a grouped query so the lookup stays O(distinct mentors), not a full JS scan.
 */
export async function getMentorAnsweredCountsByEmail(): Promise<Map<string, number>> {
  const rows = await prisma.mentorQuestion.groupBy({
    by: ["answeredByEmail"],
    where: {
      isAnswered: true,
      answeredByEmail: { not: null },
      NOT: { OR: [{ answer: null }, { answer: "" }] },
    },
    _count: { id: true },
  });

  const map = new Map<string, number>();
  for (const row of rows) {
    if (!row.answeredByEmail) continue;
    map.set(row.answeredByEmail.toLowerCase(), row._count.id);
  }
  return map;
}

export async function countMentorAnswersForEmail(email: string): Promise<number> {
  const questions = await prisma.mentorQuestion.findMany({
    where: {
      isAnswered: true,
      answeredByEmail: { equals: email, mode: "insensitive" },
    },
    select: { isAnswered: true, answer: true, answeredByEmail: true },
  });
  return countAnswersByMentorEmail(questions).get(email.trim().toLowerCase()) ?? 0;
}
