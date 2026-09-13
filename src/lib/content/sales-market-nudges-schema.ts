import { z } from "zod";
import {
  DEFAULT_SALES_MARKET_NUDGES_CONTENT,
  resolveBriefCategories,
  type IntelligenceBrief,
  type MarketNudgeItem,
  type SalesMarketNudgesContent,
} from "@/data/sales-market-nudges";

const marketNudgeSchema = z.object({
  id: z.string().min(1).max(80),
  text: z.string().min(1).max(500),
  accountNames: z.array(z.string().min(1).max(120)).default([]),
  archived: z.boolean().optional().default(false),
});

const intelligenceBriefSchema = z.object({
  id: z.string().min(1).max(80),
  title: z.string().min(1).max(120),
  category: z.string().min(1).max(80),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
  description: z.string().min(1).max(1000),
  discoveryQuestions: z.array(z.string().min(1).max(300)).min(1).max(6),
  updatedAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
    .optional(),
  updatedLabel: z.string().max(40).optional(),
  archived: z.boolean().optional().default(false),
});

export const salesMarketNudgesSchema = z.object({
  eyebrow: z.string().min(1).max(80),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(600),
  weeklyNudges: z.array(marketNudgeSchema),
  intelligenceBriefs: z.array(intelligenceBriefSchema),
  briefCategories: z.array(z.string().min(1).max(80)).optional(),
});

export function parseSalesMarketNudgesPayload(payload: unknown) {
  return salesMarketNudgesSchema.safeParse(payload);
}

export function formatSalesMarketNudgesValidationErrors(
  result: ReturnType<typeof parseSalesMarketNudgesPayload>
) {
  if (result.success) return null;
  return result.error.issues
    .slice(0, 8)
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
}

function mergeNudges(cms?: MarketNudgeItem[]): MarketNudgeItem[] {
  if (!cms?.length) return DEFAULT_SALES_MARKET_NUDGES_CONTENT.weeklyNudges;
  return cms;
}

function mergeBriefs(cms?: IntelligenceBrief[]): IntelligenceBrief[] {
  if (!cms?.length) return DEFAULT_SALES_MARKET_NUDGES_CONTENT.intelligenceBriefs;
  return cms;
}

function withArchivedDefaults<T extends { archived?: boolean }>(items: T[]): T[] {
  return items.map((item) => ({ ...item, archived: item.archived ?? false }));
}

export function normalizeSalesMarketNudgesPayload(payload: unknown): SalesMarketNudgesContent {
  const parsed = parseSalesMarketNudgesPayload(payload);
  if (parsed.success) {
    return {
      eyebrow: parsed.data.eyebrow.trim(),
      title: parsed.data.title.trim(),
      description: parsed.data.description.trim(),
      weeklyNudges: withArchivedDefaults(mergeNudges(parsed.data.weeklyNudges)),
      intelligenceBriefs: withArchivedDefaults(mergeBriefs(parsed.data.intelligenceBriefs)),
      briefCategories: resolveBriefCategories(
        parsed.data.briefCategories,
        parsed.data.intelligenceBriefs
      ),
    };
  }

  const partial = (payload ?? {}) as Partial<SalesMarketNudgesContent>;
  return {
    eyebrow: partial.eyebrow?.trim() || DEFAULT_SALES_MARKET_NUDGES_CONTENT.eyebrow,
    title: partial.title?.trim() || DEFAULT_SALES_MARKET_NUDGES_CONTENT.title,
    description: partial.description?.trim() || DEFAULT_SALES_MARKET_NUDGES_CONTENT.description,
    weeklyNudges: withArchivedDefaults(mergeNudges(partial.weeklyNudges)),
    intelligenceBriefs: withArchivedDefaults(mergeBriefs(partial.intelligenceBriefs)),
    briefCategories: resolveBriefCategories(partial.briefCategories, partial.intelligenceBriefs),
  };
}

/** Member-facing content — excludes archived nudges and briefs. */
export function filterActiveSalesMarketNudgesContent(
  content: SalesMarketNudgesContent
): SalesMarketNudgesContent {
  return {
    ...content,
    weeklyNudges: content.weeklyNudges.filter((nudge) => !nudge.archived),
    intelligenceBriefs: content.intelligenceBriefs.filter((brief) => !brief.archived),
  };
}
