import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasResolvedAccess } from "@/lib/entitlements";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { notifyMentorPoolNewQuestion } from "@/lib/mentor-questions";
import { assertMentorCreditAvailable } from "@/lib/mentor-credits-server";
import { apiSegmentAllowedForTrack } from "@/lib/mentor-segments";
import { parseMemberShareOptIn } from "@/lib/mentor-share-consent";
import { getPublishedMentorSegments } from "@/lib/content/accessors";

const schema = z.object({
  segment: z.enum([
    "physical-trading",
    "finance",
    "analytics",
    "operations",
    "sales",
    "sales-advisory",
  ]),
  question: z.string().min(20, "Question must be at least 20 characters").max(500),
  // Only the explicit `memberShareOptIn` spelling is accepted. The legacy
  // `isPublic` alias was removed — see `parseMemberShareOptIn`.
  memberShareOptIn: z.boolean().optional(),
  // Anonymous Mentor Connect profile id the member addressed (e.g. "PT-01").
  // Optional for back-compat; when present it is validated against the roster.
  mentorId: z.string().min(1).max(64).optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      tier: true,
      track: true,
      stripeStatus: true,
      stripeCurrentPeriodEnd: true,
      stripePriceId: true,
    },
  });

  // Effective tier: Elite is a recurring plan, so a lapsed or past-due
  // subscription must not keep spending mentor credits. An allowlisted admin
  // resolves to ELITE (superadmin).
  if (!user || !hasResolvedAccess(user, "ELITE")) {
    return NextResponse.json({ error: "Elite membership required" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  if (!apiSegmentAllowedForTrack(parsed.data.segment, user.track)) {
    return NextResponse.json(
      { error: "This mentor segment is only available on the Sales track" },
      { status: 403 }
    );
  }

  const creditCheck = await assertMentorCreditAvailable(session.user.id);
  if (!creditCheck.ok) {
    return NextResponse.json({ error: creditCheck.error }, { status: creditCheck.status });
  }

  // Per-mentor targeting: the member picks a specific mentor on Mentor Connect.
  // Validate the id against the published roster so a question can never be
  // addressed to a mentor who does not exist (which would orphan it, since
  // mentor inboxes filter on this column).
  const requestedMentorId = parsed.data.mentorId?.trim();
  let mentorProfileId: string | null = null;
  if (requestedMentorId) {
    const segments = await getPublishedMentorSegments();
    const known = new Set(segments.flatMap((seg) => seg.mentors.map((m) => m.id)));
    if (!known.has(requestedMentorId)) {
      return NextResponse.json({ error: "Unknown mentor" }, { status: 400 });
    }
    mentorProfileId = requestedMentorId;
  }

  const question = await prisma.mentorQuestion.create({
    data: {
      userId: session.user.id,
      segment: parsed.data.segment,
      question: parsed.data.question,
      memberShareOptIn: parseMemberShareOptIn(parsed.data),
      mentorProfileId,
    },
  });

  notifyMentorPoolNewQuestion(question.id).catch((err) =>
    console.error("[mentor-connect] mentor pool notify failed", err)
  );

  return NextResponse.json({ id: question.id, success: true }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const questions = await prisma.mentorQuestion.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(questions);
}
