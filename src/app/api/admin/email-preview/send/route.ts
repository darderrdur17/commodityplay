import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminForbiddenResponse, assertSoleAdmin, requireSoleAdmin } from "@/lib/admin-access";
import { buildEmailPreview } from "@/lib/email-preview";
import { mergeEmailTemplates } from "@/lib/content/email-templates-schema";
import { readEmailCopy, sendAndLog } from "@/lib/email";
import { DEFAULT_EMAIL_TEMPLATES, type EmailTemplateKey } from "@/data/email-templates-content";

export const dynamic = "force-dynamic";

// Built from the data file rather than restated, so adding a ninth email
// automatically widens the accepted keys here — a hand-written list would drift.
const EMAIL_KEYS = Object.keys(DEFAULT_EMAIL_TEMPLATES.emails) as [
  EmailTemplateKey,
  ...EmailTemplateKey[],
];

const sendSchema = z.object({
  key: z.enum(EMAIL_KEYS),
  payload: z.unknown().optional(),
  // A single address only. `z.string().email()` rejects an array, a comma-joined
  // list, and anything past the length cap, so this endpoint can never be turned
  // into a relay to a list of strangers.
  to: z.string().trim().max(320).email().optional(),
});

/**
 * Sends one test copy of an email template to the calling admin.
 *
 * The recipient defaults to the admin's *own* address — the request is "send me
 * a copy", not "send this somewhere". The message is rendered by the same
 * builder as the live email, and logged under a dedicated kind so the owner can
 * see in the Email Log whether Resend actually delivered it.
 */
export async function POST(req: NextRequest) {
  const denied = await assertSoleAdmin();
  if (denied) return denied;

  // `assertSoleAdmin` guards; `requireSoleAdmin` supplies the identity we need
  // for the default recipient. The second lookup is deliberate — cheap, and it
  // keeps the guard identical to every other admin route.
  const admin = await requireSoleAdmin();
  if (!admin) return adminForbiddenResponse();

  const body = await req.json().catch(() => null);
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const copy =
    parsed.data.payload !== undefined
      ? mergeEmailTemplates(parsed.data.payload)
      : await readEmailCopy();
  const { subject, text, html } = buildEmailPreview(parsed.data.key, copy);

  const to = parsed.data.to ?? admin.user.email;

  const result = await sendAndLog({
    kind: "email_template_test",
    to,
    subject,
    text,
    html,
  });

  if (result.ok) {
    return NextResponse.json({ ok: true, delivered: true, skipped: false, to });
  }
  if ("skipped" in result) {
    // Not configured (no Resend key/from address) — nothing was sent. The UI
    // must show this differently from a failure, so it is a distinct field.
    return NextResponse.json({
      ok: false,
      delivered: false,
      skipped: true,
      reason: result.reason,
      to,
    });
  }
  return NextResponse.json({
    ok: false,
    delivered: false,
    skipped: false,
    reason: result.error,
    to,
  });
}
