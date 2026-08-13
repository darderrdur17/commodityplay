import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPublishedPayload, updateContentModule } from "@/lib/content/repository";
import { UNASSIGNED_SEGMENT_ID, generateMentorId } from "@/data/mentors";
import type { MentorOverride, MentorOverridesPayload } from "@/data/mentors";

/**
 * Public, unauthenticated endpoint backing the unlisted /mentor-apply form. Admins
 * recruit mentors out-of-band (email/WhatsApp) and share this form's URL directly —
 * there is no in-app invite/email-sending flow. Submissions never touch the `User`
 * table; they're persisted as `status: "pending"` entries in the "mentors" CMS
 * override module and reviewed/approved from the admin Mentors tab.
 *
 * Risk: this route is intentionally public and unauthenticated. It's locked down with
 * strict field length limits and email format validation, but has no CAPTCHA or rate
 * limiting — if the URL leaks, it's abusable for spam submissions. Acceptable for this
 * iteration since applications only ever land in a "pending" review queue (never
 * auto-published), but consider adding rate limiting if abuse becomes a problem.
 */

const applySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  email: z.string().trim().email("Enter a valid email address").max(200),
  company: z.string().trim().max(200).optional(),
  headline: z.string().trim().min(1, "Headline is required").max(200),
  years: z.number().int().min(0).max(80),
  tags: z.array(z.string().trim().min(1).max(40)).min(1, "At least one subject is required").max(12),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = applySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please check the form for errors.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const now = new Date().toISOString();
    const newOverride: MentorOverride = {
      id: generateMentorId(),
      isNew: true,
      status: "pending",
      segmentId: UNASSIGNED_SEGMENT_ID,
      headline: data.headline,
      years: data.years,
      tags: data.tags,
      name: data.name,
      email: data.email,
      company: data.company || undefined,
      track: "both",
      createdAt: now,
      updatedAt: now,
    };

    const existingPayload = await getPublishedPayload<Partial<MentorOverridesPayload>>("mentors");
    const overrides = existingPayload?.overrides ?? [];

    await updateContentModule("mentors", { payload: { overrides: [...overrides, newOverride] } });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
