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

/** Sales members cannot open Career-only playbook routes. Admins still can. */
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
  return isDashboardModuleVisible("Career", audience);
}
