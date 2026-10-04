import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { recordAdminAudit, requireSoleAdmin } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";
import { getResolvedMentorSegments } from "@/lib/content/accessors";
import { getContentModulePayload, updateContentModule } from "@/lib/content/repository";
import {
  MENTOR_SEGMENTS,
  TOMBSTONE_METADATA_KEYS,
  UNASSIGNED_SEGMENT_ID,
  buildMentorOverridesPayload,
  isValidMentorId,
  normalizeMentorId,
  type MentorOverride,
  type MentorOverridesPayload,
  type MentorStatus,
} from "@/data/mentors";
import { resolveMentorSegments } from "@/lib/content/merge";
import {
  getMentorAccessByProfileId,
  getMentorLiveContactsByEmail,
  getMentorLiveContactsByProfileId,
  grantMentorAccess,
  linkMentorUserByEmail,
  overlayMentorLiveContact,
  renameMentorProfileId,
  restoreMentorAccess,
  revokeMentorAccess,
} from "@/lib/mentor-profile-sync";
import {
  computeMentorRewardProgress,
  mentorAnsweredCountForEmail,
} from "@/lib/mentor-reward-ladder";
import { getMentorAnsweredCountsByEmail } from "@/lib/mentor-reward-counts";
import { normalizeMentorConnectPayload } from "@/lib/content/mentor-connect-schema";

export async function GET() {
  const admin = await requireSoleAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Count questions per segment from DB
  const questions = await prisma.mentorQuestion.groupBy({
    by: ["segment"],
    _count: { id: true },
  });
  const countBySegment: Record<string, number> = {};
  for (const q of questions) {
    countBySegment[q.segment] = q._count.id;
  }

  const resolvedSegments = await getResolvedMentorSegments();
  const liveByProfileId = await getMentorLiveContactsByProfileId();
  const liveByEmail = await getMentorLiveContactsByEmail();
  const mentorAccessByProfileId = await getMentorAccessByProfileId();
  const answeredCountsByEmail = await getMentorAnsweredCountsByEmail();
  const mentorConnectCms = await getContentModulePayload("mentor-connect");
  const rewardRungs = normalizeMentorConnectPayload(mentorConnectCms ?? {}).rewardLadder.rungs;

  // Surface in CMS `order` (then seed order). Do not re-sort pending-first — that would
  // undo admin ↑/↓ reordering on the Mentors tab.
  const segments = resolvedSegments.map((seg) => ({
    id: seg.id,
    num: seg.num,
    title: seg.title,
    blurb: seg.blurb,
    questionCount: countBySegment[seg.id] ?? 0,
    mentors: seg.mentors.map((m) => {
        const live = overlayMentorLiveContact(
          { id: m.id, email: m.email ?? null, company: m.company ?? null },
          liveByProfileId,
          liveByEmail
        );
        const answeredCount = mentorAnsweredCountForEmail(answeredCountsByEmail, live.email);
        const rewardProgress = computeMentorRewardProgress(answeredCount, rewardRungs);
        return {
          id: m.id,
          years: m.years,
          headline: m.headline,
          bio: m.bio,
          tags: m.tags,
          name: m.name ?? null,
          email: live.email,
          company: live.company,
          linkedIn: m.linkedIn ?? null,
          location: m.location ?? null,
          role: m.role ?? null,
          commodityDesk: m.commodityDesk ?? null,
          track: m.track ?? "both",
          status: m.status ?? "active",
          isNew: m.isNew ?? false,
          segmentId: seg.id,
          mentorAccess: mentorAccessByProfileId.get(m.id) ?? "none",
          answeredCount,
          rewardProgress,
        };
      }),
  }));

  const pendingCount = segments.reduce(
    (n, seg) => n + seg.mentors.filter((m) => m.status === "pending").length,
    0
  );

  // Hidden (tombstoned) profiles — a deleted mentor is dropped from `segments` by
  // `resolveMentorSegments`, so this is the only way the admin can see (and restore)
  // them. Read the raw override payload directly: the tombstones never reach the
  // resolved segments, but we still want their seed fallback (name/email/segment).
  const rawMentorPayload = await getContentModulePayload<Partial<MentorOverridesPayload>>("mentors");
  const rawOverrides = rawMentorPayload?.overrides ?? [];

  // Seed lookup so a tombstoned seeded profile can fall back to its mentors.json
  // name/email and report which segment it belongs to.
  const seedMentorById = new Map<
    string,
    {
      name: string | null;
      email: string | null;
      company: string | null;
      status: MentorStatus | undefined;
      segmentId: string;
      segmentTitle: string;
    }
  >();
  for (const seg of MENTOR_SEGMENTS) {
    for (const m of seg.mentors) {
      seedMentorById.set(m.id, {
        name: m.name ?? null,
        email: m.email ?? null,
        company: m.company ?? null,
        status: m.status,
        segmentId: seg.id,
        segmentTitle: seg.title,
      });
    }
  }
  const resolvedSegmentTitleById = new Map(resolvedSegments.map((seg) => [seg.id, seg.title] as const));

  const hidden = rawOverrides
    .filter((o) => o.deleted === true)
    .map((o) => {
      const seed = seedMentorById.get(o.id);
      const live = overlayMentorLiveContact(
        {
          id: o.id,
          email: o.email ?? seed?.email ?? null,
          company: o.company ?? seed?.company ?? null,
        },
        liveByProfileId,
        liveByEmail
      );
      const segmentId = seed?.segmentId ?? o.segmentId ?? null;
      const segmentTitle =
        (segmentId ? resolvedSegmentTitleById.get(segmentId) : undefined) ??
        seed?.segmentTitle ??
        (segmentId === UNASSIGNED_SEGMENT_ID ? "Unassigned" : null);
      return {
        id: o.id,
        name: o.name ?? seed?.name ?? null,
        email: live.email,
        status: o.status ?? seed?.status ?? "active",
        isNew: o.isNew === true,
        wasSeeded: seed !== undefined,
        deletedAt: o.updatedAt ?? null,
        segmentTitle,
        mentorAccess: mentorAccessByProfileId.get(o.id) ?? "none",
      };
    })
    // Most recently deleted first. A missing `updatedAt` sorts last (treated as epoch 0).
    .sort((a, b) => {
      const ta = a.deletedAt ? Date.parse(a.deletedAt) : 0;
      const tb = b.deletedAt ? Date.parse(b.deletedAt) : 0;
      return tb - ta;
    });

  return NextResponse.json({ segments, pendingCount, hidden });
}

