import { z } from "zod";
import {
  DEFAULT_MENTOR_CONNECT_CONTENT,
  type MentorConnectContent,
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

export const mentorConnectSchema = z.object({
  hero: heroSchema,
  categories: z.array(categorySchema),
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

export function normalizeMentorConnectPayload(payload: unknown): MentorConnectContent {
  const parsed = parseMentorConnectPayload(payload);
  if (parsed.success) return parsed.data;

  const partial = payload as Partial<MentorConnectContent> | null;
  return {
    hero: {
      ...DEFAULT_MENTOR_CONNECT_CONTENT.hero,
      ...partial?.hero,
    },
    categories: partial?.categories ?? DEFAULT_MENTOR_CONNECT_CONTENT.categories,
  };
}
