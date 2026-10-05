import { z } from "zod";
import {
  DEFAULT_EMAIL_TEMPLATES,
  type EmailCopy,
  type EmailTemplateKey,
  type EmailTemplatesContent,
} from "@/data/email-templates-content";

/**
 * Validation and merge for the `email-templates` content module.
 *
 * Mirrors `footer-schema.ts`: a zod shape for saving, plus a merge that folds the
 * saved payload over the bundled defaults so a partially-filled row is always safe.
 */

const emailCopySchema = z.object({
  // Generous caps: these are copy fields, not free-form documents. They exist to
  // stop a paste accident from producing a 200KB email, not to police length.
  subject: z.string().max(200),
  heading: z.string().max(200),
  intro: z.string().max(1200),
  buttonLabel: z.string().max(60),
});

export type EmailCopyInput = z.infer<typeof emailCopySchema>;

const EMAIL_KEYS = Object.keys(DEFAULT_EMAIL_TEMPLATES.emails) as EmailTemplateKey[];

// Built from the defaults rather than restated, so adding an email to the data
// file automatically adds it here. A hand-written list would drift.
const emailsSchema = z.object(
  Object.fromEntries(EMAIL_KEYS.map((key) => [key, emailCopySchema])) as Record<
    EmailTemplateKey,
    typeof emailCopySchema
  >
);

export const emailTemplatesSchema = z.object({ emails: emailsSchema });

/**
 * Folds a stored payload over the bundled defaults.
 *
 * Never throws and never returns a partial: an unknown or malformed payload yields
 * the defaults, which reproduce today's copy exactly. That is what lets `email.ts`
 * call this on every send without a guard around each field.
 *
 * Deliberately field-by-field rather than `deepMerge`. `deepMerge` assigns a
 * non-object override wholesale, so a stored payload of the wrong shape (say
 * `emails: "oops"`) would come back out of the merge intact and hand `email.ts` a
 * non-object to index — a `TypeError` inside a password reset. Checking each field
 * is a string means nothing but a string can ever reach the renderer.
 */
export function mergeEmailTemplates(cms: unknown): EmailTemplatesContent {
  const source =
    cms && typeof cms === "object" ? (cms as { emails?: unknown }).emails : undefined;

  const emails = {} as Record<EmailTemplateKey, EmailCopy>;

  for (const key of EMAIL_KEYS) {
    const defaults = DEFAULT_EMAIL_TEMPLATES.emails[key];
    const candidate =
      source && typeof source === "object"
        ? (source as Record<string, unknown>)[key]
        : undefined;

    if (!candidate || typeof candidate !== "object") {
      emails[key] = defaults;
      continue;
    }

    const stored = candidate as Record<string, unknown>;
    // An empty string is a legitimate override (blank = remove the block), so the
    // check is on the *type*, never on emptiness.
    emails[key] = {
      subject: pickString(stored.subject, defaults.subject),
      heading: pickString(stored.heading, defaults.heading),
      intro: pickString(stored.intro, defaults.intro),
      buttonLabel: pickString(stored.buttonLabel, defaults.buttonLabel),
    };
  }

  return { emails };
}

function pickString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

export function prepareEmailTemplatesForSave(payload: unknown) {
  const merged = mergeEmailTemplates(payload);
  return emailTemplatesSchema.safeParse(merged);
}

export function formatEmailTemplatesValidationErrors(
  result: ReturnType<typeof prepareEmailTemplatesForSave>
) {
  if (result.success) return null;
  return result.error.issues
    .slice(0, 8)
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
}
