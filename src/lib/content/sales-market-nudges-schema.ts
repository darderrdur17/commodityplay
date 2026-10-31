import { z } from "zod";
import {
  DEFAULT_SALES_MARKET_NUDGES_CONTENT,
  resolveBriefCategories,
  type DiscoveryPoint,
  type IntelligenceBrief,
  type MarketNudgeItem,
  type NudgeLifecycleStatus,
  type SalesMarketNudgesContent,
} from "@/data/sales-market-nudges";

const lifecycleStatus = z.enum(["active", "expired", "archive"]);

/**
 * Coerce one stored discovery row into the Ask / Listen for / Offer shape.
 *
 * Briefs authored before the table existed stored a flat `string[]`, so a plain
 * string becomes a row with only `ask` filled.
 *
 * ⚠️ This must NOT trim, filter, or otherwise reshape anything. The admin editor
 * re-runs `normalizeSalesMarketNudgesPayload` on every render, so whatever this
 * returns is written straight back into the field the user is typing in —
 * trimming would swallow the space bar, and dropping blank rows would delete a
 * newly added row the instant it appeared. Blank rows are skipped at render time
 * instead (`visibleDiscoveryRows`).
 */
function coerceDiscoveryPoint(value: unknown): DiscoveryPoint {
  if (typeof value === "string") return { ask: value, listenFor: "", offer: "" };
  if (value && typeof value === "object") {
    const row = value as Record<string, unknown>;
    return {
      ask: typeof row.ask === "string" ? row.ask : "",
      listenFor: typeof row.listenFor === "string" ? row.listenFor : "",
      offer: typeof row.offer === "string" ? row.offer : "",
    };
  }
  return { ask: "", listenFor: "", offer: "" };
}

export function coerceDiscoveryQuestions(value: unknown): DiscoveryPoint[] {
  return Array.isArray(value) ? value.map(coerceDiscoveryPoint) : [];
}

const discoveryPointSchema = z.object({
  ask: z.string().max(600).default(""),
  listenFor: z.string().max(600).default(""),
  offer: z.string().max(600).default(""),
});

/** A discovery row is either the current object or a legacy bare question. */
const discoveryQuestionSchema = z
  .union([z.string().max(600), discoveryPointSchema])
  .transform(coerceDiscoveryPoint);

/**
 * The green weekly-nudge card was headed "This Week — Talking Points" until the
 * owner renamed it on 12 Oct 2026.
 *
 * CMS values beat repo defaults, so the live `sales-market-nudges` row still
 * carries the retired string — editing
 * `DEFAULT_SALES_MARKET_NUDGES_CONTENT.weeklyHeading` alone would never reach the
 * member page. Rewrite it here, the same way `normalizeFooterLink` repairs its
 * own stale `/faq` href.
 *
 * Idempotent by design: only the retired heading (in any dash flavour) is
 * touched, so a custom heading the owner sets later is left alone.
 */
function normalizeWeeklyHeading(stored: string | undefined): string {
  const trimmed = stored?.trim();
  const isRetired = trimmed
    ? trimmed.replace(/[\u2010-\u2015-]/g, "-").toLowerCase() === "this week - talking points"
    : false;
  if (!trimmed || isRetired) {
    return DEFAULT_SALES_MARKET_NUDGES_CONTENT.weeklyHeading;
  }
  return trimmed;
}

function coerceStatus(status: unknown, archived?: boolean): NudgeLifecycleStatus {
  if (status === "expired" || status === "archive" || status === "active") return status;
  if (status === "archived") return "archive";
  if (archived) return "archive";
  return "active";
}

/**
 * The "Now" field cap (owner request, Frances — she hit the old 500 and asked for
 * room to write bulleted context). `whyNow` and its legacy alias `text` are capped
 * at 2000 characters.
 *
 * ⚠️ The admin textarea's `maxLength={2000}` MUST stay in step with these two caps.
 * If the textarea allowed more than the schema accepts, a long value would fail
 * validation, `parseSalesMarketNudgesPayload` would return `success: false`, and
 * `normalizeSalesMarketNudgesPayload` would silently fall through to its `partial`
 * branch — so Save would look like a no-op instead of reporting an error.
 *
 * The legacy alias gets the same cap on purpose: a stored row holding a long `text`
 * would otherwise fail the whole payload and drag every other field down with it.
 *
 * `accountAction` keeps its original 500 — out of scope for this request.
 */
const marketNudgeSchema = z
  .object({
    id: z.string().min(1).max(80),
    title: z.string().max(120).optional(),
    whyNow: z.string().max(2000).optional(),
    accountAction: z.string().max(500).optional(),
    text: z.string().max(2000).optional(),
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
    discoveryQuestions: z.array(discoveryQuestionSchema).max(12).default([]),
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

/**
 * A brief that failed full validation still has to stay editable, so its
 * discovery rows are coerced into the current shape here. Without this a legacy
 * `string[]` would be spread into a character map by `withStatusDefaults`.
 */
function normalizeBriefDiscovery(brief: IntelligenceBrief): IntelligenceBrief {
  return {
    ...brief,
    discoveryQuestions: coerceDiscoveryQuestions(
      (brief as { discoveryQuestions?: unknown }).discoveryQuestions
    ),
  };
}

function mergeBriefs(cms?: IntelligenceBrief[]): IntelligenceBrief[] {
  if (!cms?.length) return DEFAULT_SALES_MARKET_NUDGES_CONTENT.intelligenceBriefs;
  return cms.map(normalizeBriefDiscovery);
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
      weeklyHeading: normalizeWeeklyHeading(parsed.data.weeklyHeading),
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
    weeklyHeading: normalizeWeeklyHeading(partial.weeklyHeading),
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
