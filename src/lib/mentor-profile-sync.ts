import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getContentModulePayload, updateContentModule } from "@/lib/content/repository";
import { incrementUserTokenVersion } from "@/lib/mobile-auth";
import type { MentorOverride, MentorOverridesPayload } from "@/data/mentors";
import { buildMentorOverridesPayload } from "@/data/mentors";

export type MentorLiveContact = {
  email: string;
  company: string | null;
};

/**
 * Admin-facing mentor access state for a profile.
 *
 * - `"active"` — a linked login account currently has `isMentor: true`.
 * - `"revoked"` — a linked account had access but it was revoked (`mentorRevokedAt` set).
 * - `"none"` — no account is linked to this profile id.
 */
export type MentorAccessState = "active" | "revoked" | "none";

/**
 * Access state keyed by mentor profile id, for the admin mentor list.
 *
 * Deliberately does NOT filter on `isMentor: true` (unlike
 * {@link getMentorLiveContactsByProfileId}): a revoked mentor has `isMentor: false`
 * but must still surface as `"revoked"` rather than `"none"`. `mentorProfileId` is
 * the durable display link and is intentionally NOT cleared on revoke, so it is the
 * right key here.
 */
export async function getMentorAccessByProfileId(): Promise<Map<string, MentorAccessState>> {
  const users = await prisma.user.findMany({
    where: { mentorProfileId: { not: null } },
    select: { mentorProfileId: true, isMentor: true, mentorRevokedAt: true },
  });

  const map = new Map<string, MentorAccessState>();
  for (const user of users) {
    if (!user.mentorProfileId) continue;
    map.set(
      user.mentorProfileId,
      user.isMentor ? "active" : user.mentorRevokedAt ? "revoked" : "none"
    );
  }
  return map;
}

/** Outcome of {@link grantMentorAccess} so the route can map "no account" to a 404. */
export type GrantMentorAccessResult =
  | { ok: true; userId: string }
  | { ok: false; reason: "no-account" };

/**
 * Grant a mentor login account the ability to act as a mentor for `profileId`.
 *
 * This is the ONLY place `isMentor` is set outside the seed. It resolves the account
 * by email *without* requiring `isMentor` — that is the whole point: an existing
 * member account is promoted to mentor here. Grant is always a deliberate admin
 * action, never a side effect of saving an email (a typo would otherwise hand a
 * member access to every mentee's question).
 *
 * `User.mentorProfileId` is `@unique`; any *other* account still holding this profile
 * id is cleared first so the update cannot throw on the constraint.
 *
 * Bumps `tokenVersion` so a promoted account's already-issued 7-day session picks up
 * the new `isMentor` flag on its next request — the JWT refreshes `isMentor` only on
 * sign-in or `trigger === "update"`, so without the bump a live session would not see
 * the grant.
 */
export async function grantMentorAccess(
  profileId: string,
  email: string,
  updatedByUserId?: string
): Promise<GrantMentorAccessResult> {
  void updatedByUserId;
  const normalized = email.trim().toLowerCase();
  if (!normalized) return { ok: false, reason: "no-account" };

  const user = await prisma.user.findFirst({
    where: { email: { equals: normalized, mode: "insensitive" } },
    select: { id: true },
  });
  if (!user) return { ok: false, reason: "no-account" };

  // Release the profile id from any other account first — the column is unique.
  await prisma.user.updateMany({
    where: { mentorProfileId: profileId, id: { not: user.id } },
    data: { mentorProfileId: null },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { isMentor: true, mentorProfileId: profileId, mentorRevokedAt: null },
  });

  await incrementUserTokenVersion(user.id);
  return { ok: true, userId: user.id };
}

/**
 * Revoke mentor access for every account linked to `profileId`.
 *
 * Sets `isMentor: false` and stamps `mentorRevokedAt`, then bumps `tokenVersion` so
 * any live session is invalidated immediately (revoke is otherwise a no-op for up to
 * 7 days). `mentorProfileId` is deliberately NOT cleared: it is a display link, no
 * authorisation reads it, and keeping it is what makes a later restore a one-field
 * flip. Returns whether an account was affected, for the audit trail.
 */
