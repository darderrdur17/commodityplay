import { z } from "zod";
import { mergeByKey } from "./merge";
import {
  DEFAULT_MENTOR_CONNECT_CONTENT,
  DEFAULT_MENTOR_CONNECT_HOW_IT_WORKS,
  type MentorConnectContent,
  type MentorConnectHowItWorks,
  type MentorConnectStep,
} from "@/data/mentor-connect-content";

const heroSchema = z.object({
  eyebrow: z.string().min(1).max(80),
  title: z.string().min(1).max(120),
  subtitle: z.string().min(1).max(800),
});

const categorySchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  track: z.enum(["career", "sales", "both"]),
});

const stepSchema = z.object({
  num: z.string().min(1).max(8),
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(1200),
});

const calloutSchema = z.object({
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(800),
});

const howItWorksSchema = z.object({
  title: z.string().min(1).max(120),
  steps: z.array(stepSchema).min(1).max(6),
  callout: calloutSchema,
});

export const mentorConnectSchema = z.object({
  hero: heroSchema,
  categories: z.array(categorySchema),
  howItWorks: howItWorksSchema,
});

export function parseMentorConnectPayload(payload: unknown) {
  return mentorConnectSchema.safeParse(payload);
}

export function formatMentorConnectValidationErrors(
  result: ReturnType<typeof parseMentorConnectPayload>
) {
  if (result.success) return null;
  return result.error.issues
    .slice(0, 8)
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
}

function mergeHowItWorksSteps(cms?: MentorConnectStep[]): MentorConnectStep[] {
  return mergeByKey(DEFAULT_MENTOR_CONNECT_HOW_IT_WORKS.steps, cms ?? [], "num");
}

function mergeHowItWorks(cms?: Partial<MentorConnectHowItWorks>): MentorConnectHowItWorks {
  return {
    title: cms?.title?.trim() || DEFAULT_MENTOR_CONNECT_HOW_IT_WORKS.title,
    steps: mergeHowItWorksSteps(cms?.steps),
    callout: {
      ...DEFAULT_MENTOR_CONNECT_HOW_IT_WORKS.callout,
      ...cms?.callout,
    },
  };
}

export function normalizeMentorConnectPayload(payload: unknown): MentorConnectContent {
  const parsed = parseMentorConnectPayload(payload);
  if (parsed.success) {
    return {
      ...parsed.data,
      howItWorks: mergeHowItWorks(parsed.data.howItWorks),
    };
  }

  const partial = payload as Partial<MentorConnectContent> | null;
  return {
    hero: {
      ...DEFAULT_MENTOR_CONNECT_CONTENT.hero,
      ...partial?.hero,
    },
    categories: partial?.categories ?? DEFAULT_MENTOR_CONNECT_CONTENT.categories,
    howItWorks: mergeHowItWorks(partial?.howItWorks),
  };
}
