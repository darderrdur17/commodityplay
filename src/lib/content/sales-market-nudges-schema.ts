import { z } from "zod";
import {
  DEFAULT_SALES_MARKET_NUDGES_CONTENT,
  type IntelligenceBrief,
  type MarketNudgeItem,
  type SalesMarketNudgesContent,
} from "@/data/sales-market-nudges";

const marketNudgeSchema = z.object({
  id: z.string().min(1).max(80),
  text: z.string().min(1).max(500),
  accountNames: z.array(z.string().min(1).max(120)).default([]),
});

const intelligenceBriefSchema = z.object({
  id: z.string().min(1).max(80),
  title: z.string().min(1).max(120),
  category: z.string().min(1).max(80),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
  description: z.string().min(1).max(1000),
  discoveryQuestions: z.array(z.string().min(1).max(300)).min(1).max(6),
  updatedLabel: z.string().max(40).optional(),
});

export const salesMarketNudgesSchema = z.object({
  eyebrow: z.string().min(1).max(80),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(600),
  weeklyNudges: z.array(marketNudgeSchema),
  intelligenceBriefs: z.array(intelligenceBriefSchema),
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

export function normalizeSalesMarketNudgesPayload(payload: unknown): SalesMarketNudgesContent {
  const parsed = parseSalesMarketNudgesPayload(payload);
  if (parsed.success) {
    return {
      eyebrow: parsed.data.eyebrow.trim(),
      title: parsed.data.title.trim(),
      description: parsed.data.description.trim(),
      weeklyNudges: mergeNudges(parsed.data.weeklyNudges),
      intelligenceBriefs: mergeBriefs(parsed.data.intelligenceBriefs),
    };
  }

  const partial = (payload ?? {}) as Partial<SalesMarketNudgesContent>;
  return {
    eyebrow: partial.eyebrow?.trim() || DEFAULT_SALES_MARKET_NUDGES_CONTENT.eyebrow,
    title: partial.title?.trim() || DEFAULT_SALES_MARKET_NUDGES_CONTENT.title,
    description: partial.description?.trim() || DEFAULT_SALES_MARKET_NUDGES_CONTENT.description,
    weeklyNudges: mergeNudges(partial.weeklyNudges),
    intelligenceBriefs: mergeBriefs(partial.intelligenceBriefs),
  };
}