const reorderSchema = z.object({
  id: z.string().min(1),
  segmentId: z.string().min(1),
  direction: z.enum(["up", "down"]),
});

const patchSchema = z.object({
  id: z.string().min(1),
  headline: z.string().min(1).max(200).optional(),
  bio: z.string().min(1).max(2000).optional(),
  years: z.number().int().min(0).max(80).optional(),
  tags: z.array(z.string().min(1).max(40)).max(12).optional(),
  name: z.string().max(200).nullable().optional(),
  email: z.preprocess(
    (v) => (v === "" ? null : v),
    z.string().email().max(200).nullable().optional()
  ),
  company: z.string().max(200).nullable().optional(),
  linkedIn: z.string().max(300).nullable().optional(),
  location: z.string().max(200).nullable().optional(),
  role: z.string().max(200).nullable().optional(),
  commodityDesk: z.string().max(200).nullable().optional(),
  track: z.enum(["career", "sales", "both"]).optional(),
  /** Approve (or re-open) a pending self-submitted application. */
  status: z.enum(["pending", "active"]).optional(),
  /** Reassign a new application (or move it out of "Unassigned") to a real segment. */
  segmentId: z.string().min(1).max(60).optional(),
  /** New anonymous mentor id — app-created (`isNew`) profiles only. `id` stays the lookup key. */
  newId: z.string().min(3).max(40).optional(),
  /**
   * Explicit mentor-access transition, sent as its own request (`{ id, access }`) so a
   * profile save can never change access by accident. `grant` promotes the account
   * matching the profile email; `revoke` cuts off the linked account.
   */
  access: z.enum(["grant", "revoke"]).optional(),
});

