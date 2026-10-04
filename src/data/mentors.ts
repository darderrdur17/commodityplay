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
  /** Admin-only LinkedIn profile URL. Never sent to any public-facing surface. */
  linkedIn?: string;
  /** Admin-only current location. Never sent to any public-facing surface. */
  location?: string;
  /** Admin-only current/most recent role. Never sent to any public-facing surface. */
  role?: string;
  /** Admin-only primary commodity/desk. Never sent to any public-facing surface. */
  commodityDesk?: string;
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
  linkedIn?: string;
  location?: string;
  role?: string;
  commodityDesk?: string;
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
  /**
   * Tombstone. When true this profile is hidden from every surface (admin Mentors
   * tab, Mentor Connect, {mentorCount} stats). Set by the admin "Delete" action.
   * Kept on the record so a seeded mentors.json profile can be suppressed without
   * editing code, and so a delete is reversible (set back to false / remove the flag).
   */
  deleted?: boolean;
  createdAt?: string;
}

export interface MentorOverridesPayload {
  overrides: MentorOverride[];
  /** Mentor ids in display order. Unknown / omitted ids keep their natural (stable) position. */
  order?: string[];
}

/** Persist overrides without dropping `order`, and never keep tombstoned ids in the order list. */
export function buildMentorOverridesPayload(
  overrides: MentorOverride[],
  order?: string[]
): MentorOverridesPayload {
  const deleted = new Set(overrides.filter((o) => o.deleted).map((o) => o.id));
  return {
    overrides,
    order: (order ?? []).filter((id) => !deleted.has(id)),
  };
}

/**
 * Keys a tombstone may carry that hold **no profile content**.
 *
 * A tombstone whose keys are all in this set was minted purely to suppress a
 * profile (e.g. a seeded `mentors.json` row) and is **stripped** on restore, so the
 * underlying profile cleanly falls back to its defaults and leaves no phantom
 * override row. A tombstone carrying any *other* key (an app-created mentor, or a
 * seeded one the admin had edited before deleting) is instead un-flagged so the
 * earlier edits survive the round trip.
 *
 * Register any new tombstone metadata key here. An unregistered key would make a
 * pure-suppression tombstone look like an edited profile and silently flip restore
 * from "strip" to "unflag".
 */
export const TOMBSTONE_METADATA_KEYS = ["id", "deleted", "updatedAt"] as const;

/** Public-safe mentor profile — strips admin-only identity/review fields before Mentor Connect. */
export type PublicMentorProfile = Pick<
  MentorProfile,
  "id" | "years" | "headline" | "bio" | "tags" | "sampleReply" | "track"
> & {
  /** Unlocked reward-rung label only — never reward/cash copy, never a real name. */
  recognitionLabel?: string | null;
};

/** Strip admin-only fields before rendering on Mentor Connect or any public surface. */
export function toPublicMentorProfile(
  m: MentorProfile,
  recognitionLabel?: string | null
): PublicMentorProfile {
  return {
    id: m.id,
    years: m.years,
    headline: m.headline,
    bio: m.bio,
    tags: m.tags,
    sampleReply: m.sampleReply,
    track: m.track,
    recognitionLabel: recognitionLabel ?? null,
  };
}

export interface MentorSegment {
  id: string;
  num: string;
  title: string;
  blurb: string;
  mentors: MentorProfile[];
}

export type PublishedMentorSegment = Omit<MentorSegment, "mentors"> & {
  mentors: PublicMentorProfile[];
};

export const MENTOR_SEGMENTS: MentorSegment[] = mentorsJson as MentorSegment[];
export const MENTOR_COUNT = MENTOR_SEGMENTS.reduce((n, s) => n + s.mentors.length, 0);

/** Readable, collision-resistant id for a brand-new mentor override (self-submitted application or admin-added mentor). */
export function generateMentorId(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `NEW-${stamp}-${rand}`;
}

/**
 * Valid shape for an admin-editable anonymous mentor id.
 *
 * 3–40 chars: uppercase letters, digits and hyphens; must start with a letter or
 * digit. Deliberately permissive rather than forcing a `NEW-` prefix — the operator
 * may want a friendlier public handle, and uniqueness (checked server-side against
 * seeded ids + other overrides) is what actually protects correctness.
 *
 * To enforce brand consistency instead, tighten to /^NEW-[A-Z0-9-]{2,36}$/.
 */
export const MENTOR_ID_REGEX = /^[A-Z0-9][A-Z0-9-]{2,39}$/;

/** Trim + uppercase an operator-typed mentor id so comparisons are case-insensitive. */
export function normalizeMentorId(raw: string): string {
  return raw.trim().toUpperCase();
}

/** True when `raw` (after normalization) is a valid anonymous mentor id. */
export function isValidMentorId(raw: string): boolean {
  return MENTOR_ID_REGEX.test(normalizeMentorId(raw));
}
