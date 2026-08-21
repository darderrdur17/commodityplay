import type { BookmarkSource } from "@prisma/client";

import { PREP_LIBRARY_SEGMENTS } from "@/data/prep-library";

/** DOM id for a bookmarked prep library topic. */
export function prepTopicElementId(sourceId: string): string {
  return `prep-topic-${sourceId}`;
}

/** DOM id for a bookmarked market nudge or intelligence brief. */
export function marketNudgeElementId(sourceId: string): string {
  return `market-nudge-${sourceId}`;
}

export function getBookmarkHighlightId(sourceType: BookmarkSource, sourceId: string): string {
  return sourceType === "PREP_LIBRARY"
    ? prepTopicElementId(sourceId)
    : marketNudgeElementId(sourceId);
}

export function getBookmarkHref(sourceType: BookmarkSource, sourceId: string): string {
  const highlight = getBookmarkHighlightId(sourceType, sourceId);

  if (sourceType === "PREP_LIBRARY") {
    const anchor = PREP_LIBRARY_SEGMENTS.SALES.anchor;
    return `/dashboard/prep-library?highlight=${encodeURIComponent(highlight)}#${anchor}`;
  }

  return `/dashboard/sales-market-nudges?highlight=${encodeURIComponent(highlight)}`;
}

export const PREP_LIBRARY_SALES_HREF = `/dashboard/prep-library#${PREP_LIBRARY_SEGMENTS.SALES.anchor}`;
export const SALES_MARKET_NUDGES_HREF = "/dashboard/sales-market-nudges";

export const BOOKMARK_HIGHLIGHT_RING =
  "ring-2 ring-[#3280ff] ring-offset-2 shadow-md transition-shadow duration-300";
