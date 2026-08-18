import { z } from "zod";
import {
  DEFAULT_DASHBOARD_RESOURCE_CARDS,
  DEFAULT_MEMBER_DASHBOARD_CONTENT,
  DEFAULT_SALES_DASHBOARD_RESOURCE_CARDS,
  type DashboardResourceCardCopy,
  type DashboardSalesResourceCardCopy,
  type MemberDashboardContent,
} from "@/data/member-dashboard";
import { UPGRADE_TO_ACCESS } from "@/data/pricing-shared";
import {
  DEFAULT_SALES_DASHBOARD_DELIVERABLES,
  normalizeSalesDashboardDeliverables,
} from "@/lib/content/sales-dashboard-deliverables";

const promoBoxSchema = z.object({
  badge: z.string().min(1).max(80),
  headline: z.string().min(1).max(300),
  description: z.string().min(1).max(500),
  cta: z.string().min(1).max(80),
  footerNote: z.string().max(300).optional(),
});

const resourceCardSchema = z.object({
  slug: z.string().min(1).max(80),
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(500),
});

const salesResourceCardSchema = resourceCardSchema.extend({
  requiredTier: z.enum(["PRO", "ELITE"]),
  href: z.string().min(1).max(200),
  deliverableKey: z.enum(["salesEdgeNote", "industryGuideForSales"]).optional(),
});

const guideAttachmentSchema = z
  .object({
    label: z.string(),
    fileName: z.string(),
    assetId: z.string(),
    mimeType: z.string(),
  })
  .nullable();

const salesDeliverablesSchema = z.object({
  salesEdgeNote: guideAttachmentSchema.optional(),
  industryGuideForSales: guideAttachmentSchema.optional(),
});

export const memberDashboardSchema = z.object({
  starterPack: promoBoxSchema,
  upgradeToPro: promoBoxSchema,
  upgradeToElite: promoBoxSchema,
  resourceCards: z.array(resourceCardSchema).min(1),
  salesResourceCards: z.array(salesResourceCardSchema).min(1).optional(),
  salesDeliverables: salesDeliverablesSchema.optional(),
});

export function parseMemberDashboardPayload(payload: unknown) {
  return memberDashboardSchema.safeParse(payload);
}

export function formatMemberDashboardValidationErrors(
  result: ReturnType<typeof parseMemberDashboardPayload>
) {
  if (result.success) return null;
  return result.error.issues
    .slice(0, 8)
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
}

function mergeResourceCards(cms?: DashboardResourceCardCopy[]): DashboardResourceCardCopy[] {
  const bySlug = new Map((cms ?? []).map((c) => [c.slug, c]));
  return DEFAULT_DASHBOARD_RESOURCE_CARDS.map((def) => {
    const saved = bySlug.get(def.slug);
    if (!saved?.description?.trim()) return def;
    return {
      slug: def.slug,
      title: saved.title?.trim() || def.title,
      description: saved.description.trim(),
    };
  });
}

function mergeSalesResourceCards(
  cms?: DashboardSalesResourceCardCopy[]
): DashboardSalesResourceCardCopy[] {
  const bySlug = new Map((cms ?? []).map((c) => [c.slug, c]));
  return DEFAULT_SALES_DASHBOARD_RESOURCE_CARDS.map((def) => {
    const saved = bySlug.get(def.slug);
    if (!saved) return def;
    return {
      ...def,
      title: saved.title?.trim() || def.title,
      description: saved.description?.trim() || def.description,
      href: saved.href?.trim() || def.href,
      requiredTier: saved.requiredTier ?? def.requiredTier,
      deliverableKey: saved.deliverableKey ?? def.deliverableKey,
    };
  });
}

function mergePromoBox(
  defaults: MemberDashboardContent["upgradeToPro"],
  saved?: Partial<MemberDashboardContent["upgradeToPro"]>
) {
  return {
    ...defaults,
    ...saved,
    cta: UPGRADE_TO_ACCESS,
  };
}

export function normalizeMemberDashboardPayload(payload: unknown): MemberDashboardContent {
  const parsed = parseMemberDashboardPayload(payload);
  if (parsed.success) {
    return {
      ...parsed.data,
      upgradeToPro: mergePromoBox(DEFAULT_MEMBER_DASHBOARD_CONTENT.upgradeToPro, parsed.data.upgradeToPro),
      upgradeToElite: mergePromoBox(
        DEFAULT_MEMBER_DASHBOARD_CONTENT.upgradeToElite,
        parsed.data.upgradeToElite
      ),
      resourceCards: mergeResourceCards(parsed.data.resourceCards),
      salesResourceCards: mergeSalesResourceCards(parsed.data.salesResourceCards),
      salesDeliverables: normalizeSalesDashboardDeliverables(parsed.data.salesDeliverables),
    };
  }

  const partial = (payload ?? {}) as Partial<MemberDashboardContent>;
  return {
    starterPack: { ...DEFAULT_MEMBER_DASHBOARD_CONTENT.starterPack, ...partial.starterPack },
    upgradeToPro: mergePromoBox(DEFAULT_MEMBER_DASHBOARD_CONTENT.upgradeToPro, partial.upgradeToPro),
    upgradeToElite: mergePromoBox(
      DEFAULT_MEMBER_DASHBOARD_CONTENT.upgradeToElite,
      partial.upgradeToElite
    ),
    resourceCards: mergeResourceCards(partial.resourceCards),
    salesResourceCards: mergeSalesResourceCards(partial.salesResourceCards),
    salesDeliverables: normalizeSalesDashboardDeliverables(
      partial.salesDeliverables ?? DEFAULT_SALES_DASHBOARD_DELIVERABLES
    ),
  };
}
