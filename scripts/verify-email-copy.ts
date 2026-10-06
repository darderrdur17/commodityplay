/**
 * Email-copy verification — run with: npx tsx scripts/verify-email-copy.ts
 *
 * Covers the parts of the `email-templates` CMS module that are pure and therefore
 * testable without a server or a database: the renderer, the merge/validation, and
 * the wiring between `src/lib/email.ts` and the default copy.
 *
 * The wiring checks read `email.ts` as text on purpose. The failure they guard
 * against is a *silent* one — a sender reading a key that does not exist, or using
 * a placeholder nothing supplies — which renders an empty string in a live email
 * and would never surface as a type error.
 */
import fs from "node:fs";
import path from "node:path";
import {
  DEFAULT_EMAIL_TEMPLATES,
  EMAIL_TEMPLATE_GROUPS,
  EMAIL_TEMPLATE_PLACEHOLDERS,
  type EmailTemplateKey,
} from "../src/data/email-templates-content";
import {
  formatEmailTemplatesValidationErrors,
  mergeEmailTemplates,
  prepareEmailTemplatesForSave,
} from "../src/lib/content/email-templates-schema";
import {
  isBlankCopy,
  joinTextBlocks,
  renderCopyHtml,
  renderCopyParagraphsHtml,
  renderCopyText,
} from "../src/lib/content/email-copy";
import { CONTENT_MODULE_META, getModuleMeta } from "../src/lib/content/modules";
import { getAllDefaultPayloads, getDefaultPayload } from "../src/lib/content/defaults";
import { buildEmailPreview } from "../src/lib/email-preview";
import { EMAIL_TEMPLATE_SAMPLES } from "../src/data/email-template-samples";
import { demoEmailKindLabel } from "../src/lib/demo-email-log";

let failed = 0;
function ok(name: string, pass: boolean, detail?: string) {
  if (pass) console.log(`✓ ${name}${detail ? ` — ${detail}` : ""}`);
  else {
    console.log(`✗ ${name}${detail ? ` — ${detail}` : ""}`);
    failed++;
  }
}

const EMAIL_SOURCE = fs.readFileSync(
  path.join(process.cwd(), "src/lib/email.ts"),
  "utf8"
);
// `resend.emails.send(...)` is the Resend client, not a copy read. Strip it first so
// the key scan below cannot mistake "send" for an email template name.
const COPY_SOURCE = EMAIL_SOURCE.replace(/resend\.emails\.send/g, "resend_send");
const DECLARED_KEYS = Object.keys(DEFAULT_EMAIL_TEMPLATES.emails) as EmailTemplateKey[];
const PLACEHOLDER_PATTERN = /\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g;

function placeholdersIn(text: string): string[] {
  return [...text.matchAll(PLACEHOLDER_PATTERN)].map((match) => match[1]);
}

// ── Renderer: substitution, escaping, bold ordering ──────────────────────────

ok(
  "renderCopyText substitutes placeholders and drops bold markers",
  renderCopyText("Hi **{{name}}**, welcome to {{brand}}.", { name: "Frances", brand: "CommodityPlay" }) ===
    "Hi Frances, welcome to CommodityPlay."
);

ok(
  "renderCopyText renders an unknown placeholder as empty, not as the raw braces",
  renderCopyText("Hello {{missing}}there", {}) === "Hello there"
);

ok(
  "renderCopyText tolerates whitespace inside the braces",
  renderCopyText("{{ name }}", { name: "ok" }) === "ok"
);

ok(
  "renderCopyHtml escapes values and turns author markers into <strong>",
  renderCopyHtml("**{{title}}** at {{company}}", { title: "Trader", company: "Glencore" }) ===
    "<strong>Trader</strong> at Glencore"
);

ok(
  "renderCopyHtml escapes HTML in a value rather than injecting it",
  renderCopyHtml("{{q}}", { q: '<script>alert("x")</script>' }) ===
    "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;"
);

