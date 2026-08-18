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

const faqFooterCtaSchema = z.object({
  heading: z.string().min(1),
  subtext: z.string().min(1),
  email: z.string().email(),
  buttonLabel: z.string().min(1),
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
  footerCta: z
    .object({
      heading: z.string().optional(),
      subtext: z.string().optional(),
      email: z.string().optional(),
      buttonLabel: z.string().optional(),
    })
    .optional(),
  items: z.array(faqItemDraftSchema).optional(),
});

export const faqContentSchema = z.object({
  hero: faqHeroSchema,
  footerCta: faqFooterCtaSchema,
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
  const footer = draft.data.footerCta;
  return {
    hero: {
      eyebrow: hero?.eyebrow ?? DEFAULT_FAQ_CONTENT.hero.eyebrow,
      title: hero?.title ?? DEFAULT_FAQ_CONTENT.hero.title,
      subtitle: hero?.subtitle ?? DEFAULT_FAQ_CONTENT.hero.subtitle,
    },
    footerCta: {
      heading: footer?.heading ?? DEFAULT_FAQ_CONTENT.footerCta.heading,
      subtext: footer?.subtext ?? DEFAULT_FAQ_CONTENT.footerCta.subtext,
      email: footer?.email ?? DEFAULT_FAQ_CONTENT.footerCta.email,
      buttonLabel: footer?.buttonLabel ?? DEFAULT_FAQ_CONTENT.footerCta.buttonLabel,
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
