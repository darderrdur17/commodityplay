import { z } from "zod";
import { DEFAULT_LANDING_CONTENT } from "@/data/landing-content";
import { normalizeChapterCoverageHeadline } from "./merge";

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

const membersStripSchema = z.object({
  label: z.string().min(1),
  companies: z.array(z.string().min(1)).min(1),
});

export const landingContentSchema = z.object({
  career: z.object({
    eyebrow: z.string().min(1),
    headline: z.string().min(1),
    headlineAccent: z.string().min(1),
    description: z.string().min(1),
    ctaPrimary: z.string().min(1),
    ctaSecondary: z.string().min(1),
    finalCtaTitle: z.string().min(1),
    finalCtaAccent: z.string().min(1),
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
    whoSection: z
      .object({
        label: z.string().min(1),
        headline: z.string().min(1),
      })
      .default(() => DEFAULT_LANDING_CONTENT.sales.whoSection),
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
    learn: z
      .object({
        eyebrow: z.string().min(1),
        headline: z.string().min(1),
        description: z.string().min(1),
        items: z
          .array(
            z.object({
              num: z.string().min(1),
              title: z.string().min(1),
              desc: z.string().min(1),
            })
          )
          .min(1),
      })
      .default(() => DEFAULT_LANDING_CONTENT.sales.learn),
    trackTools: z
      .object({
        eyebrow: z.string().min(1),
        headline: z.string().min(1).default(() => DEFAULT_LANDING_CONTENT.sales.trackTools.headline),
        description: z.string().min(1).default(() => DEFAULT_LANDING_CONTENT.sales.trackTools.description),
        features: z
          .array(
            z.object({
              title: z.string().min(1),
              desc: z.string().min(1),
            })
          )
          .min(1),
      })
      .default(() => DEFAULT_LANDING_CONTENT.sales.trackTools),
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
    titleAccent: z.string().min(1),
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
  careerMembersStrip: membersStripSchema.optional(),
  salesMembersStrip: membersStripSchema.optional(),
  membersStrip: membersStripSchema.optional(),
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
  salesTestimonials: z.object({
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
  trackSelection: z.object({
    career: z.object({
      title: z.string().min(1),
      caption: z.string().min(1),
    }),
    sales: z.object({
      title: z.string().min(1),
      caption: z.string().min(1),
    }),
  }),
  mentorConnect: z.object({
    eyebrow: z.string().min(1),
    title: z.string().min(1),
  }),
}).transform((data) => {
  const legacy = data.membersStrip;
  const careerFallback = legacy ?? DEFAULT_LANDING_CONTENT.careerMembersStrip;
  const salesFallback = legacy ?? DEFAULT_LANDING_CONTENT.salesMembersStrip;
  return {
    ...data,
    careerMembersStrip: data.careerMembersStrip ?? careerFallback,
    salesMembersStrip: data.salesMembersStrip ?? salesFallback,
  };
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

type PathSegment = string | number;

/**
 * Drop blank entries from "one per line" string lists. Textarea editors sync on every
 * keystroke, so a trailing newline yields `[""]` — which would otherwise fail the
 * `.min(1)` string rules and reject the whole landing payload.
 *
 * Scalar strings are deliberately left untouched: some are meaningfully padded
 * (e.g. the stat suffix `" min"` renders as "2 min").
 */
function dropBlankListEntries(value: unknown): unknown {
  if (Array.isArray(value)) {
    const items = value.map(dropBlankListEntries);
    if (items.length > 0 && items.every((item) => typeof item === "string")) {
      return (items as string[]).filter((item) => item.trim().length > 0);
    }
    return items;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      out[key] = dropBlankListEntries(nested);
    }
    return out;
  }
  return value;
}

function getAtPath(root: unknown, path: PathSegment[]): unknown {
  let current: unknown = root;
  for (const segment of path) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<PathSegment, unknown>)[segment];
  }
  return current;
}

function setAtPath(root: unknown, path: PathSegment[], value: unknown): boolean {
  if (path.length === 0) return false;
  let container: unknown = root;
  for (const segment of path.slice(0, -1)) {
    if (container == null || typeof container !== "object") return false;
    container = (container as Record<PathSegment, unknown>)[segment];
  }
  if (container == null || typeof container !== "object") return false;
  (container as Record<PathSegment, unknown>)[path[path.length - 1]] = value;
  return true;
}

/**
 * Repair the specific fields Zod rejected instead of failing the entire module save:
 * a field the admin blanked out falls back to its bundled default, and numeric/string
 * mismatches are coerced. Anything else still surfaces as a save error.
 */
function repairRejectedFields(candidate: unknown, issues: z.ZodIssue[]): boolean {
  let changed = false;

  for (const issue of issues) {
    const path = issue.path as PathSegment[];
    if (path.length === 0) continue;

    if (issue.code === "invalid_type") {
      const actual = getAtPath(candidate, path);
      if (issue.expected === "number" && typeof actual === "string") {
        const parsed = Number(actual);
        if (Number.isFinite(parsed) && setAtPath(candidate, path, parsed)) {
          changed = true;
          continue;
        }
      }
      if (issue.expected === "string" && typeof actual === "number") {
        if (setAtPath(candidate, path, String(actual))) {
          changed = true;
          continue;
        }
      }
    }

    if (issue.code === "too_small" || issue.code === "invalid_type") {
      const fallback = getAtPath(DEFAULT_LANDING_CONTENT, path);
      if (fallback !== undefined && setAtPath(candidate, path, fallback)) {
        changed = true;
      }
    }
  }

  return changed;
}

/** Normalize legacy chapter-coverage headings before validation. */
function normalizeChapterCoverageForSave(payload: unknown): unknown {
  if (!payload || typeof payload !== "object") return payload;
  const root = payload as Record<string, unknown>;
  const chapterCoverage = root.chapterCoverage;
  if (!chapterCoverage || typeof chapterCoverage !== "object") return payload;

  const cc = chapterCoverage as Record<string, unknown>;
  const headline = normalizeChapterCoverageHeadline({
    title: typeof cc.title === "string" ? cc.title : undefined,
    titleAccent: typeof cc.titleAccent === "string" ? cc.titleAccent : undefined,
    defaultTitle: DEFAULT_LANDING_CONTENT.chapterCoverage.title,
    defaultTitleAccent: DEFAULT_LANDING_CONTENT.chapterCoverage.titleAccent,
  });

  return {
    ...root,
    chapterCoverage: { ...cc, ...headline },
  };
}

/** Normalize incidental empties, then validate for save. Mirrors prepareFaqContentForSave. */
export function prepareLandingContentForSave(payload: unknown) {
  let candidate = normalizeChapterCoverageForSave(dropBlankListEntries(payload));

  for (let attempt = 0; attempt < 5; attempt++) {
    const result = landingContentSchema.safeParse(candidate);
    if (result.success) return result;

    const repairable = JSON.parse(JSON.stringify(candidate));
    if (!repairRejectedFields(repairable, result.error.issues)) return result;
    candidate = repairable;
  }

  return landingContentSchema.safeParse(candidate);
}
