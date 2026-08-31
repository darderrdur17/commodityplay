export const MENTOR_DEMO_EMAIL = "elite.mentor@demo.com";

export function isMentorDemoUser(email?: string | null): boolean {
  return email === MENTOR_DEMO_EMAIL;
}

/** Mentor inbox / account — DB flag, with demo-email fallback. */
export function isMentorAccount(user?: {
  isMentor?: boolean | null;
  email?: string | null;
} | null): boolean {
  if (!user) return false;
  return Boolean(user.isMentor) || isMentorDemoUser(user.email);
}

/** Anonymous member label — no PII in mentor view */
export function memberDisplayId(userId: string): string {
  return `Member #${userId.slice(-4).toUpperCase()}`;
}

export const MENTOR_SEGMENT_LABELS: Record<string, string> = {
  "physical-trading": "Physical Trading",
  finance: "Finance & Risk",
  analytics: "Market Analytics",
  operations: "Operations",
  sales: "Commercial / Sales",
};