/** Tombstone payload for DELETE — mirrors PATCH's lookup key. */
const deleteSchema = z.object({
  id: z.string().min(1),
});

/** Restore payload for POST — un-hides a tombstoned profile. */
const restoreSchema = z.object({
  id: z.string().min(1),
});

/**
 * Apply an explicit mentor-access transition and audit it. Shared by the access-only
 * request (`{ id, access }`) and the unusual profile-save-with-access request so both
 * behave identically. `email` is the profile's post-change email, used only to resolve
 * the account to grant.
 */
async function performMentorAccess(
  profileId: string,
  access: "grant" | "revoke",
  email: string | null,
  actor: { id: string; email: string }
): Promise<NextResponse> {
  if (access === "grant") {
    if (!email) {
      return NextResponse.json({ error: "No account found with that email" }, { status: 404 });
    }
    const granted = await grantMentorAccess(profileId, email, actor.id);
    if (!granted.ok) {
      return NextResponse.json({ error: "No account found with that email" }, { status: 404 });
    }
    await recordAdminAudit({
      actorEmail: actor.email,
      action: "mentor.access.granted",
      metadata: { mentorProfileId: profileId, email },
    });
    return NextResponse.json({ ok: true, access: "granted", id: profileId });
  }

  const revoked = await revokeMentorAccess(profileId, actor.id);
  if (!revoked.revoked) {
    return NextResponse.json(
      { error: "No mentor account is linked to this profile" },
      { status: 400 }
    );
  }
  await recordAdminAudit({
    actorEmail: actor.email,
    action: "mentor.access.revoked",
    metadata: { mentorProfileId: profileId },
  });
  return NextResponse.json({ ok: true, access: "revoked", id: profileId });
}

