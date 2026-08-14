import { z } from "zod";
import { DEFAULT_LANDING_CONTENT } from "@/data/landing-content";

const heroStatSchema = z.object({
  value: z.number(),
  suffix: z.string(),
  label: z.string().min(1),
});

const salesStatSchema = z.object({
  value: z.number(),
  suffix: z.string(),
  label: z.string().min(1),
  animate: z.boolean().optional(),
});

const chapterSchema = z.object({
  letter: z.string().min(1),
  title: z.string().min(1),
  desc: z.string().min(1),
});

const featureSchema = z.object({
  icon: z.string().min(1),
  title: z.string().min(1),
  desc: z.string().min(1),
  tier: z.enum(["Pro", "Elite"]).optional(),
});

const groundLevelFeatureSchema = z.object({
  title: z.string().min(1),
  desc: z.string().min(1),
});

const landingTierSchema = z.object({
  name: z.string().min(1),
  price: z.string().min(1),
  billing: z.string().min(1),
  badge: z.enum(["starter", "pro", "elite"]),
  highlight: z.boolean(),
  tooltip: z.string().min(1),
  description: z.string(),
  features: z.array(z.string().min(1)).min(1),
  cta: z.string().min(1),
  href: z.string().min(1),
  opensModal: z.boolean().optional(),
});

const salesPricingTierSchema = z.object({
  name: z.string().min(1),
  price: z.string().min(1),
  billing: z.string().min(1),
  description: z.string().min(1),
  features: z.array(z.string().min(1)).min(1),
  cta: z.string().min(1),
  href: z.string().min(1),
  featured: z.boolean().optional(),
});

const featureComparisonItemSchema = z.object({
  name: z.string().min(1),
  starter: z.boolean().optional(),
  pro: z.boolean(),
  elite: z.boolean(),
});

const featureComparisonGroupSchema = z.object({
  category: z.string().min(1),
  color: z.string().min(1),
  items: z.array(featureComparisonItemSchema).min(1),
});

const featureComparisonTableSchema = z.object({
  groups: z.array(featureComparisonGroupSchema).min(1),
});

const whoCardSchema = z.object({
  role: z.string().min(1),
  title: z.string().min(1),
  desc: z.string().min(1),
  outcome: z.string(),
});

export const landingContentSchema = z.object({
  career: z.object({
    eyebrow: z.string().min(1),
    headline: z.string().min(1),
    headlineAccent: z.string().min(1),
    description: z.string().min(1),
    ctaPrimary: z.string().min(1),
    ctaSecondary: z.string().min(1),
    heroStats: z.array(heroStatSchema).min(1),
  }),
  sales: z.object({
    eyebrow: z.string().min(1),
    headline: z.string().min(1),
    headlineAccent: z.string().min(1),
    description: z.string().min(1),
    ctaPrimary: z.string().min(1),
    ctaSecondary: z.string().min(1),
    stats: z.array(salesStatSchema).min(1),
    whoCards: z.array(whoCardSchema).min(1),
    roi: z.object({
      eyebrow: z.string().min(1),
      title: z.string().min(1),
      titleAccent: z.string().min(1),
      description: z.string().min(1),
      stats: z.array(z.object({ value: z.string().min(1), label: z.string().min(1) })).min(1),
      quote: z.string().min(1),
      quoteAuthor: z.string().min(1),
      quoteSubtitle: z.string().optional(),
    }),
    pricing: z.array(salesPricingTierSchema).min(1),
    comparison: featureComparisonTableSchema.default(() => DEFAULT_LANDING_CONTENT.sales.comparison),
  }),
  stats: z.array(salesStatSchema),
  groundLevelView: z.object({
    eyebrow: z.string().min(1),
    title: z.string().min(1),
    description: z.string().min(1),
    features: z.array(groundLevelFeatureSchema),
  }),
  chapterCoverage: z.object({
    eyebrow: z.string().min(1),
    title: z.string().min(1),
    description: z.string().min(1),
    chapters: z.array(chapterSchema).min(1),
  }),
  caseStudySample: z.object({
    eyebrow: z.string().min(1),
    title: z.string().min(1),
    titleAccent: z.string().min(1),
    description: z.string().min(1),
    cards: z.array(
      z.object({
        slug: z.string().min(1),
        category: z.string().min(1),
        title: z.string().min(1),
        catchLine: z.string().min(1),
        excerpt: z.string().min(1),
        readMinutes: z.number(),
      })
    ).min(1),
    categoryTags: z.array(z.string().min(1)).min(1),
    disclaimer: z.string().min(1),
    viewMoreHref: z.string().optional(),
  }),
  whatsInside: z.object({
    titleLine1: z.string().min(1),
    titleLine2: z.string().min(1),
    description: z.string().min(1),
    features: z.array(featureSchema).min(1),
  }),
  pricing: z.object({
    title: z.string().min(1),
    subtitle: z.string().min(1),
    tiers: z.array(landingTierSchema).min(1),
    comparison: featureComparisonTableSchema.default(() => DEFAULT_LANDING_CONTENT.pricing.comparison),
  }),
  membersStrip: z.object({
    label: z.string().min(1),
    companies: z.array(z.string().min(1)).min(1),
  }),
  testimonials: z.object({
    eyebrow: z.string().min(1).optional(),
    title: z.string().min(1),
    items: z
      .array(
        z.object({
          id: z.string().min(1),
          quote: z.string().min(1),
          name: z.string().min(1),
          role: z.string().min(1),
          avatarLetter: z.string().min(1).optional(),
          avatarColor: z.string().min(1).optional(),
        })
      )
      .min(1),
  }),
  mentorConnect: z.object({
    eyebrow: z.string().min(1),
    title: z.string().min(1),
  }),
  footerTagline: z.string().min(1),
});

export function parseLandingContentPayload(payload: unknown) {
  return landingContentSchema.safeParse(payload);
}

export function formatLandingValidationErrors(result: ReturnType<typeof parseLandingContentPayload>) {
  if (result.success) return null;
  return result.error.issues
    .slice(0, 8)
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
}
