export const MEMBER_NUDGE_STATUSES = ["ACTIVE", "EXPIRED", "ARCHIVED"] as const;
export type MemberNudgeStatus = (typeof MEMBER_NUDGE_STATUSES)[number];

export const MARKET_NUDGE_KINDS = ["WEEKLY_NUDGE", "INTELLIGENCE_BRIEF"] as const;
export type MarketNudgeKind = (typeof MARKET_NUDGE_KINDS)[number];

export const MEMBER_NUDGE_STATUS_LABELS: Record<MemberNudgeStatus, string> = {
  ACTIVE: "Active",
  EXPIRED: "Expired",
  ARCHIVED: "Archive",
};

export function isMemberNudgeStatus(value: string): value is MemberNudgeStatus {
  return (MEMBER_NUDGE_STATUSES as readonly string[]).includes(value);
}

export function isMarketNudgeKind(value: string): value is MarketNudgeKind {
  return (MARKET_NUDGE_KINDS as readonly string[]).includes(value);
}

export function statusKey(kind: MarketNudgeKind, sourceId: string) {
  return `${kind}:${sourceId}`;
}
