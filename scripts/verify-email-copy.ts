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

console.log(
  failed === 0 ? "\n✅ All email-copy checks passed." : `\n❌ ${failed} check(s) failed.`
);
process.exit(failed === 0 ? 0 : 1);
