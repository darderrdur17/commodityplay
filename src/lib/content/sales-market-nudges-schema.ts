import { z } from "zod";
import {
  DEFAULT_SALES_MARKET_NUDGES_CONTENT,
  resolveBriefCategories,
  type IntelligenceBrief,
  type MarketNudgeItem,
  type NudgeLifecycleStatus,
  type SalesMarketNudgesContent,
} from "@/data/sales-market-nudges";

const lifecycleStatus = z.enum(["active", "expired", "archive"]);

function coerceStatus(status: unknown, archived?: boolean): NudgeLifecycleStatus {
  if (status === "expired" || status === "archive" || status === "active") return status;
  if (status === "archived") return "archive";
  if (archived) return "archive";
  return "active";
}

const marketNudgeSchema = z
  .object({
    id: z.string().min(1).max(80),
    title: z.string().max(120).optional(),
    whyNow: z.string().max(500).optional(),
    accountAction: z.string().max(500).optional(),
    text: z.string().max(500).optional(),
    accountNames: z.array(z.string().min(1).max(120)).default([]),
    archived: z.boolean().optional(),
    status: z.union([lifecycleStatus, z.literal("archived")]).optional(),
  })
  .transform((nudge): MarketNudgeItem => {
    const text = nudge.text?.trim() ?? "";
    return {
      id: nudge.id,
      title: (nudge.title?.trim() || text).slice(0, 120) || "Talking point",
      whyNow: nudge.whyNow?.trim() || text,
      accountAction: nudge.accountAction?.trim() || "",
      accountNames: nudge.accountNames,
      status: coerceStatus(nudge.status, nudge.archived),
    };
  });

const intelligenceBriefSchema = z
  .object({
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
    archived: z.boolean().optional(),
    status: z.union([lifecycleStatus, z.literal("archived")]).optional(),
  })
  .transform((brief): IntelligenceBrief => ({
    id: brief.id,
    title: brief.title,
    category: brief.category,
    month: brief.month,
    year: brief.year,
    description: brief.description,
    discoveryQuestions: brief.discoveryQuestions,
    updatedAt: brief.updatedAt,
    updatedLabel: brief.updatedLabel,
    status: coerceStatus(brief.status, brief.archived),
  }));

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

function mergeNudges(cms?: MarketNudgeItem[]): MarketNudgeItem[] {
  if (!cms?.length) return DEFAULT_SALES_MARKET_NUDGES_CONTENT.weeklyNudges;
  return cms;
}

function mergeBriefs(cms?: IntelligenceBrief[]): IntelligenceBrief[] {
  if (!cms?.length) return DEFAULT_SALES_MARKET_NUDGES_CONTENT.intelligenceBriefs;
  return cms;
}

function withStatusDefaults<T extends { status?: NudgeLifecycleStatus }>(items: T[]): T[] {
  return items.map((item) => ({ ...item, status: item.status ?? "active" }));
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
      weeklyNudges: withStatusDefaults(mergeNudges(parsed.data.weeklyNudges)),
      intelligenceBriefs: withStatusDefaults(mergeBriefs(parsed.data.intelligenceBriefs)),
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
    weeklyNudges: withStatusDefaults(mergeNudges(partial.weeklyNudges)),
    intelligenceBriefs: withStatusDefaults(mergeBriefs(partial.intelligenceBriefs)),
    briefCategories: resolveBriefCategories(partial.briefCategories, partial.intelligenceBriefs),
  };
}

/** Member-facing content — every lifecycle status is included so tabs can filter. */
export function filterActiveSalesMarketNudgesContent(
  content: SalesMarketNudgesContent
): SalesMarketNudgesContent {
  return content;
}
