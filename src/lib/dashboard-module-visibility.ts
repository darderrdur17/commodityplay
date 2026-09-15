import type { DashboardModuleTrack } from "@/data/member-dashboard";

/** Who the dashboard is currently rendering for. */
export type DashboardAudience = "CAREER" | "SALES" | "ALL";

/**
 * Career members: Career + Both (never Sales-only).
 * Sales members: Sales + Both (never Career-only).
 * Admin unfiltered preview: everything.
 */
export function isDashboardModuleVisible(
  moduleTrack: DashboardModuleTrack,
  audience: DashboardAudience
): boolean {
  if (audience === "ALL") return true;
  if (moduleTrack === "Both") return true;
  return audience === "CAREER" ? moduleTrack === "Career" : moduleTrack === "Sales";
}

export function filterByDashboardAudience<T extends { track: DashboardModuleTrack }>(
  items: readonly T[],
  audience: DashboardAudience
): T[] {
  return items.filter((item) => isDashboardModuleVisible(item.track, audience));
}

/**
 * Stable reorder: fully accessible cards first, then locked / coming-soon.
 * Does not change which cards are visible — only order among already-visible items.
 */
export function partitionAccessibleFirst<T>(
  items: readonly T[],
  isAccessible: (item: T) => boolean
): T[] {
  const accessible: T[] = [];
  const locked: T[] = [];
  for (const item of items) {
    (isAccessible(item) ? accessible : locked).push(item);
  }
  return [...accessible, ...locked];
}

/** Unlocked page/file cards are accessible; "Coming soon" is not fully openable. */
export function isDashboardCardAccessible(opts: {
  unlocked: boolean;
  pendingLabel?: string;
}): boolean {
  return opts.unlocked && !opts.pendingLabel;
}

export function dashboardAudienceFromPreview(opts: {
  isAdmin: boolean;
  isMentorUser: boolean;
  isPreviewActive: boolean;
  effectiveTrack: string;
}): DashboardAudience {
  if (opts.isAdmin && !opts.isMentorUser && !opts.isPreviewActive) return "ALL";
  const track = opts.effectiveTrack.toUpperCase();
  if (track === "SALES") return "SALES";
  if (track === "BOTH" || track === "ALL") return "ALL";
  return "CAREER";
}

/**
 * Whether to show the Career / Sales / Both pill on a dashboard module card.
 * Admin unfiltered (ALL) view: always show for CMS validation.
 * Member (or admin member preview): only "Both" on shared modules.
 */
export function shouldShowTrackBadge(opts: {
  trackLabel: DashboardModuleTrack;
  memberTrack: "CAREER" | "SALES" | null;
  isAdminUnfiltered: boolean;
}): boolean {
  if (opts.isAdminUnfiltered) return true;
  if (opts.trackLabel === "Both") return true;
  if (opts.memberTrack === "CAREER" && opts.trackLabel === "Career") return false;
  if (opts.memberTrack === "SALES" && opts.trackLabel === "Sales") return false;
  return false;
}

/** Full Playbook is Both-track — Career and Sales members can open playbook routes. */
export function memberMayAccessCareerPlaybook(opts: {
  track: string;
  role?: string | null;
}): boolean {
  const audience: DashboardAudience =
    opts.role?.toUpperCase() === "ADMIN"
      ? "ALL"
      : opts.track.toUpperCase() === "SALES"
        ? "SALES"
        : "CAREER";
  return isDashboardModuleVisible("Both", audience);
}