export async function PATCH(req: NextRequest) {
  const admin = await requireSoleAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (body && typeof body === "object" && "direction" in body) {
    const reorderParsed = reorderSchema.safeParse(body);
    if (!reorderParsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: reorderParsed.error.flatten() },
        { status: 400 }
      );
    }
    const { id, segmentId, direction } = reorderParsed.data;
    const existingPayload = await getContentModulePayload<Partial<MentorOverridesPayload>>("mentors");
    const overrides = existingPayload?.overrides ?? [];
    const resolved = resolveMentorSegments(MENTOR_SEGMENTS, overrides, existingPayload?.order);
    const segment = resolved.find((seg) => seg.id === segmentId);
    if (!segment) {
      return NextResponse.json({ error: "Segment not found" }, { status: 404 });
    }
    const idx = segment.mentors.findIndex((m) => m.id === id);
    if (idx < 0) {
      return NextResponse.json({ error: "Mentor not found in that segment" }, { status: 404 });
    }
    const swapWith = direction === "up" ? idx - 1 : idx + 1;
    let nextMentors = segment.mentors;
    if (swapWith >= 0 && swapWith < segment.mentors.length) {
      nextMentors = [...segment.mentors];
      const current = nextMentors[idx];
      const neighbor = nextMentors[swapWith];
      if (current && neighbor) {
        nextMentors[idx] = neighbor;
        nextMentors[swapWith] = current;
      }
    }
    const nextOrder = resolved.flatMap((seg) =>
      (seg.id === segmentId ? nextMentors : seg.mentors).map((m) => m.id)
    );

    await updateContentModule(
      "mentors",
      { payload: buildMentorOverridesPayload(overrides, nextOrder), published: true },
      admin.user.id
    );

    revalidatePath("/mentor-connect", "page");
    revalidatePath("/mentor-connect", "layout");

    await recordAdminAudit({
      actorEmail: admin.user.email,
      action: "mentor.profile.reordered",
      metadata: { mentorProfileId: id, segmentId, direction },
    });

    return NextResponse.json({ ok: true, order: nextOrder });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { id, newId: rawNewId, access, ...profilePatch } = parsed.data;

  // An access-only request (`{ id, access }`) carries no profile content, so handle it
  // entirely on its own — no CMS write, no revalidation — and never mint a content-less
  // override or archive a revision for a pure grant/revoke.
  const isAccessOnly =
    access !== undefined && rawNewId === undefined && Object.keys(profilePatch).length === 0;
  if (isAccessOnly) {
    const payload = await getContentModulePayload<Partial<MentorOverridesPayload>>("mentors");
    // Resolve the email exactly as the `segments` / `hidden` rows do — override first,
    // then the seeded mentors.json row — so all three surfaces agree on whether a
    // profile has an email (otherwise Grant would 404 for a seeded mentor the list
    // shows an email for).
    const email =
      payload?.overrides?.find((o) => o.id === id)?.email ??
      MENTOR_SEGMENTS.flatMap((seg) => seg.mentors).find((m) => m.id === id)?.email ??
      null;
    return performMentorAccess(id, access, email, admin.user);
  }

  const existingPayload = await getContentModulePayload<Partial<MentorOverridesPayload>>("mentors");
  const overrides = existingPayload?.overrides ?? [];

  const idx = overrides.findIndex((o) => o.id === id);
  const existing = idx >= 0 ? overrides[idx] : undefined;
  const isSeededMentor = MENTOR_SEGMENTS.some((seg) => seg.mentors.some((m) => m.id === id));
  const tombstonedIds = new Set(
    overrides.filter((o) => o.deleted).map((o) => o.id.toUpperCase())
  );

  const requestedNewId = rawNewId ? normalizeMentorId(rawNewId) : null;
  const isRename = requestedNewId !== null && requestedNewId !== id;
  let effectiveId = id;

  if (isRename) {
    if (isSeededMentor) {
      return NextResponse.json(
        { error: "Seeded mentor IDs cannot be changed" },
        { status: 400 }
      );
    }
    if (existing?.isNew !== true) {
      return NextResponse.json(
        { error: "Only app-created mentor IDs can be renamed" },
        { status: 400 }
      );
    }
    if (!isValidMentorId(requestedNewId)) {
      return NextResponse.json({ error: "Invalid anonymous ID format" }, { status: 400 });
    }

    // Deleting a mentor tombstones its override but leaves the seed row in mentors.json, so a
    // released id must be dropped from both uniqueness sets — otherwise an admin who removes a
    // seeded mentor (e.g. PT-03) can never reuse that id and is pushed onto a near-miss (PT-3).
    const seedIds = new Set(
      MENTOR_SEGMENTS.flatMap((seg) => seg.mentors.map((m) => m.id.toUpperCase())).filter(
        (seedId) => !tombstonedIds.has(seedId)
      )
    );
    const otherOverrideIds = new Set(
      overrides
        .filter((o) => o.id.toUpperCase() !== id.toUpperCase() && !o.deleted)
        .map((o) => o.id.toUpperCase())
    );
    if (seedIds.has(requestedNewId) || otherOverrideIds.has(requestedNewId)) {
      return NextResponse.json(
        { error: "That anonymous ID is already in use" },
        { status: 409 }
      );
    }

    effectiveId = requestedNewId;
  }

  const nextOverride: MentorOverride = {
    ...(idx >= 0 ? overrides[idx] : { id: effectiveId }),
    id: effectiveId,
    updatedAt: new Date().toISOString(),
  };

  if (profilePatch.headline !== undefined) nextOverride.headline = profilePatch.headline;
  if (profilePatch.bio !== undefined) nextOverride.bio = profilePatch.bio;
  if (profilePatch.years !== undefined) nextOverride.years = profilePatch.years;
  if (profilePatch.tags !== undefined) nextOverride.tags = profilePatch.tags;
  if (profilePatch.name !== undefined) {
    nextOverride.name = profilePatch.name === null ? undefined : profilePatch.name;
  }
  if (profilePatch.email !== undefined) {
    nextOverride.email = profilePatch.email === null ? undefined : profilePatch.email;
  }
  if (profilePatch.company !== undefined) {
    nextOverride.company = profilePatch.company === null ? undefined : profilePatch.company;
  }
  if (profilePatch.linkedIn !== undefined) {
    nextOverride.linkedIn = profilePatch.linkedIn === null ? undefined : profilePatch.linkedIn;
  }
  if (profilePatch.location !== undefined) {
    nextOverride.location = profilePatch.location === null ? undefined : profilePatch.location;
  }
  if (profilePatch.role !== undefined) {
    nextOverride.role = profilePatch.role === null ? undefined : profilePatch.role;
  }
  if (profilePatch.commodityDesk !== undefined) {
    nextOverride.commodityDesk =
      profilePatch.commodityDesk === null ? undefined : profilePatch.commodityDesk;
  }
  if (profilePatch.track !== undefined) nextOverride.track = profilePatch.track;
  if (profilePatch.status !== undefined) nextOverride.status = profilePatch.status;
  if (profilePatch.segmentId !== undefined) nextOverride.segmentId = profilePatch.segmentId;

  if (profilePatch.status === undefined) {
    const priorStatus = existing?.status;
    if (priorStatus === "active" || (isSeededMentor && priorStatus !== "pending")) {
      nextOverride.status = "active";
    }
  }

  let nextOverrides =
    idx >= 0
      ? overrides.map((o, i) => (i === idx ? nextOverride : o))
      : [...overrides, nextOverride];

  if (isRename) {
    // Claiming a released id must consume its tombstone: leaving both entries in place would
    // keep the id suppressed, and `overrides.findIndex((o) => o.id === id)` would then resolve
    // the stale deleted record on the next edit.
    nextOverrides = nextOverrides.filter(
      (o) => o === nextOverride || o.id.toUpperCase() !== effectiveId.toUpperCase()
    );
  }

  let persistedOrder = existingPayload?.order;
  if (isRename) {
    persistedOrder = (existingPayload?.order ?? []).map((oid) => (oid === id ? effectiveId : oid));
  }

  await updateContentModule(
    "mentors",
    { payload: buildMentorOverridesPayload(nextOverrides, persistedOrder), published: true },
    admin.user.id
  );

  if (profilePatch.email !== undefined) {
    await linkMentorUserByEmail(effectiveId, profilePatch.email);
  }

  if (isRename) {
    await renameMentorProfileId(id, effectiveId, admin.user.id);
  }

  revalidatePath("/mentor-connect", "page");
  revalidatePath("/mentor-connect", "layout");

  // A profile save that also carries `access` (unusual — the modal sends access as its
  // own request) still applies the access transition, using the post-patch id/email.
  if (access !== undefined) {
    return performMentorAccess(effectiveId, access, nextOverride.email ?? null, admin.user);
  }

  if (isRename) {
    await recordAdminAudit({
      actorEmail: admin.user.email,
      action: "mentor.profile.renamed",
      metadata: { from: id, to: effectiveId },
    });
  } else {
    await recordAdminAudit({
      actorEmail: admin.user.email,
      action: "mentor.profile.updated",
      metadata: { mentorProfileId: effectiveId },
    });
  }

  return NextResponse.json({ ok: true, override: nextOverride, id: effectiveId });
}

