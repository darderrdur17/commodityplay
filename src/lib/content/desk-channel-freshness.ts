import type { DeskQA } from "@/data/desk-channel";
import {
  countNewThisMonth,
  formatInterviewMemberDate,
  getBankLastRefreshedIso,
  toIsoFromFlexibleDate,
  type DatedLibraryItem,
} from "@/lib/content/interview-questions-freshness";

export function deskQaToDatedItem(
  question: Pick<DeskQA, "addedAt" | "updatedAt" | "date">
): DatedLibraryItem {
  const addedAt =
    toIsoFromFlexibleDate(question.addedAt) ?? toIsoFromFlexibleDate(question.date) ?? undefined;
  const updatedAt = toIsoFromFlexibleDate(question.updatedAt) ?? undefined;
  return { addedAt, updatedAt };
}

export function hydrateDeskQaDates(questions: DeskQA[]): DeskQA[] {
  return questions.map((question) => {
    const dated = deskQaToDatedItem(question);
    return {
      ...question,
      ...(dated.addedAt ? { addedAt: dated.addedAt } : {}),
      ...(dated.updatedAt ? { updatedAt: dated.updatedAt } : dated.addedAt ? { updatedAt: dated.addedAt } : {}),
    };
  });
}

export function getDeskLibraryFreshness(
  questions: DeskQA[],
  override?: string | null,
  now: Date = new Date()
): {
  lastRefreshedIso: string | null;
  lastRefreshedLabel: string | null;
  newThisMonth: number;
  total: number;
} {
  const dated = questions.map(deskQaToDatedItem);
  const lastRefreshedIso = getBankLastRefreshedIso(dated, override);
  return {
    lastRefreshedIso,
    lastRefreshedLabel: formatInterviewMemberDate(lastRefreshedIso),
    newThisMonth: countNewThisMonth(dated, now),
    total: questions.length,
  };
}
