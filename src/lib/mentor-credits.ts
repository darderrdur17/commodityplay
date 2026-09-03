/** Elite members receive this many mentor question credits per calendar month. */
export const MENTOR_CREDITS_MONTHLY_LIMIT = 15;

export function getCurrentMonthStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
}

const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

/** Shared "MTH YEAR" label, e.g. "Sep 2026". */
export function formatMonthYear(date = new Date()): string {
  return `${SHORT_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatCreditMonthLabel(date = new Date()): string {
  return formatMonthYear(date);
}

export interface MentorCreditUsage {
  used: number;
  limit: number;
  remaining: number;
  monthLabel: string;
}

export function getMentorCreditUsage(usedThisMonth: number): MentorCreditUsage {
  const used = Math.max(0, Math.min(usedThisMonth, MENTOR_CREDITS_MONTHLY_LIMIT));
  return {
    used,
    limit: MENTOR_CREDITS_MONTHLY_LIMIT,
    remaining: Math.max(0, MENTOR_CREDITS_MONTHLY_LIMIT - used),
    monthLabel: formatCreditMonthLabel(),
  };
}

export function formatMentorCreditsUsedLabel(usage: MentorCreditUsage): string {
  return `${usage.used}/${usage.limit} used`;
}
