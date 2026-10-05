/**
 * Renders admin-editable email copy.
 *
 * Pure by design: no clock, no database, no `email.ts` import. That is what makes
 * the substitution and escaping rules testable directly — see
 * `scripts/verify-email-copy.ts`.
 *
 * Supported syntax (see `src/data/email-templates-content.ts` for the why):
 *   {{placeholder}}  → replaced with a supplied value
 *   **bold**         → rendered as <strong>bold</strong>
 */

/** `{{name}}` — whitespace inside the braces is tolerated so typos still work. */
const PLACEHOLDER = /\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type CopyVars = Record<string, string | number | null | undefined>;

/** Plain-text rendering. For subject lines and the `text/` alternative. */
export function renderCopyText(template: string, vars: CopyVars = {}): string {
  return template
    .replace(PLACEHOLDER, (_match, key: string) => {
      const value = vars[key];
      return value === undefined || value === null ? "" : String(value);
    })
    // Bold is an HTML-only affordance. In plain text the markers are dropped
    // rather than left visible, so a subject line never reads "**Job Title**".
    .replace(/\*\*([^*]+)\*\*/g, "$1");
}

/**
 * HTML rendering.
 *
 * Order matters, and it is the whole security story here: values are escaped and
 * their `*` characters neutralised **before** the bold pass runs. So an admin can
 * write `**bold**`, but a *value* can neither inject markup nor open a bold run it
 * did not intend. Only the author's own markers produce <strong>.
 */
export function renderCopyHtml(template: string, vars: CopyVars = {}): string {
  const substituted = template.replace(PLACEHOLDER, (_match, key: string) => {
    const value = vars[key];
    if (value === undefined || value === null) return "";
    return escapeHtml(String(value)).replace(/\*/g, "&#42;");
  });
  return substituted.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

/** True when a rendered block is empty and should be omitted rather than rendered blank. */
export function isBlankCopy(value: string | null | undefined): boolean {
  return (value ?? "").trim().length === 0;
}

/**
 * Joins plain-text blocks with a blank line, dropping any that are empty.
 *
 * The HTML side omits a blanked paragraph outright, so the text alternative has
 * to do the same or the two versions disagree — an admin clearing the intro would
 * otherwise leave a run of blank lines in the plain-text body.
 */
export function joinTextBlocks(...blocks: (string | null | undefined)[]): string {
  return blocks
    .map((block) => (block ?? "").trim())
    .filter((block) => block.length > 0)
    .join("\n\n");
}

/**
 * Renders copy as a run of `<p>` blocks, splitting on blank lines.
 *
 * Several emails have a two-paragraph intro, and both paragraphs need to be
 * editable — otherwise the second sentence is stranded in code where an admin
 * cannot reach it. Blank input yields an empty string, so a cleared field removes
 * the paragraph rather than leaving an empty one.
 */
export function renderCopyParagraphsHtml(template: string, vars: CopyVars = {}): string {
  return (template ?? "")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0)
    .map((paragraph) => `<p>${renderCopyHtml(paragraph, vars)}</p>`)
    .join("");
}
