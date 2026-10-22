/**
 * Line breaks and bullet points in plain-text CMS fields (owner request, Frances).
 *
 * Frances writes the weekly nudge "Now" line through the `/admin` panel and asked
 * for two things: more characters, and the ability to type bullet points. A
 * `<textarea>` stores exactly what she types — newlines and `-` markers included —
 * but the member page used to render the value as one inline run, so HTML collapsed
 * every newline to a space and a leading `-` stayed a literal hyphen. This module is
 * the render-time translation from that stored text to real paragraphs and lists.
 *
 * WHY THIS IS A RENDER-TIME TRANSFORMATION ONLY: the stored string keeps its
 * newlines and its `-` markers. Nothing here trims, strips, or rewrites the saved
 * value — the admin editor re-runs `normalizeSalesMarketNudgesPayload` on every
 * render and writes the result straight back through `onChange`, so any reshaping
 * here would land in the field she is typing in (and swallow the space bar or the
 * newline she just pressed).
 *
 * WHY THIS IS NOT `"use client"`: the member section is a Client Component but the
 * helper is a pure, React-agnostic parser plus a thin node mapper, so a Server
 * Component could import it too. A client-reference proxy is not a usable value, so
 * the function lives in a plain module both graphs can import — the same reasoning
 * as `src/lib/inline-bold.tsx`, which this module builds on so that `**bold**`
 * keeps working inside a bullet.
 */

import type * as React from "react";
import { renderInlineBold } from "@/lib/inline-bold";

/** A run of consecutive lines that render as one paragraph or one `<ul>`. */
export interface MultilineBlock {
  kind: "paragraph" | "bullets";
  lines: string[];
}

/**
 * A bullet line: optional leading whitespace, one marker character, then at least
 * one space/tab before the content.
 *
 * `\s+` (not `\s*`) after the marker is what keeps prose out of the list. A line
 * such as `"**bold** text"` starts with `*` but the next character is another `*`,
 * not whitespace, so it stays a paragraph and the inline-bold parser gets it.
 */
const BULLET_LINE = /^\s*[-*•–·][ \t]+(.*)$/;

/** True when the line would render as a bullet (marker + space + content). */
export function isBulletLine(line: string): boolean {
  return BULLET_LINE.test(line);
}

/**
 * Split stored text into paragraph and bullet blocks.
 *
 * Pure and React-free, so it can be exercised from a plain tsx script.
 *
 *   - `"- a\n- b"`        -> `[{ kind: "bullets", lines: ["a", "b"] }]`
 *   - `"intro\n\n- a"`    -> `[{ kind: "paragraph", lines: ["intro"] },
 *                             { kind: "bullets", lines: ["a"] }]`
 *   - `"one\ntwo"`        -> `[{ kind: "paragraph", lines: ["one", "two"] }]`
 *   - `"- a\nplain\n- b"` -> bullets, paragraph, bullets — a change of kind always
 *                            starts a new block, so the list cannot swallow prose
 *
 * Blank lines separate blocks; consecutive bullet lines join the open bullets block
 * and consecutive plain lines join the open paragraph block. Paragraph lines keep
 * their `**bold**` markers and are joined with a single space at render time, which
 * reproduces how the value looked before this module existed (HTML collapsed the
 * newlines) while still letting bullets start a list.
 */
export function parseMultilineText(text: string): MultilineBlock[] {
  const blocks: MultilineBlock[] = [];
  let open: MultilineBlock | null = null;

  for (const rawLine of text.split(/\r?\n/)) {
    // A blank line closes whatever block was open, so the next line starts fresh.
    if (rawLine.trim() === "") {
      open = null;
      continue;
    }

    const bullet = BULLET_LINE.exec(rawLine);
    if (bullet) {
      // `match[1]` is always a string for `(.*)`; the fallback keeps the type honest.
      const content = bullet[1] ?? "";
      if (open?.kind === "bullets") {
        open.lines.push(content);
      } else {
        open = { kind: "bullets", lines: [content] };
        blocks.push(open);
      }
      continue;
    }

    if (open?.kind === "paragraph") {
      open.lines.push(rawLine);
    } else {
      open = { kind: "paragraph", lines: [rawLine] };
      blocks.push(open);
    }
  }

  return blocks;
}

/**
 * Map {@link parseMultilineText} onto React nodes.
 *
 * Every line goes through `renderInlineBold` so `**bold**` works inside a bullet
 * exactly as it does in a paragraph. Never uses `dangerouslySetInnerHTML` — the
 * input is text, not HTML, so building nodes is both safer and sufficient.
 *
 * Block spacing is left to the caller (the member page wraps the output in a
 * `space-y-2` container) so the same helper can sit in a tight inline row.
 */
export function renderMultilineText(text: string): React.ReactNode {
  return parseMultilineText(text).map((block, blockIndex) => {
    if (block.kind === "bullets") {
      return (
        <ul key={`bullets-${blockIndex}`} className="list-disc pl-4 space-y-1">
          {block.lines.map((line, lineIndex) => (
            <li key={`line-${lineIndex}`}>{renderInlineBold(line)}</li>
          ))}
        </ul>
      );
    }
    return <p key={`paragraph-${blockIndex}`}>{renderInlineBold(block.lines.join(" "))}</p>;
  });
}
