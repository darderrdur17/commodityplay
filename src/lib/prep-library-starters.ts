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

export function starterTopicId(userId: string, templateId: string) {
  return `${userId}-${templateId}`;
}

export function isStarterTopicId(userId: string, topicId: string) {
  return topicId.startsWith(`${userId}-example-`);
}

/** Seed deletable example topics when a user has none for this track. */
export async function ensureStarterTopics(userId: string, track: PrepLibraryTrack): Promise<void> {
  const count = await prisma.talkingPoint.count({
    where: { userId, track: track as Track },
  });
  if (count > 0) return;

  const templates = PREP_LIBRARY_EXAMPLE_TOPICS[track];
  for (const template of templates) {
    const category = CATEGORY_TO_PRISMA[template.category] ?? "OTHER";

    await prisma.talkingPoint
      .create({
        data: {
          id: starterTopicId(userId, template.id),
          userId,
          track: track as Track,
          title: template.title,
          category,
          keyPoints: template.keyPoints,
          source: template.source ?? null,
          prepStatus: template.prepStatus,
          usedInNote: template.usedInNote ?? null,
          canUseFor: template.canUseFor ?? null,
          createdAt: template.createdAt,
        },
      })
      .catch(() => {
        // Ignore race duplicates if two requests seed at once
      });
  }
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