export async function DELETE(req: NextRequest) {
  const admin = await requireSoleAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { id } = parsed.data;

  const existingPayload = await getContentModulePayload<Partial<MentorOverridesPayload>>("mentors");
  const overrides = existingPayload?.overrides ?? [];
  const idx = overrides.findIndex((o) => o.id === id);
  const isSeeded = MENTOR_SEGMENTS.some((seg) => seg.mentors.some((m) => m.id === id));

  if (!isSeeded && idx < 0) {
    return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
  }

  const tombstone: MentorOverride = {
    ...(idx >= 0 ? overrides[idx] : { id }),
    id,
    deleted: true,
    updatedAt: new Date().toISOString(),
  };

  const nextOverrides =
    idx >= 0
      ? overrides.map((o, i) => (i === idx ? tombstone : o))
      : [...overrides, tombstone];

  await updateContentModule(
    "mentors",
    { payload: buildMentorOverridesPayload(nextOverrides, existingPayload?.order), published: true },
    admin.user.id
  );

  revalidatePath("/mentor-connect", "page");
  revalidatePath("/mentor-connect", "layout");

  // Deleting a profile also cuts off the linked mentor's access — a deleted mentor
  // must not keep reading every mentee's question. Restore re-grants it.
  const accessRevoked = await revokeMentorAccess(id, admin.user.id);

  await recordAdminAudit({
    actorEmail: admin.user.email,
    action: "mentor.profile.deleted",
    metadata: { mentorProfileId: id, wasSeeded: isSeeded, accessRevoked: accessRevoked.revoked },
  });

  return NextResponse.json({ ok: true, id });
}

