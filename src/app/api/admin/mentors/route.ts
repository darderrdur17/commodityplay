import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { recordAdminAudit, requireSoleAdmin } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";
import { getResolvedMentorSegments } from "@/lib/content/accessors";
import { getContentModulePayload, updateContentModule } from "@/lib/content/repository";
import {
  MENTOR_SEGMENTS,
  buildMentorOverridesPayload,
  isValidMentorId,
  normalizeMentorId,
  type MentorOverride,
  type MentorOverridesPayload,
} from "@/data/mentors";
import { resolveMentorSegments } from "@/lib/content/merge";
import {
  getMentorLiveContactsByEmail,
  getMentorLiveContactsByProfileId,
  linkMentorUserByEmail,
  overlayMentorLiveContact,
  renameMentorProfileId,
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
          answeredCount,
          rewardProgress,
        };
      }),
  }));

  const pendingCount = segments.reduce(
    (n, seg) => n + seg.mentors.filter((m) => m.status === "pending").length,
    0
  );

  return NextResponse.json({ segments, pendingCount });
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
});

/** Tombstone payload for DELETE — mirrors PATCH's lookup key. */
const deleteSchema = z.object({
  id: z.string().min(1),
});

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

  const { id, newId: rawNewId, ...patch } = parsed.data;

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

  if (patch.headline !== undefined) nextOverride.headline = patch.headline;
  if (patch.bio !== undefined) nextOverride.bio = patch.bio;
  if (patch.years !== undefined) nextOverride.years = patch.years;
  if (patch.tags !== undefined) nextOverride.tags = patch.tags;
  if (patch.name !== undefined) {
    nextOverride.name = patch.name === null ? undefined : patch.name;
  }
  if (patch.email !== undefined) {
    nextOverride.email = patch.email === null ? undefined : patch.email;
  }
  if (patch.company !== undefined) {
    nextOverride.company = patch.company === null ? undefined : patch.company;
  }
  if (patch.linkedIn !== undefined) {
    nextOverride.linkedIn = patch.linkedIn === null ? undefined : patch.linkedIn;
  }
  if (patch.location !== undefined) {
    nextOverride.location = patch.location === null ? undefined : patch.location;
  }
  if (patch.role !== undefined) {
    nextOverride.role = patch.role === null ? undefined : patch.role;
  }
  if (patch.commodityDesk !== undefined) {
    nextOverride.commodityDesk = patch.commodityDesk === null ? undefined : patch.commodityDesk;
  }
  if (patch.track !== undefined) nextOverride.track = patch.track;
  if (patch.status !== undefined) nextOverride.status = patch.status;
  if (patch.segmentId !== undefined) nextOverride.segmentId = patch.segmentId;

  if (patch.status === undefined) {
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

  if (patch.email !== undefined) {
    await linkMentorUserByEmail(effectiveId, patch.email);
  }

  if (isRename) {
    await renameMentorProfileId(id, effectiveId, admin.user.id);
  }

  revalidatePath("/mentor-connect", "page");
  revalidatePath("/mentor-connect", "layout");

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

  await recordAdminAudit({
    actorEmail: admin.user.email,
    action: "mentor.profile.deleted",
    metadata: { mentorProfileId: id, wasSeeded: isSeeded },
  });

  return NextResponse.json({ ok: true, id });
}
