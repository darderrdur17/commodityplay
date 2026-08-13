import mentorsJson from "./mentors.json";

export type MentorTrack = "career" | "sales" | "both";

/**
 * Review status for a mentor profile. `"active"` is the default for static/seeded
 * profiles and anything the admin has reviewed. `"pending"` marks a brand-new,
 * self-submitted application (via the public /mentor-apply form) awaiting admin review.
 */
export type MentorStatus = "pending" | "active";

/** Pseudo-segment id used to group brand-new applications that haven't been assigned
 * a real segment yet. Only ever surfaces via `resolveMentorSegments()` (admin Mentors
 * tab) — never present in the static `mentors.json` defaults, so it can never reach
 * any public-facing page. */
export const UNASSIGNED_SEGMENT_ID = "unassigned";

export interface MentorProfile {
  id: string;
  years: number;
  headline: string;
  bio: string;
  tags: string[];
  sampleReply: string;
  /**
   * Admin-only, internal reference name for the real person behind this anonymized
   * mentor ID. Sourced from the "mentors" CMS override module — never present on the
   * static defaults, and must never be sent to any public-facing surface.
   */
  name?: string;
  /** Admin-only contact email for the real mentor. Never sent to any public-facing surface. */
  email?: string;
  /** Admin-only company/employer of the real mentor. Never sent to any public-facing surface. */
  company?: string;
  /** Which track(s) this mentor profile applies to. Defaults to "both" for legacy profiles. */
  track?: MentorTrack;
  /** Admin-only review status — never present on static defaults, never sent publicly. */
  status?: MentorStatus;
  /** True for brand-new (self-submitted or admin-added) entries not in the static defaults. Never present on static defaults, never sent publicly. */
  isNew?: boolean;
}

/**
 * Admin-editable override for a single mentor profile, persisted in the "mentors" CMS
 * module. An override either (a) edits an existing static `mentors.json` profile by
 * matching `id`, or (b) — when `isNew` is set — represents a brand-new, self-submitted
 * or admin-created mentor that doesn't exist in the static defaults at all. For (b),
 * `headline`/`years`/`tags`/`track` are effectively required (the applicant fills them
 * in) even though the type keeps them optional for shape-compatibility with (a).
 */
export interface MentorOverride {
  id: string;
  headline?: string;
  years?: number;
  tags?: string[];
  name?: string;
  email?: string;
  company?: string;
  track?: MentorTrack;
  bio?: string;
  sampleReply?: string;
  updatedAt?: string;
  /** True for brand-new entries not present in the static mentors.json (self-submitted applications or admin-added mentors). */
  isNew?: boolean;
  /** Segment this new entry belongs to (a real `MentorSegment.id`, or `UNASSIGNED_SEGMENT_ID`). Only meaningful when `isNew` is true — overrides of static profiles always keep their static segment. */
  segmentId?: string;
  /** Review status. Defaults to `"pending"` for new self-submitted applications, `"active"` otherwise. */
  status?: MentorStatus;
  createdAt?: string;
}

export interface MentorOverridesPayload {
  overrides: MentorOverride[];
}

export interface MentorSegment {
  id: string;
  num: string;
  title: string;
  blurb: string;
  mentors: MentorProfile[];
}

export const MENTOR_SEGMENTS: MentorSegment[] = mentorsJson as MentorSegment[];
export const MENTOR_COUNT = MENTOR_SEGMENTS.reduce((n, s) => n + s.mentors.length, 0);

/** Readable, collision-resistant id for a brand-new mentor override (self-submitted application or admin-added mentor). */
export function generateMentorId(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `NEW-${stamp}-${rand}`;
}
