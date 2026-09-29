import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getContentModulePayload, updateContentModule } from "@/lib/content/repository";
import type { MentorOverride, MentorOverridesPayload } from "@/data/mentors";

export type MentorLiveContact = {
  email: string;
  company: string | null;
};

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
    { payload: { overrides: nextOverrides }, published: true },
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
