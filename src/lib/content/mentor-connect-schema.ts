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
import { mergeMentorApplyPageCopy } from "@/data/mentor-apply-content";
import { mergeMentorRewardLadder } from "@/lib/mentor-reward-ladder";

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

const rewardRungSchema = z.object({
  id: z.string().min(1).max(80),
  minQuestions: z.number().int().min(0).max(100_000),
  label: z.string().min(1).max(120),
  reward: z.string().min(1).max(300),
});

const rewardLadderSchema = z.object({
  rungs: z.array(rewardRungSchema).max(50),
});

const applicationSchema = z.object({
  hero: z
    .object({
      eyebrow: z.string().max(80).optional(),
      title: z.string().max(120).optional(),
      description: z.string().max(2000).optional(),
    })
    .optional(),
  detailsHeading: z.string().max(120).optional(),
  backgroundHeading: z.string().max(120).optional(),
  mentorOnHeading: z.string().max(120).optional(),
  nameLabel: z.string().max(80).optional(),
  namePlaceholder: z.string().max(200).optional(),
  emailLabel: z.string().max(80).optional(),
  emailPlaceholder: z.string().max(200).optional(),
  linkedInLabel: z.string().max(80).optional(),
  linkedInPlaceholder: z.string().max(300).optional(),
  locationLabel: z.string().max(80).optional(),
  locationPlaceholder: z.string().max(200).optional(),
  companyLabel: z.string().max(80).optional(),
  companyPlaceholder: z.string().max(200).optional(),
  roleLabel: z.string().max(80).optional(),
  rolePlaceholder: z.string().max(200).optional(),
  yearsLabel: z.string().max(80).optional(),
  yearsPlaceholder: z.string().max(200).optional(),
  commodityLabel: z.string().max(80).optional(),
  commodityPlaceholder: z.string().max(200).optional(),
  headlineLabel: z.string().max(80).optional(),
  headlinePlaceholder: z.string().max(200).optional(),
  bioLabel: z.string().max(120).optional(),
  bioPlaceholder: z.string().max(2000).optional(),
  tagsLabel: z.string().max(80).optional(),
  tagsPlaceholder: z.string().max(300).optional(),
  confirmText: z.string().max(800).optional(),
  submitLabel: z.string().max(80).optional(),
  successTitle: z.string().max(120).optional(),
  successBody: z.string().max(800).optional(),
  topics: z.array(z.string().max(80)).max(200).optional(),
});

export const mentorConnectSchema = z.object({
  hero: heroSchema,
  categories: z.array(categorySchema),
  segments: z.array(segmentCopySchema),
  howItWorks: howItWorksSchema,
  rewardLadder: rewardLadderSchema.optional(),
  application: applicationSchema.optional(),
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
      rewardLadder: mergeMentorRewardLadder(parsed.data.rewardLadder),
      application: mergeMentorApplyPageCopy(parsed.data.application),
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
    rewardLadder: mergeMentorRewardLadder(partial?.rewardLadder),
    application: mergeMentorApplyPageCopy(partial?.application),
  };
}
