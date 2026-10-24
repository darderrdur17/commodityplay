/**
 * Referral code formatting: normalisation, validation and generation.
 *
 * ⚠️ SERVER-ORIENTED. `generateReferralCode()` imports `node:crypto`, so this
 * module must never be pulled into a client component — the codes are generated
 * by the admin API route, never by the browser. (Client-side code that needs to
 * hint at the format should just describe it in copy.)
 */

import { randomInt } from "node:crypto";

/**
 * Unambiguous alphabet for generated codes: the digits `0` and `1` and the
 * letters `O` and `I` are EXCLUDED because members will retype a code by hand
 * from a message or a slide, and those four are the classic transcription
 * errors (`0`/`O`, `1`/`I`). 24 letters + 8 digits = 32 symbols.
 */
export const REFERRAL_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** How many symbols in each hyphen-separated block. */
export const REFERRAL_CODE_BLOCK_LENGTH = 4;

/**
 * The canonical shape produced by {@link generateReferralCode}: `CP-XXXX-XXXX`.
 *
 * The character class is written out as `[A-HJ-NP-Z2-9]` rather than `[A-Z0-9]`
 * so the pattern itself rejects the four ambiguous symbols — a hand-typed
 * `CP-0000-0000` must not pass validation just because it is the right length.
 */
export const REFERRAL_CODE_PATTERN = /^CP-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;

/**
 * Looser shape for an administrator-supplied CUSTOM code (campaign names such as
 * `GLENCORE-2026` are useful). Still restricted to the same safe character set,
 * 3–32 characters, and it may not start or end with a hyphen.
 *
 * Every generated code satisfies this pattern too, so there is only ever one
 * rule to reason about.
 */
export const REFERRAL_CODE_CUSTOM_PATTERN = /^[A-Z0-9](?:[A-Z0-9-]{1,30})[A-Z0-9]$/;

/** Longest accepted input. Matches the `z.string().max(64)` cap on the routes. */
export const REFERRAL_CODE_MAX_LENGTH = 64;

/**
 * Normalise a code the way it will be stored and looked up.
 *
 * Members paste codes with stray spaces, lowercase letters and trailing
 * punctuation, so:
 *   * uppercase everything (the column stores UPPERCASE),
 *   * drop all whitespace (a code has none, and `CP-AB12 CD34` is meant to be
 *     `CP-AB12-CD34`'s neighbourhood, not a different code),
 *   * drop every character outside `A-Z0-9-`,
 *   * collapse repeated hyphens and trim the edges.
 *
 * @returns the normalised code, or `""` when nothing usable is left.
 */
export function normalizeReferralCode(input: string): string {
  if (typeof input !== "string") return "";

  return input
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[^A-Z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Generate a random code in the `CP-XXXX-XXXX` format.
 *
 * Uses `crypto.randomInt` (not `Math.random`) because a guessable code is a
 * discount anyone can mint. With a 32-symbol alphabet the space is 32^8 ≈ 1.1e12,
 * and the unique index on `ReferralCode.code` catches the astronomically unlikely
 * collision (the admin route retries on `P2002`).
 */
export function generateReferralCode(): string {
  const block = (): string => {
    let out = "";
    for (let i = 0; i < REFERRAL_CODE_BLOCK_LENGTH; i++) {
      out += REFERRAL_CODE_ALPHABET[randomInt(0, REFERRAL_CODE_ALPHABET.length)];
    }
    return out;
  };

  return `CP-${block()}-${block()}`;
}

/**
 * True when `code` (already normalised) is acceptable as an admin custom code.
 *
 * Deliberately LOOSER than {@link REFERRAL_CODE_PATTERN}: a campaign name such as
 * `GLENCORE-2026` is useful to the operator even though it contains the ambiguous
 * digits the generator avoids, and the risk of a hand-typed campaign code being
 * misread is far lower than for a random string read off a slide.
 */
export function isAcceptableCustomReferralCode(code: string): boolean {
  return REFERRAL_CODE_CUSTOM_PATTERN.test(code);
}