export async function POST(req: NextRequest) {
  const admin = await requireSoleAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = restoreSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { id } = parsed.data;

  const existingPayload = await getContentModulePayload<Partial<MentorOverridesPayload>>("mentors");
  const overrides = existingPayload?.overrides ?? [];
  const idx = overrides.findIndex((o) => o.id === id);

  if (idx < 0) {
    return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
  }

  const tombstone = overrides[idx];
  if (tombstone.deleted !== true) {
    return NextResponse.json({ error: "Mentor is not hidden" }, { status: 400 });
  }

  // Defensive: the rename path consumes tombstones when reclaiming an id, so a
  // second live override sharing this id should be unreachable — but never
  // resurrect a hidden profile on top of a visible one.
  const collides = overrides.some((o, i) => i !== idx && !o.deleted && o.id === id);
  if (collides) {
    return NextResponse.json({ error: "That anonymous ID is already in use" }, { status: 409 });
  }

  const isSeeded = MENTOR_SEGMENTS.some((seg) => seg.mentors.some((m) => m.id === id));

  // Strip vs unflag. A tombstone minted purely to suppress a seeded profile carries
  // nothing but the registered tombstone-metadata keys — drop the whole entry so the
  // seed cleanly reverts to its mentors.json defaults and leaves no phantom override
  // row. Anything else (an app-created mentor, or a seeded one the admin had edited
  // before deleting) is un-flagged so the admin's earlier edits survive the round trip.
  // New tombstone metadata keys must be registered in `TOMBSTONE_METADATA_KEYS`.
  const tombstoneMetadataKeys = new Set<string>(TOMBSTONE_METADATA_KEYS);
  const carriesOnlyTombstoneFields = Object.keys(tombstone).every((key) =>
    tombstoneMetadataKeys.has(key)
  );

  const nextOverrides: MentorOverride[] = carriesOnlyTombstoneFields
    ? overrides.filter((_, i) => i !== idx)
    : overrides.map((o, i) =>
        i === idx ? { ...o, deleted: false, updatedAt: new Date().toISOString() } : o
      );

  await updateContentModule(
    "mentors",
    { payload: buildMentorOverridesPayload(nextOverrides, existingPayload?.order), published: true },
    admin.user.id
  );

  revalidatePath("/mentor-connect", "page");
  revalidatePath("/mentor-connect", "layout");

  // Restore also re-grants access if the profile's account had been revoked on delete.
  // `restoreMentorAccess` is a no-op when the account was never revoked or no account
  // is linked, so it cannot silently create mentor access.
  const restoredOverride = nextOverrides.find((o) => o.id === id);
  const accessRestored = await restoreMentorAccess(id, restoredOverride?.email ?? null, admin.user.id);

  await recordAdminAudit({
    actorEmail: admin.user.email,
    action: "mentor.profile.restored",
    metadata: { mentorProfileId: id, wasSeeded: isSeeded, accessRestored },
  });

  return NextResponse.json({ ok: true, id });
}
