import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertSoleAdmin } from "@/lib/admin-access";
import { buildEmailPreview } from "@/lib/email-preview";
import { mergeEmailTemplates } from "@/lib/content/email-templates-schema";
import { readEmailCopy } from "@/lib/email";
import { DEFAULT_EMAIL_TEMPLATES, type EmailTemplateKey } from "@/data/email-templates-content";

export const dynamic = "force-dynamic";

// Built from the data file rather than restated, so adding a ninth email
// automatically widens the accepted keys here — a hand-written list would drift.
const EMAIL_KEYS = Object.keys(DEFAULT_EMAIL_TEMPLATES.emails) as [
  EmailTemplateKey,
  ...EmailTemplateKey[],
];

const previewSchema = z.object({
  key: z.enum(EMAIL_KEYS),
  // The editor's *current* payload, including unsaved edits. Optional: an absent
  // payload means "use the last saved copy".
  payload: z.unknown().optional(),
});

/**
 * Renders one email template for the admin preview.
 *
 * The preview is produced by the very same builders the live senders use, so it
 * cannot drift from the real email — see `src/lib/email-preview.ts`. Passing the
 * editor's `payload` here is what makes the preview reflect unsaved edits.
 */
export async function POST(req: NextRequest) {
  const denied = await assertSoleAdmin();
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  const parsed = previewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // `mergeEmailTemplates` folds whatever arrives over the bundled defaults, so a
  // partial or malformed payload yields safe copy rather than a crash.
  const copy =
    parsed.data.payload !== undefined
      ? mergeEmailTemplates(parsed.data.payload)
      : await readEmailCopy();

  return NextResponse.json(buildEmailPreview(parsed.data.key, copy));
}
