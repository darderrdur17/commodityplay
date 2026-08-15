import { z } from "zod";
import { DEFAULT_FAQ_CONTENT, type FaqContent } from "@/data/faq";

const faqItemSchema = z.object({
  q: z.string().min(1),
  a: z.string().min(1),
});

const faqHeroSchema = z.object({
  eyebrow: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().min(1),
});

/** Lenient schema for admin editor — allows empty draft Q&A rows while editing. */
const faqItemDraftSchema = z.object({
  q: z.string(),
  a: z.string(),
});

const faqDraftSchema = z.object({
  hero: z
    .object({
      eyebrow: z.string().optional(),
      title: z.string().optional(),
      subtitle: z.string().optional(),
    })
    .optional(),
  items: z.array(faqItemDraftSchema).optional(),
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

/** Preserve in-progress admin edits (including empty new rows) without resetting to defaults. */
export function normalizeFaqContentPayload(payload: unknown): FaqContent {
  const draft = faqDraftSchema.safeParse(payload);
  if (!draft.success) return DEFAULT_FAQ_CONTENT;

  const hero = draft.data.hero;
  return {
    hero: {
      eyebrow: hero?.eyebrow ?? DEFAULT_FAQ_CONTENT.hero.eyebrow,
      title: hero?.title ?? DEFAULT_FAQ_CONTENT.hero.title,
      subtitle: hero?.subtitle ?? DEFAULT_FAQ_CONTENT.hero.subtitle,
    },
    items: draft.data.items?.length ? draft.data.items : DEFAULT_FAQ_CONTENT.items,
  };
}

/** Strip empty draft rows, then validate for publish/save. */
export function prepareFaqContentForSave(payload: unknown) {
  const normalized = normalizeFaqContentPayload(payload);
  const items = normalized.items.filter((item) => item.q.trim() && item.a.trim());
  return parseFaqContentPayload({ ...normalized, items });
}
