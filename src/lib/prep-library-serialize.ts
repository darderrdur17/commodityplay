import type { PrepCategory, Track } from "@prisma/client";
import { withStarterFlag } from "@/lib/prep-library-starters";
import type { PrepCategoryEnum } from "@/data/prep-library";

export const CATEGORY_TO_PRISMA: Record<string, PrepCategory> = {
  "Market mechanics": "MARKET_MECHANICS",
  "Current event": "CURRENT_EVENT",
  "Risk & pricing": "RISK_PRICING",
  Logistics: "LOGISTICS",
  Other: "OTHER",
};

export const CATEGORY_FROM_PRISMA: Record<PrepCategory, PrepCategoryEnum> = {
  MARKET_MECHANICS: "Market mechanics",
  CURRENT_EVENT: "Current event",
  RISK_PRICING: "Risk & pricing",
  LOGISTICS: "Logistics",
  OTHER: "Other",
};

export type TalkingPointRow = {
  id: string;
  userId: string;
  track: Track;
  createdAt: Date;
  title: string;
  category: PrepCategory;
  keyPoints: string[];
  source: string | null;
  prepStatus: string;
  usedInNote: string | null;
  canUseFor: string | null;
};

export function serializeTalkingPoint(userId: string, r: TalkingPointRow) {
  return withStarterFlag(userId, {
    id: r.id,
    userId: r.userId,
    track: r.track,
    createdAt: r.createdAt,
    title: r.title,
    category: CATEGORY_FROM_PRISMA[r.category],
    keyPoints: r.keyPoints,
    source: r.source ?? undefined,
    prepStatus: r.prepStatus,
    usedInNote: r.usedInNote ?? undefined,
    canUseFor: r.canUseFor ?? undefined,
  });
}
