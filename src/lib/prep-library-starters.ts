import type { PrepCategory, Track } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  PREP_LIBRARY_EXAMPLE_TOPICS,
  type PrepLibraryTrack,
} from "@/data/prep-library";

const CATEGORY_TO_PRISMA: Record<string, PrepCategory> = {
  "Market mechanics": "MARKET_MECHANICS",
  "Current event": "CURRENT_EVENT",
  "Risk & pricing": "RISK_PRICING",
  Logistics: "LOGISTICS",
  Other: "OTHER",
};

/** Pre-filled fake account names removed from starter templates. */
const STALE_STARTER_ACCOUNT_NAMES = new Set([
  "Meridian Energy",
  "Meridian Energy interview",
  "Northbridge Gas",
  "Solace Trade Finance",
  "Anchorpoint Trading",
]);

export function starterTopicId(userId: string, templateId: string) {
  return `${userId}-${templateId}`;
}

export function isStarterTopicId(userId: string, topicId: string) {
  return topicId.startsWith(`${userId}-example-`);
}

function starterDataFromTemplate(
  userId: string,
  track: PrepLibraryTrack,
  template: (typeof PREP_LIBRARY_EXAMPLE_TOPICS)[PrepLibraryTrack][number]
) {
  return {
    id: starterTopicId(userId, template.id),
    userId,
    track: track as Track,
    title: template.title,
    category: CATEGORY_TO_PRISMA[template.category] ?? ("OTHER" as PrepCategory),
    keyPoints: template.keyPoints,
    source: template.source ?? null,
    prepStatus: template.prepStatus,
    usedInNote: template.usedInNote ?? null,
    canUseFor: template.canUseFor ?? null,
    createdAt: template.createdAt,
  };
}

function hasStaleStarterAccountLink(canUseFor: string | null | undefined) {
  if (!canUseFor?.trim()) return false;
  return STALE_STARTER_ACCOUNT_NAMES.has(canUseFor.trim());
}

/** Refresh starter rows and clear outdated fake account links (Meridian, etc.). */
export async function syncStarterExampleTopics(
  userId: string,
  track: PrepLibraryTrack
): Promise<void> {
  const templates = PREP_LIBRARY_EXAMPLE_TOPICS[track];
  for (const template of templates) {
    const id = starterTopicId(userId, template.id);
    const existing = await prisma.talkingPoint.findUnique({
      where: { id },
      select: { id: true, canUseFor: true },
    });
    if (!existing) continue;

    const clearStaleLink = hasStaleStarterAccountLink(existing.canUseFor);

    await prisma.talkingPoint.update({
      where: { id },
      data: {
        title: template.title,
        category: CATEGORY_TO_PRISMA[template.category] ?? "OTHER",
        keyPoints: template.keyPoints,
        source: template.source ?? null,
        ...(clearStaleLink
          ? {
              canUseFor: null,
              usedInNote: null,
              prepStatus: template.prepStatus,
            }
          : {}),
      },
    });
  }
}

/** Seed deletable example topics when a user has none for this track. */
export async function ensureStarterTopics(userId: string, track: PrepLibraryTrack): Promise<void> {
  const count = await prisma.talkingPoint.count({
    where: { userId, track: track as Track },
  });

  if (count === 0) {
    const templates = PREP_LIBRARY_EXAMPLE_TOPICS[track];
    for (const template of templates) {
      const data = starterDataFromTemplate(userId, track, template);
      await prisma.talkingPoint.create({ data }).catch(() => {
        // Ignore race duplicates if two requests seed at once
      });
    }
    return;
  }

  await syncStarterExampleTopics(userId, track);
}

export function withStarterFlag<T extends { id: string }>(
  userId: string,
  row: T
): T & { isStarterExample: boolean } {
  return {
    ...row,
    isStarterExample: isStarterTopicId(userId, row.id),
  };
}
