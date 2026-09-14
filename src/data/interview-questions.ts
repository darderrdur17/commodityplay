import bank from "./interview-questions-bank.json";

export type InterviewTab = "technical" | "commercial" | "behavioural" | "elimination";
export type InterviewDifficulty = "easy" | "med" | "hard";

export interface InterviewQuestion {
  id: string;
  tab: InterviewTab;
  category: string;
  question: string;
  modelAnswer: string;
  difficulty?: InterviewDifficulty;
  framework?: string;
  interviewTip?: string;
  weakAnswer?: string;
  why?: string;
  /** ISO date `YYYY-MM-DD` — first published. Drives the New badge (within 30 days). */
  addedAt?: string;
  /** ISO date `YYYY-MM-DD` — last content refresh. Drives Revisit when not New. */
  updatedAt?: string;
  /** When true and `tab` is commercial, eligible for the rotating Current Market pod. */
  currentMarket?: boolean;
}

export interface InterviewTabMeta {
  id: InterviewTab;
  label: string;
  count: number;
}

export const INTERVIEW_TABS: InterviewTabMeta[] = bank.tabs as InterviewTabMeta[];
export const INTERVIEW_QUESTIONS: InterviewQuestion[] = bank.questions as InterviewQuestion[];

export const INTERVIEW_CATEGORIES = [
  "All",
  ...Array.from(new Set(INTERVIEW_QUESTIONS.map((q) => q.category))),
];

export const INTERVIEW_DIFFICULTIES: { id: InterviewDifficulty | "all"; label: string }[] = [
  { id: "all", label: "All levels" },
  { id: "easy", label: "Easy" },
  { id: "med", label: "Medium" },
  { id: "hard", label: "Hard" },
];

export interface InterviewQuestionsHeroCopy {
  eyebrow: string;
  title: string;
  description: string;
  searchPlaceholder: string;
}

export const DEFAULT_INTERVIEW_QUESTIONS_HERO: InterviewQuestionsHeroCopy = {
  eyebrow: "Pro · {questionCount} Q&As",
  title: "Interview Question Bank",
  description:
    "{questionCount} commodity trading interview questions with model answers — technical, commercial judgement, behavioural, and elimination questions from major trading firms.",
  searchPlaceholder: "Search questions, answers, frameworks...",
};

export function mergeInterviewQuestionsHero(
  cms?: Partial<InterviewQuestionsHeroCopy> | null
): InterviewQuestionsHeroCopy {
  const raw = cms ?? {};
  return {
    eyebrow: raw.eyebrow?.trim() || DEFAULT_INTERVIEW_QUESTIONS_HERO.eyebrow,
    title: raw.title?.trim() || DEFAULT_INTERVIEW_QUESTIONS_HERO.title,
    description: raw.description?.trim() || DEFAULT_INTERVIEW_QUESTIONS_HERO.description,
    searchPlaceholder:
      raw.searchPlaceholder?.trim() || DEFAULT_INTERVIEW_QUESTIONS_HERO.searchPlaceholder,
  };
}

export function formatInterviewHeroCopy(template: string, questionCount: number): string {
  return template.replaceAll("{questionCount}", String(questionCount));
}