export async function revokeMentorAccess(
  profileId: string,
  updatedByUserId?: string
): Promise<{ revoked: boolean }> {
  void updatedByUserId;
  const users = await prisma.user.findMany({
    where: { mentorProfileId: profileId },
    select: { id: true },
  });
  if (users.length === 0) return { revoked: false };

  await prisma.user.updateMany({
    where: { mentorProfileId: profileId },
    data: { isMentor: false, mentorRevokedAt: new Date() },
  });

  for (const user of users) {
    await incrementUserTokenVersion(user.id);
  }
  return { revoked: true };
}

/**
 * Re-grant mentor access after a soft-deleted profile is restored.
 *
 * Only acts when the linked account was actually revoked (`mentorRevokedAt` set) —
 * restoring a profile that never had a login, or whose access was never revoked,
 * must not silently create mentor access. Re-runs {@link linkMentorUserByEmail} so
 * the display link is fresh, and bumps `tokenVersion` so the re-granted flag takes
 * effect on the account's next request. Returns whether access was re-granted, for
 * the audit trail.
 */
export async function restoreMentorAccess(
  profileId: string,
  email: string | null | undefined,
  updatedByUserId?: string
): Promise<boolean> {
  void updatedByUserId;
  const user = await prisma.user.findFirst({
    where: { mentorProfileId: profileId },
    select: { id: true, mentorRevokedAt: true },
  });
  if (!user || !user.mentorRevokedAt) return false;

  await prisma.user.update({
    where: { id: user.id },
    data: { isMentor: true, mentorRevokedAt: null },
  });
  await linkMentorUserByEmail(profileId, email);
  await incrementUserTokenVersion(user.id);
  return true;
}

/** Mentor users keyed for admin list overlay (live email/company from login accounts). */
export async function getMentorLiveContactsByProfileId(): Promise<Map<string, MentorLiveContact>> {
  const users = await prisma.user.findMany({
    where: { isMentor: true, mentorProfileId: { not: null } },
    select: { mentorProfileId: true, email: true, company: true },
  });

  const map = new Map<string, MentorLiveContact>();
  for (const user of users) {
    if (!user.mentorProfileId) continue;
    map.set(user.mentorProfileId, { email: user.email, company: user.company });
  }
  return map;
}

/** Fallback match when admin saved email in CMS but account link not set yet. */
export async function getMentorLiveContactsByEmail(): Promise<Map<string, MentorLiveContact>> {
  const users = await prisma.user.findMany({
    where: { isMentor: true },
    select: { email: true, company: true },
  });

  const map = new Map<string, MentorLiveContact>();
  for (const user of users) {
    map.set(user.email.toLowerCase(), { email: user.email, company: user.company });
  }
  return map;
}

export function overlayMentorLiveContact(
  mentor: { id: string; email: string | null; company: string | null },
  byProfileId: Map<string, MentorLiveContact>,
  byEmail: Map<string, MentorLiveContact>
): { email: string | null; company: string | null } {
  const linked = byProfileId.get(mentor.id);
  if (linked) {
    return { email: linked.email, company: linked.company ?? mentor.company };
  }

  if (mentor.email) {
    const matched = byEmail.get(mentor.email.toLowerCase());
    if (matched) {
      return { email: matched.email, company: matched.company ?? mentor.company };
    }
  }

  return { email: mentor.email, company: mentor.company };
}

/** Connect a mentor login account to a CMS profile when admin saves a matching email. */
export async function linkMentorUserByEmail(
  mentorProfileId: string,
  email: string | null | undefined
): Promise<void> {
  if (!email?.trim()) return;

  const normalized = email.trim().toLowerCase();
  const user = await prisma.user.findFirst({
    where: { isMentor: true, email: { equals: normalized, mode: "insensitive" } },
    select: { id: true, mentorProfileId: true },
  });
  if (!user || user.mentorProfileId === mentorProfileId) return;

  await prisma.user.update({
    where: { id: user.id },
    data: { mentorProfileId },
  });
}