// The load-bearing one: a *value* must not be able to open a bold run, because
// the escaping and the bold pass both touch `*`. Values are neutralised first.
ok(
  "a value containing ** cannot inject markup or open a bold run",
  renderCopyHtml("{{v}}", { v: "**evil** <b>x</b>" }) ===
    "&#42;&#42;evil&#42;&#42; &lt;b&gt;x&lt;/b&gt;"
);

ok(
  "isBlankCopy treats whitespace-only as blank",
  isBlankCopy("") && isBlankCopy("   \n ") && isBlankCopy(null) && isBlankCopy(undefined) &&
    !isBlankCopy(" x ")
);

// ── Renderer: paragraphs ─────────────────────────────────────────────────────

ok(
  "renderCopyParagraphsHtml splits on a blank line into separate <p> blocks",
  renderCopyParagraphsHtml("First **para**.\n\nSecond para.", {}) ===
    "<p>First <strong>para</strong>.</p><p>Second para.</p>"
);

ok(
  "renderCopyParagraphsHtml keeps a single newline inside one paragraph",
  renderCopyParagraphsHtml("Line one\nLine two", {}) === "<p>Line one\nLine two</p>"
);

ok(
  "renderCopyParagraphsHtml renders blank copy as nothing at all",
  renderCopyParagraphsHtml("") === "" && renderCopyParagraphsHtml("  \n\n  ") === ""
);

// ── Renderer: text bodies ────────────────────────────────────────────────────

ok(
  "joinTextBlocks drops empty blocks instead of leaving blank runs",
  joinTextBlocks("Hi there,", "", null, undefined, "  ", "Body", "Link") ===
    "Hi there,\n\nBody\n\nLink"
);

// ── Merge: never throws, never returns a partial ─────────────────────────────

const mergedFromNull = mergeEmailTemplates(null);
ok(
  "mergeEmailTemplates falls back to the defaults for a null payload",
  JSON.stringify(mergedFromNull) === JSON.stringify(DEFAULT_EMAIL_TEMPLATES)
);

ok(
  "mergeEmailTemplates falls back to the defaults for a malformed payload",
  JSON.stringify(mergeEmailTemplates({ emails: "not-an-object" })) ===
    JSON.stringify(DEFAULT_EMAIL_TEMPLATES)
);

// Regression: `deepMerge` assigned a non-object override wholesale, so a
// wrong-typed field survived the merge and reached the renderer as a non-string.
ok(
  "a wrong-typed field falls back to the default instead of surviving the merge",
  mergeEmailTemplates({ emails: { mentee_answer: { subject: 42, heading: null } } }).emails
    .mentee_answer.subject === DEFAULT_EMAIL_TEMPLATES.emails.mentee_answer.subject &&
    mergeEmailTemplates({ emails: { mentee_answer: { subject: 42, heading: null } } }).emails
      .mentee_answer.heading === DEFAULT_EMAIL_TEMPLATES.emails.mentee_answer.heading
);

ok(
  "a non-object email entry falls back to the default rather than crashing the sender",
  JSON.stringify(
    mergeEmailTemplates({ emails: { mentee_answer: "oops" } }).emails.mentee_answer
  ) === JSON.stringify(DEFAULT_EMAIL_TEMPLATES.emails.mentee_answer)
);

const partial = mergeEmailTemplates({
  emails: { mentee_answer: { subject: "Custom subject" } },
});
ok(
  "mergeEmailTemplates keeps untouched fields from the defaults",
  partial.emails.mentee_answer.subject === "Custom subject" &&
    partial.emails.mentee_answer.heading === DEFAULT_EMAIL_TEMPLATES.emails.mentee_answer.heading &&
    partial.emails.billing_receipt.subject === DEFAULT_EMAIL_TEMPLATES.emails.billing_receipt.subject
);

// An empty string must override — that is how an admin removes a paragraph or a
// button, and `deepMerge` only skips `undefined`.
const blanked = mergeEmailTemplates({ emails: { mentee_answer: { intro: "" } } });
ok(
  "an explicitly blanked field overrides the default (blank = remove)",
  blanked.emails.mentee_answer.intro === "" &&
    blanked.emails.mentee_answer.buttonLabel ===
      DEFAULT_EMAIL_TEMPLATES.emails.mentee_answer.buttonLabel
);

