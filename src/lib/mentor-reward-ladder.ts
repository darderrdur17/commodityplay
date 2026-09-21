export interface MentorRewardRung {
  id: string;
  minQuestions: number;
  label: string;
  reward: string;
}

export interface MentorRewardLadder {
  rungs: MentorRewardRung[];
}

export const DEFAULT_MENTOR_REWARD_RUNGS: MentorRewardRung[] = [
  { id: "r50", minQuestions: 50, label: "50 questions", reward: "Reward (TBD)" },
  { id: "r100", minQuestions: 100, label: "100 questions", reward: "Reward (TBD)" },
  { id: "r150", minQuestions: 150, label: "150 questions", reward: "Reward (TBD)" },
  { id: "r200", minQuestions: 200, label: "200 questions", reward: "Reward (TBD)" },
  { id: "r250", minQuestions: 250, label: "250 questions", reward: "$160" },
];

export function mergeMentorRewardRungs(cms?: MentorRewardRung[] | null): MentorRewardRung[] {
  if (!cms?.length) return [...DEFAULT_MENTOR_REWARD_RUNGS];
  return cms.map((rung, index) => ({
    id: rung.id?.trim() || `rung-${index + 1}`,
    minQuestions: Math.max(0, Math.floor(Number(rung.minQuestions) || 0)),
    label: rung.label?.trim() || `${rung.minQuestions} questions`,
    reward: rung.reward?.trim() || "Reward (TBD)",
  }));
}

export function mergeMentorRewardLadder(
  cms?: Partial<MentorRewardLadder> | null
): MentorRewardLadder {
  return { rungs: mergeMentorRewardRungs(cms?.rungs) };
}

export interface MentorAnswerRecord {
  isAnswered: boolean;
  answer?: string | null;
  answeredByEmail?: string | null;
}

/** A question counts when the mentor actually replied — not credits remaining or pending asks. */
export function isCountedMentorAnswer(q: MentorAnswerRecord): boolean {
  return q.isAnswered === true && Boolean(q.answer?.trim()) && Boolean(q.answeredByEmail?.trim());
}

export function countAnswersByMentorEmail(questions: MentorAnswerRecord[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const q of questions) {
    if (!isCountedMentorAnswer(q) || !q.answeredByEmail) continue;
    const key = q.answeredByEmail.trim().toLowerCase();
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}

export function mentorAnsweredCountForEmail(
  countsByEmail: Map<string, number>,
  email: string | null | undefined
): number {
  if (!email?.trim()) return 0;
  return countsByEmail.get(email.trim().toLowerCase()) ?? 0;
}

export interface MentorRewardProgress {
  answeredCount: number;
  unlockedRung: MentorRewardRung | null;
  nextRung: MentorRewardRung | null;
  remainingToNext: number | null;
  /** 0–100 progress from the last unlocked threshold toward the next rung. */
  progressPercent: number;
  /** Member-facing badge copy — rung label only, never the reward/cash text. */
  recognitionLabel: string | null;
}

function sortRungs(rungs: MentorRewardRung[]): MentorRewardRung[] {
  return [...rungs].sort((a, b) => a.minQuestions - b.minQuestions || a.id.localeCompare(b.id));
}

/** Count = questions this mentor answered (reply saved), matched by answeredByEmail. */
export function computeMentorRewardProgress(
  answeredCount: number,
  rungs: MentorRewardRung[]
): MentorRewardProgress {
  const sorted = sortRungs(mergeMentorRewardRungs(rungs));
  if (sorted.length === 0) {
    return {
      answeredCount,
      unlockedRung: null,
      nextRung: null,
      remainingToNext: null,
      progressPercent: 0,
      recognitionLabel: null,
    };
  }

  let unlocked: MentorRewardRung | null = null;
  let next: MentorRewardRung | null = sorted[0];

  for (const rung of sorted) {
    if (answeredCount >= rung.minQuestions) {
      unlocked = rung;
      next = sorted.find((r) => r.minQuestions > rung.minQuestions) ?? null;
    }
  }

  const prevThreshold = unlocked?.minQuestions ?? 0;
  const nextThreshold = next?.minQuestions ?? null;
  let progressPercent = next ? 0 : 100;

  if (nextThreshold !== null && nextThreshold > prevThreshold) {
    progressPercent = Math.min(
      100,
      Math.max(0, Math.round(((answeredCount - prevThreshold) / (nextThreshold - prevThreshold)) * 100))
    );
  }

  return {
    answeredCount,
    unlockedRung: unlocked,
    nextRung: next,
    remainingToNext: next ? Math.max(0, next.minQuestions - answeredCount) : null,
    progressPercent,
    recognitionLabel: unlocked?.label ?? null,
  };
}
