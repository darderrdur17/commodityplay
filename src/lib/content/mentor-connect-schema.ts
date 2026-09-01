import { z } from "zod";
import { mergeByKey } from "./merge";
import {
  DEFAULT_MENTOR_CONNECT_CONTENT,
  DEFAULT_MENTOR_CONNECT_HOW_IT_WORKS,
  defaultMentorConnectSegments,
  type MentorConnectContent,
  type MentorConnectHowItWorks,
  type MentorConnectSegmentCopy,
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

const segmentCopySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(160),
  blurb: z.string().min(1).max(400),
});

export const mentorConnectSchema = z.object({
  hero: heroSchema,
  categories: z.array(categorySchema),
  segments: z.array(segmentCopySchema),
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

export function mergeMentorConnectSegmentCopy(
  cms?: MentorConnectSegmentCopy[]
): MentorConnectSegmentCopy[] {
  return mergeByKey(defaultMentorConnectSegments(), cms ?? [], "id");
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
      segments: mergeMentorConnectSegmentCopy(parsed.data.segments),
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
    segments: mergeMentorConnectSegmentCopy(partial?.segments),
    howItWorks: mergeHowItWorks(partial?.howItWorks),
  };
}
