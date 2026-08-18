import { z } from "zod";
import {
  DEFAULT_DASHBOARD_RESOURCE_CARDS,
  DEFAULT_MEMBER_DASHBOARD_CONTENT,
  type DashboardResourceCardCopy,
  type MemberDashboardContent,
} from "@/data/member-dashboard";

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

export const memberDashboardSchema = z.object({
  starterPack: promoBoxSchema,
  upgradeToPro: promoBoxSchema,
  upgradeToElite: promoBoxSchema,
  resourceCards: z.array(resourceCardSchema).min(1),
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

export function normalizeMemberDashboardPayload(payload: unknown): MemberDashboardContent {
  const parsed = parseMemberDashboardPayload(payload);
  if (parsed.success) {
    return {
      ...parsed.data,
      resourceCards: mergeResourceCards(parsed.data.resourceCards),
    };
  }

  const partial = (payload ?? {}) as Partial<MemberDashboardContent>;
  return {
    starterPack: { ...DEFAULT_MEMBER_DASHBOARD_CONTENT.starterPack, ...partial.starterPack },
    upgradeToPro: { ...DEFAULT_MEMBER_DASHBOARD_CONTENT.upgradeToPro, ...partial.upgradeToPro },
    upgradeToElite: { ...DEFAULT_MEMBER_DASHBOARD_CONTENT.upgradeToElite, ...partial.upgradeToElite },
    resourceCards: mergeResourceCards(partial.resourceCards),
  };
}
