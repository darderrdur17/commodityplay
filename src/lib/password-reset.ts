import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

const RESET_PREFIX = "password-reset:";
const TTL_MS = 60 * 60 * 1000;

/** httpOnly cookie carrying the raw reset token between link-open and submit. */
export const RESET_COOKIE_NAME = "cp_reset_token";
/** Matches `TTL_MS` — the cookie is never useful longer than the token itself. */
export const RESET_COOKIE_MAX_AGE_SECONDS = TTL_MS / 1000;

export function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createPasswordResetToken(email: string) {
  const raw = randomBytes(32).toString("hex");
  const token = hashResetToken(raw);
  const identifier = `${RESET_PREFIX}${email.toLowerCase()}`;
  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({
    data: {
      identifier,
      token,
      expires: new Date(Date.now() + TTL_MS),
    },
  });
  return raw;
}

/**
 * Validate a token WITHOUT consuming it.
 *
 * Used when the emailed link is first opened, so the token can be moved out of
 * the URL into an httpOnly cookie before the user has typed anything. The token
 * is still single-use — only `consumePasswordResetToken` deletes it.
 */
export async function peekPasswordResetToken(raw: string): Promise<boolean> {
  if (!raw) return false;
  const token = hashResetToken(raw);
  const row = await prisma.verificationToken.findUnique({ where: { token } });
  if (!row || !row.identifier.startsWith(RESET_PREFIX) || row.expires < new Date()) {
    return false;
  }
  return true;
}

export async function consumePasswordResetToken(raw: string) {
  const token = hashResetToken(raw);
  const row = await prisma.verificationToken.findUnique({ where: { token } });
  if (!row || !row.identifier.startsWith(RESET_PREFIX) || row.expires < new Date()) {
    if (row) {
      await prisma.verificationToken.delete({ where: { token } }).catch(() => undefined);
    }
    return null;
  }
  await prisma.verificationToken.delete({ where: { token } });
  return row.identifier.slice(RESET_PREFIX.length);
}
