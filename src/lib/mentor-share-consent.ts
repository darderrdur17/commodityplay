/** Member consent at question submit (DB column: isPublic). */
export function parseMemberShareOptIn(body: {
  memberShareOptIn?: boolean;
  isPublic?: boolean;
}): boolean {
  if (typeof body.memberShareOptIn === "boolean") return body.memberShareOptIn;
  if (typeof body.isPublic === "boolean") return body.isPublic;
  return false;
}

export type DeskChannelReviewStatus = "none" | "published" | "rejected";

/** Both parties opted in — eligible for Desk Channel admin review. */
export function isDeskChannelShareCandidate(
  memberShareOptIn: boolean,
  mentorShareOptIn: boolean
): boolean {
  return memberShareOptIn && mentorShareOptIn;
}

/** Answered + dual consent + not yet published or rejected. */
export function isDeskChannelQueueItem(q: {
  isAnswered: boolean;
  memberShareOptIn: boolean;
  mentorShareOptIn: boolean;
  deskChannelStatus?: string | null;
}): boolean {
  return (
    q.isAnswered &&
    isDeskChannelShareCandidate(q.memberShareOptIn, q.mentorShareOptIn) &&
    (q.deskChannelStatus ?? "none") === "none"
  );
}

export const MENTOR_SEGMENT_TO_DESK_CATEGORY: Record<
  string,
  "trading" | "ops" | "risk" | "tools" | "career"
> = {
  "physical-trading": "trading",
  finance: "risk",
  analytics: "tools",
  operations: "ops",
  sales: "career",
  "sales-advisory": "career",
};
