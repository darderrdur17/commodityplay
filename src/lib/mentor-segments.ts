import type { PublishedMentorSegment, PublicMentorProfile } from "@/data/mentors";

const SALES_ONLY_SEGMENT_ID = "sales-advisory";

function mentorVisibleForTrack(mentor: PublicMentorProfile, track: "CAREER" | "SALES"): boolean {
  const mentorTrack = mentor.track ?? "both";
  if (mentorTrack === "both") return true;
  return mentorTrack === track.toLowerCase();
}

/**
 * Filter mentor segments and profiles for a member's track.
 * Sales Advisory is hidden from Career track; sales-only mentors are excluded on Career.
 */
export function filterMentorSegmentsForTrack(
  segments: PublishedMentorSegment[],
  track: "CAREER" | "SALES"
): PublishedMentorSegment[] {
  return segments
    .filter((seg) => track === "SALES" || seg.id !== SALES_ONLY_SEGMENT_ID)
    .map((seg) => ({
      ...seg,
      mentors: seg.mentors.filter((m) => mentorVisibleForTrack(m, track)),
    }))
    .filter((seg) => seg.mentors.length > 0);
}

export function isSalesOnlyMentorSegment(segmentId: string): boolean {
  return segmentId === SALES_ONLY_SEGMENT_ID;
}

export function apiSegmentAllowedForTrack(
  segment: string,
  track: "CAREER" | "SALES"
): boolean {
  if (segment === "sales-advisory") return track === "SALES";
  return true;
}
