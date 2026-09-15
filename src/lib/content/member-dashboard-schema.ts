import { z } from "zod";
import {
  DEFAULT_MEMBER_DASHBOARD_CONTENT,
  DEFAULT_UNIFIED_DASHBOARD_RESOURCE_CARDS,
  isDashboardModuleTrack,
  isSalesCatalogResourceSlug,
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
  title: z.string().max(120).optional(),
  description: z.string().max(500).optional(),
  track: z.enum(["Career", "Sales", "Both"]).optional(),
  cardKind: z.enum(["page", "file", "email-digest"]).optional(),
  deliverableKey: z.enum(["careerNavigationGuide", "salesEdgeNote", "industryGuideForSales"]).optional(),
  href: z.string().max(200).optional(),
  requiredTier: z.enum(["PRO", "ELITE"]).optional(),
  isPrepLibrary: z.boolean().optional(),
});

const salesResourceCardSchema = resourceCardSchema.extend({
  requiredTier: z.enum(["PRO", "ELITE"]).optional(),
  href: z.string().max(200).optional(),
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
  salesResourceCards: z.array(salesResourceCardSchema).optional(),
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

type ResourceCardCmsFields = Pick<DashboardResourceCardCopy, "slug"> &
  Partial<Pick<DashboardResourceCardCopy, "title" | "description" | "track">>;

function overlayResourceCard(
  def: DashboardResourceCardCopy,
  saved?: ResourceCardCmsFields
): DashboardResourceCardCopy {
  return {
    ...def,
    slug: def.slug,
    title: saved?.title?.trim() || def.title,
    description: saved?.description?.trim() || def.description,
    track: isDashboardModuleTrack(saved?.track) ? saved.track : def.track,
    cardKind: def.cardKind,
    deliverableKey: def.deliverableKey,
    href: def.href,
    requiredTier: def.requiredTier,
    isPrepLibrary: def.isPrepLibrary,
  };
}

function asSalesResourceCard(card: DashboardResourceCardCopy): DashboardSalesResourceCardCopy | null {
  if (!isSalesCatalogResourceSlug(card.slug) || !card.requiredTier || !card.href) return null;
  const deliverableKey =
    card.deliverableKey === "salesEdgeNote" || card.deliverableKey === "industryGuideForSales"
      ? card.deliverableKey
      : undefined;
  return {
    slug: card.slug,
    title: card.title,
    description: card.description,
    track: card.track,
    cardKind: card.cardKind,
    href: card.href,
    requiredTier: card.requiredTier,
    isPrepLibrary: card.isPrepLibrary,
    deliverableKey,
  };
}

/**
 * Unified catalog merge: CMS may edit title/description/track and reorder known slugs.
 * Product identity (href, cardKind, deliverable, requiredTier) stays catalog-owned.
 * Legacy `salesResourceCards` overlays are applied first so a later unified list wins.
 */
export function mergeResourceCards(
  cmsResourceCards?: ResourceCardCmsFields[],
  cmsSalesCards?: ResourceCardCmsFields[]
): DashboardResourceCardCopy[] {
  const catalog = DEFAULT_UNIFIED_DASHBOARD_RESOURCE_CARDS;
  const catalogBySlug = new Map(catalog.map((card) => [card.slug, card]));
  const overlays = new Map<string, ResourceCardCmsFields>();

  for (const card of cmsSalesCards ?? []) {
    if (card?.slug) overlays.set(card.slug, card);
  }
  for (const card of cmsResourceCards ?? []) {
    if (!card?.slug) continue;
    overlays.set(card.slug, { ...overlays.get(card.slug), ...card });
  }

  const seen = new Set<string>();
  const ordered: DashboardResourceCardCopy[] = [];
  const cmsOrder = [...(cmsResourceCards ?? []), ...(cmsSalesCards ?? [])].map((card) => card.slug);

  for (const slug of cmsOrder) {
    if (seen.has(slug)) continue;
    const def = catalogBySlug.get(slug);
    if (!def) continue;
    seen.add(slug);
    ordered.push(overlayResourceCard(def, overlays.get(slug)));
  }

  for (const def of catalog) {
    if (seen.has(def.slug)) continue;
    ordered.push(overlayResourceCard(def, overlays.get(def.slug)));
  }

  return ordered;
}

function deriveSalesResourceCards(cards: DashboardResourceCardCopy[]): DashboardSalesResourceCardCopy[] {
  return cards
    .map(asSalesResourceCard)
    .filter((card): card is DashboardSalesResourceCardCopy => card !== null);
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
    const resourceCards = mergeResourceCards(parsed.data.resourceCards, parsed.data.salesResourceCards);
    return {
      ...parsed.data,
      upgradeToPro: mergePromoBox(DEFAULT_MEMBER_DASHBOARD_CONTENT.upgradeToPro, parsed.data.upgradeToPro),
      upgradeToElite: mergePromoBox(
        DEFAULT_MEMBER_DASHBOARD_CONTENT.upgradeToElite,
        parsed.data.upgradeToElite
      ),
      resourceCards,
      salesResourceCards: deriveSalesResourceCards(resourceCards),
      salesDeliverables: normalizeSalesDashboardDeliverables(parsed.data.salesDeliverables),
    };
  }

  const partial = (payload ?? {}) as Partial<MemberDashboardContent>;
  const resourceCards = mergeResourceCards(partial.resourceCards, partial.salesResourceCards);
  return {
    starterPack: { ...DEFAULT_MEMBER_DASHBOARD_CONTENT.starterPack, ...partial.starterPack },
    upgradeToPro: mergePromoBox(DEFAULT_MEMBER_DASHBOARD_CONTENT.upgradeToPro, partial.upgradeToPro),
    upgradeToElite: mergePromoBox(
      DEFAULT_MEMBER_DASHBOARD_CONTENT.upgradeToElite,
      partial.upgradeToElite
    ),
    resourceCards,
    salesResourceCards: deriveSalesResourceCards(resourceCards),
    salesDeliverables: normalizeSalesDashboardDeliverables(
      partial.salesDeliverables ?? DEFAULT_SALES_DASHBOARD_DELIVERABLES
    ),
  };
}
