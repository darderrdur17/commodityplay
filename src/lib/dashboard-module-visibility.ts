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

export function dashboardAudienceFromPreview(opts: {
  isAdmin: boolean;
  isMentorUser: boolean;
  isPreviewActive: boolean;
  effectiveTrack: string;
}): DashboardAudience {
  if (opts.isAdmin && !opts.isMentorUser && !opts.isPreviewActive) return "ALL";
  return opts.effectiveTrack.toUpperCase() === "SALES" ? "SALES" : "CAREER";
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
