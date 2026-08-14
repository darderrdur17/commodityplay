import { z } from "zod";
import { DEFAULT_FAQ_CONTENT } from "@/data/faq";

const faqItemSchema = z.object({
  q: z.string().min(1),
  a: z.string().min(1),
});

const faqHeroSchema = z.object({
  eyebrow: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().min(1),
});

export const faqContentSchema = z.object({
  hero: faqHeroSchema,
  items: z.array(faqItemSchema).min(1),
});

export type FaqContentPayload = z.infer<typeof faqContentSchema>;

export function parseFaqContentPayload(payload: unknown) {
  return faqContentSchema.safeParse(payload);
}

export function formatFaqValidationErrors(result: z.SafeParseError<unknown>) {
  return result.error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
}

export function normalizeFaqContentPayload(payload: unknown): FaqContentPayload {
  const parsed = parseFaqContentPayload(payload);
  if (parsed.success) return parsed.data;
  return DEFAULT_FAQ_CONTENT;
}
