/**
 * Inline bold via `**double asterisks**` (owner request, Frances).
 *
 * Frances authors member-facing sales copy through the `/admin` panel, and she
 * wants to highlight phrases in the Ask / Listen for / Offer table by wrapping a
 * word in `**...**`.
 *
 * WHY THIS CANNOT BE A WYSIWYG EDITOR: every admin field is a plain controlled
 * `<textarea>` / `<input>`. A `<textarea>` cannot render rich text, so the `**`
 * markers ALWAYS stay visible as literal characters in the field she types into.
 * Bold can only ever appear in (a) a live preview rendered next to the field and
 * (b) the member-facing page. This module is the single source of truth for both.
 *
 * WHY THIS IS A RENDER-TIME TRANSFORMATION ONLY: the stored string keeps its
 * literal `**` markers. Nothing here trims, strips, or rewrites the saved value —
 * the admin editor re-runs `normalizeSalesMarketNudgesPayload` on every render and
 * writes the result straight back through `onChange`, so any reshaping here would
 * land in the field she is typing in.
 *
 * WHY THIS IS NOT `"use client"`: the member section is a Client Component but the
 * helper is a pure, React-agnostic function plus a thin node mapper, so a Server
 * Component could import it too. A client-reference proxy is not a usable value,
 * so the constant/function lives in a plain module both graphs can import (the
 * same reasoning as `src/lib/landing-cta.ts`).
 */

import type * as React from "react";

/** One run of text, flagged bold when it came from a **pair of asterisks**. */
export interface InlineBoldSegment {
  text: string;
  bold: boolean;
}

/**
 * Split `text` into bold and non-bold runs.
 *
 * Pure and React-free, so it can be exercised from a plain tsx script.
 *
 * The marker is `**`, and the bolded run may not contain an asterisk or a newline
 * (`[^*\n]+`). That single character class gives every edge case its behaviour:
 *
 *   - `"a **b** c"`      -> `[{ "a " }, { "b", bold }, { " c" }]`
 *   - `"**b**"`          -> `[{ "b", bold }]` — no empty leading/trailing runs
 *   - `"plain"`          -> `[{ "plain" }]`   — one non-bold run
 *   - `"**b"`            -> `[{ "**b" }]`     — unmatched marker stays literal
 *   - `"****"`           -> `[{ "****" }]`    — empty pair stays literal (`+` needs 1+ chars)
 *   - `"**a\nb**"`       -> `[{ "**a\nb**" }]`— a pair never spans a newline
 *   - `"**a****b**"`     -> two bold runs, no empty run between them, `b` kept
 *
 * INVARIANT: no non-marker character is ever dropped. For any input with no
 * matched pair the output is a single run whose text equals the input exactly.
 */
export function parseInlineBold(text: string): InlineBoldSegment[] {
  const segments: InlineBoldSegment[] = [];
  const pattern = /\*\*([^*\n]+)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    const start = match.index;
    // The plain run between the previous marker and this one (skipped when empty,
    // so `"**b**"` never gains an empty leading run).
    if (start > lastIndex) {
      segments.push({ text: text.slice(lastIndex, start), bold: false });
    }
    // `match[1]` is guaranteed non-empty by the `+` quantifier.
    segments.push({ text: match[1], bold: true });
    lastIndex = start + match[0].length;
  }

  // Trailing plain run after the last marker (skipped when empty).
  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), bold: false });
  }

  // No markers at all -> a single non-bold run. `text` is returned verbatim, which
  // keeps the round-trip invariant true for unmatched input (including `""`).
  if (segments.length === 0) {
    segments.push({ text, bold: false });
  }

  return segments;
}

/**
 * Map {@link parseInlineBold} onto React nodes.
 *
 * Bold runs become `<strong>` elements; plain runs are returned as bare strings so
 * no extra DOM is added. Never uses `dangerouslySetInnerHTML` — the input is text,
 * not HTML, so building nodes is both safer and sufficient.
 */
export function renderInlineBold(text: string): React.ReactNode {
  return parseInlineBold(text).map((segment, i) =>
    segment.bold ? <strong key={`b${i}`}>{segment.text}</strong> : segment.text
  );
}