// ── Validation ───────────────────────────────────────────────────────────────

ok(
  "the bundled defaults pass validation",
  prepareEmailTemplatesForSave(DEFAULT_EMAIL_TEMPLATES).success === true
);

const tooLong = prepareEmailTemplatesForSave({
  emails: { mentee_answer: { subject: "x".repeat(500) } },
});
ok(
  "an over-long subject is rejected with a readable message",
  tooLong.success === false &&
    (formatEmailTemplatesValidationErrors(tooLong) ?? "").includes("subject"),
  formatEmailTemplatesValidationErrors(tooLong) ?? undefined
);

// ── Wiring: email.ts ↔ default copy ──────────────────────────────────────────

const referencedKeys = new Set(
  [...COPY_SOURCE.matchAll(/\b(?:emails|templates)\.([a-z_]+)\b/g)].map((match) => match[1])
);
const referenced = [...referencedKeys].sort();

ok(
  "every copy key referenced by email.ts is a declared key",
  referenced.every((key) => DECLARED_KEYS.includes(key as EmailTemplateKey)),
  `referenced: ${referenced.join(", ")}`
);

ok(
  "every declared key is actually sent by email.ts (no dead template in the editor)",
  DECLARED_KEYS.every((key) => referencedKeys.has(key)),
  `declared: ${DECLARED_KEYS.join(", ")}`
);

const undeclaredUsage: string[] = [];
for (const key of DECLARED_KEYS) {
  const copy = DEFAULT_EMAIL_TEMPLATES.emails[key];
  const used = [
    ...placeholdersIn(copy.subject),
    ...placeholdersIn(copy.heading),
    ...placeholdersIn(copy.intro),
    ...placeholdersIn(copy.buttonLabel),
  ];
  for (const name of used) {
    if (!EMAIL_TEMPLATE_PLACEHOLDERS[key].includes(name)) {
      undeclaredUsage.push(`${key}.${name}`);
    }
  }
}
ok(
  "every placeholder used in the defaults is declared for that email",
  undeclaredUsage.length === 0,
  undeclaredUsage.join(", ") || undefined
);

const unsupplied: string[] = [];
for (const key of DECLARED_KEYS) {
  for (const name of EMAIL_TEMPLATE_PLACEHOLDERS[key]) {
    // Supplied means it appears in email.ts as a property, e.g. `segmentLabel:` or
    // `memberLabel,` — either spelling, since the vars objects are shorthand-typed.
    const supplied = new RegExp(`\\b${name}\\s*[:,]`).test(EMAIL_SOURCE);
    if (!supplied) unsupplied.push(`${key}.${name}`);
  }
}
ok(
  "every declared placeholder is actually supplied by email.ts",
  unsupplied.length === 0,
  unsupplied.join(", ") || undefined
);

ok(
  "no sender keeps a hidden hardcoded CTA label fallback",
  !/copy\.buttonLabel\s*\|\|/.test(EMAIL_SOURCE) &&
    !/Copy\.buttonLabel\s*\|\|/.test(EMAIL_SOURCE)
);

ok(
  "the plain-text alternative always carries the link, even with a blank button",
  EMAIL_SOURCE.includes("function ctaTextLine(") &&
    EMAIL_SOURCE.includes("isBlankCopy(label) ? link :")
);

ok(
  "the CMS read falls back to the bundled defaults rather than throwing",
  EMAIL_SOURCE.includes("mergeEmailTemplates(data)") &&
    EMAIL_SOURCE.includes("return DEFAULT_EMAIL_TEMPLATES;")
);

ok(
  "the security-critical password reset stays non-editable",
  EMAIL_SOURCE.includes('kind: "password_reset"') &&
    !EMAIL_SOURCE.includes("emails.password_reset")
);

