/**
 * Split a plan feature label into its heading and its descriptive caption.
 *
 * A feature label is a single string in the CMS (`FeatureComparisonItem.name`),
 * and the owner writes them in the form `"Full Playbook — all 9 chapters"`. The
 * owner asked (15 Oct 2026) for the heading to read bold while the caption stays
 * regular, so the dash is treated as the heading/caption delimiter.
 *
 * ---------------------------------------------------------------------------
 * ⚠️ WHY THIS IS A STRING SPLIT AND NOT A SCHEMA CHANGE
 * ---------------------------------------------------------------------------
 * The correct-looking fix is a separate `caption` field on
 * `FeatureComparisonItem`. That would mean a migration, a new input in the
 * Pricing admin card, and a backfill of the stored `pricing.comparison.groups`
 * payload — a lot of surface for a typographic distinction.
 *
 * The dash already carries the intent, and splitting on it has a property the
 * schema change would not: **the owner controls the split herself.** Put a dash
 * in the label and everything to its left becomes the bold heading; take it out
 * and the whole label is a heading. No admin work, no deploy.
 *
 * A label with no dash is therefore all heading — it simply has no caption, and
 * renders fully bold. That is the intended reading, not a parsing failure.
 */

/** One parsed label. */
export interface FeatureLabelParts {
  /** Always non-empty. Rendered bold. */
  heading: string;
  /** The dash that separated the two halves, verbatim including its spaces. `null` when there is no caption. */
  separator: string | null;
  /** The descriptive half. `null` when there is no caption. Never bold. */
  caption: string | null;
}

/**
 * A dash surrounded by whitespace, so it reads as a separator rather than part
 * of a word. The whitespace requirement is what protects the many live labels
 * that hyphenate inside a word — `"auto-inclusion"`, `"industry-grade"`,
 * `"practitioner-vetted"` — from being torn in half.
 *
 * Covers the em dash the owner actually types, the en dash, and a plain hyphen.
 */
const HEADING_CAPTION_SEPARATOR = /\s+[—–-]\s+/;

/**
 * Split `label` on its first dash separator.
 *
 * A label whose dash is at either end (`"— caption"`, `"heading —"`) is treated
 * as having no separator at all: a bold heading with no text under it, or an
 * empty heading, is worse than leaving the string whole. In that case the caller
 * renders the original label, bold, exactly as before.
 */
export function splitFeatureLabel(label: string): FeatureLabelParts {
  const match = HEADING_CAPTION_SEPARATOR.exec(label);
  if (!match) return { heading: label, separator: null, caption: null };

  const heading = label.slice(0, match.index);
  const caption = label.slice(match.index + match[0].length);

  // A separator with nothing on one side is not a heading/caption pair.
  if (!heading.trim() || !caption.trim()) {
    return { heading: label, separator: null, caption: null };
  }

  return { heading, separator: match[0], caption };
}