/**
 * Move the `User.mentorProfileId` account link when an admin renames an app-created
 * mentor profile id.
 *
 * `User.mentorProfileId` is `String?` (prisma/schema.prisma:77,
 * `@@unique([mentorProfileId])` at :112). If it is not moved, the live-contact overlay
 * (`getMentorLiveContactsByProfileId`) silently stops matching and falls back to email.
 *
 * `updatedByUserId` is kept for signature parity with the other sync helpers; it is
 * not required for the update.
 */
export async function renameMentorProfileId(
  oldId: string,
  newId: string,
  updatedByUserId?: string
): Promise<void> {
  if (oldId === newId) return;
  void updatedByUserId;
  try {
    await prisma.user.updateMany({
      where: { mentorProfileId: oldId },
      data: { mentorProfileId: newId },
    });
  } catch (err) {
    // newId may already be held by another User row (the column is unique) — non-fatal:
    // the live-contact overlay still falls back to email matching.
    console.error("[mentor-profile-sync] rename user link failed", err);
  }
}

async function findOverrideIdByEmail(email: string): Promise<string | null> {
  const payload = await getContentModulePayload<Partial<MentorOverridesPayload>>("mentors");
  const match = payload?.overrides?.find(
    (o) => o.email?.trim().toLowerCase() === email.trim().toLowerCase()
  );
  return match?.id ?? null;
}

/** Resolve (and persist) the CMS profile id for a mentor login account. */
export async function resolveMentorProfileIdForUser(
  userId: string,
  currentEmail: string
): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mentorProfileId: true },
  });
  if (user?.mentorProfileId) return user.mentorProfileId;

  const fromOverride = await findOverrideIdByEmail(currentEmail);
  if (!fromOverride) return null;

  await prisma.user.update({
    where: { id: userId },
    data: { mentorProfileId: fromOverride },
  });
  return fromOverride;
}

/** Push mentor account email/company into the admin mentors CMS override. */
export async function syncMentorOverrideContact(
  mentorProfileId: string,
  contact: { email?: string | null; company?: string | null },
  updatedByUserId?: string
): Promise<void> {
  const existingPayload = await getContentModulePayload<Partial<MentorOverridesPayload>>("mentors");
  const overrides = existingPayload?.overrides ?? [];
  const idx = overrides.findIndex((o) => o.id === mentorProfileId);

  const nextOverride: MentorOverride = {
    ...(idx >= 0 ? overrides[idx] : { id: mentorProfileId }),
    id: mentorProfileId,
    updatedAt: new Date().toISOString(),
  };

  if (contact.email !== undefined) {
    nextOverride.email = contact.email === null ? undefined : contact.email || undefined;
  }
  if (contact.company !== undefined) {
    nextOverride.company = contact.company === null ? undefined : contact.company || undefined;
  }

  const nextOverrides =
    idx >= 0
      ? overrides.map((o, i) => (i === idx ? nextOverride : o))
      : [...overrides, nextOverride];

  await updateContentModule(
    "mentors",
    { payload: buildMentorOverridesPayload(nextOverrides, existingPayload?.order), published: true },
    updatedByUserId
  );

  revalidatePath("/mentor-connect");
}

/** After a mentor updates their account profile, mirror contact fields to the admin mentor list. */
export async function syncUserContactToMentorProfile(
  userId: string,
  previousEmail: string,
  nextEmail: string,
  nextCompany: string | null
): Promise<void> {
  const profileId =
    (await resolveMentorProfileIdForUser(userId, previousEmail)) ??
    (await resolveMentorProfileIdForUser(userId, nextEmail));
  if (!profileId) return;

  await syncMentorOverrideContact(profileId, { email: nextEmail, company: nextCompany }, userId);
}