// ── Editor grouping ──────────────────────────────────────────────────────────

const groupedKeys = EMAIL_TEMPLATE_GROUPS.flatMap((group) => group.keys.map((k) => k.key));
ok(
  "the editor groups every declared key exactly once",
  groupedKeys.length === DECLARED_KEYS.length &&
    new Set(groupedKeys).size === groupedKeys.length &&
    DECLARED_KEYS.every((key) => groupedKeys.includes(key)),
  `grouped: ${groupedKeys.join(", ")}`
);

ok(
  "every grouped key exists in the defaults",
  groupedKeys.every((key) => Boolean(DEFAULT_EMAIL_TEMPLATES.emails[key]))
);

// ── Registration ─────────────────────────────────────────────────────────────

ok(
  "the module is registered in CONTENT_MODULE_META",
  CONTENT_MODULE_META.some((meta) => meta.slug === "email-templates") &&
    Boolean(getModuleMeta("email-templates"))
);

ok(
  "getDefaultPayload returns the bundled email copy",
  JSON.stringify(getDefaultPayload("email-templates")) === JSON.stringify(DEFAULT_EMAIL_TEMPLATES)
);

ok(
  "getAllDefaultPayloads seeds the module on a fresh database",
  Boolean(getAllDefaultPayloads()["email-templates"])
);

// ── Preview: every template renders, with no leftover placeholders ────────────

const previews = {} as Record<EmailTemplateKey, { subject: string; text: string; html: string }>;
for (const key of DECLARED_KEYS) {
  previews[key] = buildEmailPreview(key, DEFAULT_EMAIL_TEMPLATES);
}

ok(
  "every declared key has a sample",
  DECLARED_KEYS.every((key) => key in EMAIL_TEMPLATE_SAMPLES),
  DECLARED_KEYS.filter((key) => !(key in EMAIL_TEMPLATE_SAMPLES)).join(", ") || undefined
);

const emptyPreviews = DECLARED_KEYS.filter((key) => {
  const p = previews[key];
  return (
    p.subject.trim().length === 0 || p.text.trim().length === 0 || p.html.trim().length === 0
  );
});
ok(
  "every rendered preview has a non-empty subject, text and html",
  emptyPreviews.length === 0,
  emptyPreviews.join(", ") || undefined
);

