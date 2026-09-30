import { z } from "zod";
import {
  DEFAULT_SALES_MARKET_NUDGES_CONTENT,
  NUDGE_STATUSES,
  resolveBriefCategories,
  resolveNudgeStatus,
  type IntelligenceBrief,
  type MarketNudgeItem,
  type SalesMarketNudgesContent,
} from "@/data/sales-market-nudges";

const marketNudgeSchema = z.object({
  id: z.string().min(1).max(80),
  title: z.string().max(200).optional().default(""),
  whyNow: z.string().max(500).optional().default(""),
  accountAction: z.string().max(500).optional().default(""),
  accountNames: z.array(z.string().min(1).max(120)).default([]),
  status: z.enum(NUDGE_STATUSES).optional(),
  /** Legacy single-line body, migrated into `whyNow` below and then dropped. */
  text: z.string().max(500).optional(),
  /** Legacy hide flag. Read for status resolution, never written back. */
  archived: z.boolean().optional(),
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
  status: z.enum(NUDGE_STATUSES).optional(),
  /** Legacy hide flag. Read for status resolution, never written back. */
  archived: z.boolean().optional(),
});

export const salesMarketNudgesSchema = z.object({
  eyebrow: z.string().min(1).max(80),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(600),
  weeklyHeading: z.string().max(80).optional(),
  briefsHeading: z.string().max(80).optional(),
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

/**
 * Falls back to the shipped defaults when CMS has no nudges, resolves each
 * item's status, and migrates the legacy single-line `text` into `whyNow`.
 * The legacy `text` / `archived` fields are not written back.
 */
function normalizeNudges(cms?: MarketNudgeItem[]): MarketNudgeItem[] {
  const source = cms?.length ? cms : DEFAULT_SALES_MARKET_NUDGES_CONTENT.weeklyNudges;
  return source.map((nudge) => ({
    id: nudge.id,
    title: nudge.title?.trim() ?? "",
    whyNow: nudge.whyNow?.trim() || nudge.text?.trim() || "",
    accountAction: nudge.accountAction?.trim() ?? "",
    accountNames: nudge.accountNames ?? [],
    status: resolveNudgeStatus(nudge),
  }));
}

function normalizeBriefs(cms?: IntelligenceBrief[]): IntelligenceBrief[] {
  const source = cms?.length ? cms : DEFAULT_SALES_MARKET_NUDGES_CONTENT.intelligenceBriefs;
  return source.map((brief) => ({ ...brief, status: resolveNudgeStatus(brief) }));
}

export function normalizeSalesMarketNudgesPayload(payload: unknown): SalesMarketNudgesContent {
  const parsed = parseSalesMarketNudgesPayload(payload);
  if (parsed.success) {
    return {
      eyebrow: parsed.data.eyebrow.trim(),
      title: parsed.data.title.trim(),
      description: parsed.data.description.trim(),
      weeklyHeading:
        parsed.data.weeklyHeading?.trim() || DEFAULT_SALES_MARKET_NUDGES_CONTENT.weeklyHeading,
      briefsHeading:
        parsed.data.briefsHeading?.trim() || DEFAULT_SALES_MARKET_NUDGES_CONTENT.briefsHeading,
      weeklyNudges: normalizeNudges(parsed.data.weeklyNudges),
      intelligenceBriefs: normalizeBriefs(parsed.data.intelligenceBriefs),
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
    weeklyHeading: partial.weeklyHeading?.trim() || DEFAULT_SALES_MARKET_NUDGES_CONTENT.weeklyHeading,
    briefsHeading: partial.briefsHeading?.trim() || DEFAULT_SALES_MARKET_NUDGES_CONTENT.briefsHeading,
    weeklyNudges: normalizeNudges(partial.weeklyNudges),
    intelligenceBriefs: normalizeBriefs(partial.intelligenceBriefs),
    briefCategories: resolveBriefCategories(partial.briefCategories, partial.intelligenceBriefs),
  };
}
