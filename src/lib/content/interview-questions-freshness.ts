import type { InterviewQuestion } from "@/data/interview-questions";

export const INTERVIEW_NEW_WINDOW_DAYS = 30;
export const CURRENT_MARKET_POD_SIZE = 3;

export type InterviewFreshnessBadge = "new" | "revisit";

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/** Parse `YYYY-MM-DD` as a local calendar date. Invalid / missing → null (no crash). */
export function parseIsoDateOnly(value?: string | null): Date | null {
  if (!value) return null;
  const match = ISO_DATE.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

/** Member-facing date, e.g. "8 Sep 2026". Same day + short month + year style as billing / playbook dates. */
export function formatInterviewMemberDate(value?: string | null): string | null {
  const date = parseIsoDateOnly(value);
  if (!date) return null;
  return `${date.getDate()} ${SHORT_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function toIsoDateOnly(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isWithinDays(from: Date, now: Date, days: number): boolean {
  const delta = startOfLocalDay(now).getTime() - startOfLocalDay(from).getTime();
  return delta >= 0 && delta <= days * 24 * 60 * 60 * 1000;
}

function latestQuestionDate(question: Pick<InterviewQuestion, "addedAt" | "updatedAt">): Date | null {
  const added = parseIsoDateOnly(question.addedAt);
  const updated = parseIsoDateOnly(question.updatedAt);
  if (added && updated) return added.getTime() >= updated.getTime() ? added : updated;
  return updated ?? added;
}

function latestQuestionIso(question: Pick<InterviewQuestion, "addedAt" | "updatedAt">): string | null {
  const added = parseIsoDateOnly(question.addedAt);
  const updated = parseIsoDateOnly(question.updatedAt);
  if (added && updated) {
    return added.getTime() >= updated.getTime() ? question.addedAt!.trim() : question.updatedAt!.trim();
  }
  if (updated) return question.updatedAt!.trim();
  if (added) return question.addedAt!.trim();
  return null;
}

/** New if added within 30 days; Revisit if updated within 30 days but not New. No dates → no badge. */
export function getQuestionFreshnessBadge(
  question: Pick<InterviewQuestion, "addedAt" | "updatedAt">,
  now: Date = new Date()
): InterviewFreshnessBadge | null {
  const added = parseIsoDateOnly(question.addedAt);
  if (added && isWithinDays(added, now, INTERVIEW_NEW_WINDOW_DAYS)) return "new";
  const updated = parseIsoDateOnly(question.updatedAt);
  if (updated && isWithinDays(updated, now, INTERVIEW_NEW_WINDOW_DAYS)) return "revisit";
  return null;
}

export function countNewThisMonth(
  questions: Pick<InterviewQuestion, "addedAt">[],
  now: Date = new Date()
): number {
  return questions.filter((q) => {
    const added = parseIsoDateOnly(q.addedAt);
    return Boolean(added && added.getFullYear() === now.getFullYear() && added.getMonth() === now.getMonth());
  }).length;
}

export function getBankLastRefreshedIso(
  questions: Pick<InterviewQuestion, "addedAt" | "updatedAt">[],
  override?: string | null
): string | null {
  if (parseIsoDateOnly(override)) return override!.trim();
  let bestIso: string | null = null;
  let bestTime = -Infinity;
  for (const q of questions) {
    const iso = latestQuestionIso(q);
    const date = parseIsoDateOnly(iso);
    if (!date) continue;
    if (date.getTime() > bestTime) {
      bestTime = date.getTime();
      bestIso = iso;
    }
  }
  return bestIso;
}

function recencyTime(question: Pick<InterviewQuestion, "addedAt" | "updatedAt">): number {
  return latestQuestionDate(question)?.getTime() ?? 0;
}

function rotateMonthly<T>(items: T[], now: Date, size: number): T[] {
  if (items.length <= size) return items;
  const start = (now.getFullYear() * 12 + now.getMonth()) % items.length;
  return Array.from({ length: size }, (_, i) => items[(start + i) % items.length]!);
}

/**
 * Current Market pod (Commercial Awareness only):
 * 1. Prefer commercial questions flagged `currentMarket`.
 * 2. Rotate a window of 3 by calendar month when more than 3 are flagged.
 * 3. If fewer than 3 flagged, fill with the most recently dated commercial questions.
 * 4. If none are flagged, use the 3 most recently dated commercial questions.
 */
export function selectCurrentMarketQuestions(
  questions: InterviewQuestion[],
  now: Date = new Date(),
  size = CURRENT_MARKET_POD_SIZE
): InterviewQuestion[] {
  const commercial = questions.filter((q) => q.tab === "commercial");
  const flagged = commercial
    .filter((q) => q.currentMarket)
    .sort((a, b) => a.id.localeCompare(b.id));

  const dated = commercial
    .filter((q) => latestQuestionDate(q))
    .sort((a, b) => recencyTime(b) - recencyTime(a) || a.id.localeCompare(b.id));

  const picked = flagged.length ? rotateMonthly(flagged, now, size) : dated.slice(0, size);

  if (picked.length >= size || !flagged.length) return picked.slice(0, size);

  const ids = new Set(picked.map((q) => q.id));
  const fillers = dated.filter((q) => !ids.has(q.id));
  return [...picked, ...fillers].slice(0, size);
}

export function getCurrentMarketUpdatedIso(questions: InterviewQuestion[]): string | null {
  return getBankLastRefreshedIso(questions);
}