// The load-bearing preview check: a placeholder the sample does not supply, or
// one mistyped so the renderer's regex cannot see it, survives into the output
// as literal braces. That is silent in a real email and invisible to `tsc`.
const leftoverBraces = DECLARED_KEYS.filter((key) => {
  const p = previews[key];
  return /\{\{/.test(p.subject + p.text + p.html);
});
ok(
  "no rendered preview leaves a {{placeholder}} behind",
  leftoverBraces.length === 0,
  leftoverBraces.join(", ") || undefined
);

ok(
  "**bold** in the default copy renders as <strong> in the preview",
  previews.mentee_answer.html.includes("<strong>") &&
    !previews.mentee_answer.text.includes("**")
);

// The "unsaved edits" property: the preview renders whatever copy it is handed,
// not the last-saved copy. This is what makes "I typed a new subject, show me"
// work — the editor passes its in-memory payload straight through.
const editedPreview = buildEmailPreview(
  "mentee_answer",
  mergeEmailTemplates({ emails: { mentee_answer: { subject: "Edited — {{segmentLabel}}" } } })
);
ok(
  "the preview renders the copy it is given, so unsaved edits show up",
  editedPreview.subject === "Edited — Sample Segment" &&
    editedPreview.subject !== previews.mentee_answer.subject
);

// ── Preview ↔ sender: one builder, two callers ────────────────────────────────

/** Text of a top-level function, from its declaration to the next `export`. */
function functionBody(source: string, name: string): string {
  const start = source.indexOf(`function ${name}(`);
  if (start === -1) return "";
  const rest = source.slice(start + 1);
  const nextExport = rest.indexOf("\nexport ");
  return nextExport === -1 ? rest : rest.slice(0, nextExport);
}

const builderDelegations: [string, string][] = [
  ["sendMenteeAnswerEmail", "buildMenteeAnswerEmail("],
  ["sendMentorReminderEmail", "buildMentorReminderEmail("],
  ["sendNewQuestionToMentorPoolEmail", "buildNewQuestionEmail("],
  ["sendJobChatQuestionToHirer", "buildJobChatQuestionEmail("],
  ["sendJobChatAnswerToCandidate", "buildJobChatAnswerEmail("],
  ["sendJobInterviewOfferEmails", "buildJobInterviewOfferEmails("],
  ["sendBillingReceiptEmail", "buildBillingReceiptEmail("],
];
const missingDelegation = builderDelegations.filter(
  ([sender, builder]) => !functionBody(EMAIL_SOURCE, sender).includes(builder)
);
ok(
  "each live sender delegates to its pure builder (preview and send share one path)",
  missingDelegation.length === 0,
  missingDelegation.map(([sender, builder]) => `${sender} → ${builder}`).join(", ") || undefined
);

// ── Email Log stays private-safe, and test sends stay visible ─────────────────

const EMAILS_ROUTE_SOURCE = fs.readFileSync(
  path.join(process.cwd(), "src/app/api/admin/emails/route.ts"),
  "utf8"
);
ok(
  "the Email Log endpoint still returns bodyText and never bodyHtml",
  EMAILS_ROUTE_SOURCE.includes("bodyText") && !/bodyHtml\s*:/.test(EMAILS_ROUTE_SOURCE)
);

const DEMO_LOG_SOURCE = fs.readFileSync(
  path.join(process.cwd(), "src/lib/demo-email-log.ts"),
  "utf8"
);
ok(
  "the test-send kind has a friendly label, not the raw kind string",
  demoEmailKindLabel("email_template_test") === "Test send from Email Templates"
);

const privateSetMatch = DEMO_LOG_SOURCE.match(
  /PRIVATE_LIVE_CHAT_KINDS = new Set<DemoEmailKind>\(\[([\s\S]*?)\]\)/
);
ok(
  "a test send's body is not redacted like a Live Chat notification",
  Boolean(privateSetMatch) && !privateSetMatch![1].includes("email_template_test")
);

const alwaysLogMatch = DEMO_LOG_SOURCE.match(
  /ALWAYS_LOG_KINDS = new Set<DemoEmailKind>\(\[([\s\S]*?)\]\)/
);
ok(
  "a test send is always written to the Email Log, even when delivered",
  Boolean(alwaysLogMatch) && alwaysLogMatch![1].includes("email_template_test")
);

// ── Admin routes: guarded, and the send route cannot become a relay ───────────

const PREVIEW_ROUTE_SOURCE = fs.readFileSync(
  path.join(process.cwd(), "src/app/api/admin/email-preview/route.ts"),
  "utf8"
);
const SEND_ROUTE_SOURCE = fs.readFileSync(
  path.join(process.cwd(), "src/app/api/admin/email-preview/send/route.ts"),
  "utf8"
);

ok(
  "the preview route is guarded by assertSoleAdmin",
  PREVIEW_ROUTE_SOURCE.includes("assertSoleAdmin")
);
ok(
  "the test-send route is guarded by assertSoleAdmin",
  SEND_ROUTE_SOURCE.includes("assertSoleAdmin")
);
ok(
  "the test-send route accepts a single email address only, never an array",
  SEND_ROUTE_SOURCE.includes("z.string()") &&
    SEND_ROUTE_SOURCE.includes(".email()") &&
    !/to:\s*z\.array/.test(SEND_ROUTE_SOURCE)
);
ok(
  "the test-send route logs under the dedicated test-send kind",
  SEND_ROUTE_SOURCE.includes('kind: "email_template_test"')
);

console.log(
  failed === 0 ? "\n✅ All email-copy checks passed." : `\n❌ ${failed} check(s) failed.`
);
process.exit(failed === 0 ? 0 : 1);
