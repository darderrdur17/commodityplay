/**
 * Member consent at question submit.
 *
 * Accepts ONLY the `memberShareOptIn` spelling. A legacy `isPublic` alias used to
 * be honoured here (and in the API schema), inherited from the old column name.
 * That alias was dangerous: this field is one half of a two-party consent model
 * sitting next to `mentorShareOptIn`, and an unrecognised-but-accepted `isPublic`
 * key let a question the member never agreed to share be published to the desk
 * channel. Unknown keys now default to "not shared", which is the safe direction.
 */
export function parseMemberShareOptIn(body: { memberShareOptIn?: boolean }): boolean {
  return body.memberShareOptIn === true;
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
