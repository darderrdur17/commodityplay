import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

const RESET_PREFIX = "password-reset:";
const TTL_MS = 60 * 60 * 1000;

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
