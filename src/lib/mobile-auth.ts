import { NextRequest } from "next/server";
import { verify } from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { ensureCoreInfrastructure } from "@/lib/setup-database";

/**
 * Issuer/audience that pin a mobile token to this app and this client.
 *
 * These are exported and imported by the login and register routes so all three
 * sites cannot drift apart. They were previously copy-pasted into each route,
 * which meant a typo in one place would silently mint tokens that the others
 * refuse to verify — a failure that only shows up as "logged out for no reason".
 *
 * They deliberately do NOT live in a route file: a Next.js route may only export
 * HTTP verbs and a small allow-list of config values, so exporting them from
 * `login/route.ts` failed the build with
 * "MOBILE_JWT_ISSUER is not a valid Route export field".
 */
export const MOBILE_JWT_ISSUER = "commodityplay";
export const MOBILE_JWT_AUDIENCE = "mobile";

interface MobileTokenPayload {
  userId: string;
  tokenVersion?: number;
}

/**
 * Bump `User.tokenVersion` so every mobile JWT already issued for this user
 * fails the check in {@link getMobileUser}.
 *
 * Call this in the same Prisma transaction as any password write. A bump that
 * lands after the password commit (or that fails independently) leaves the
 * 7-day tokens valid against the new credential.
 */
export async function incrementUserTokenVersion(
  userId: string,
  extra?: { passwordHash?: string }
): Promise<number> {
  await ensureCoreInfrastructure();

  const updated = await prisma.$transaction(async (tx) => {
    return tx.user.update({
      where: { id: userId },
      data: {
        ...(extra?.passwordHash !== undefined ? { passwordHash: extra.passwordHash } : {}),
        tokenVersion: { increment: 1 },
      },
      select: { tokenVersion: true },
    });
  });

  return updated.tokenVersion;
}

export async function getMobileUser(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  let payload: MobileTokenPayload;
  try {
    // Pinning `issuer` and `audience` stops a token minted for any other purpose
    // (or a future second client) from being replayed against the mobile API.
    payload = verify(authHeader.slice(7), process.env.AUTH_SECRET!, {
      issuer: MOBILE_JWT_ISSUER,
      audience: MOBILE_JWT_AUDIENCE,
    }) as MobileTokenPayload;
  } catch {
    return null;
  }

  if (!payload?.userId) return null;

  // The `select` below reads `tokenVersion`, a column added by the 2026-09-26
  // security pass. Reconcile it first so a deploy that lands ahead of the column
  // cannot 500 every authenticated mobile request. Cached after the first call,
  // so this is a boolean check on the hot path.
  await ensureCoreInfrastructure();

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      name: true,
      email: true,
      tier: true,
      role: true,
      track: true,
      mentorCredits: true,
      tokenVersion: true,
      // Needed so mobile content gates can authorise on the EFFECTIVE tier.
      stripeStatus: true,
      stripeCurrentPeriodEnd: true,
      stripePriceId: true,
    },
  });

  if (!user) return null;

  // Revocation check. Bumping `User.tokenVersion` (e.g. on password reset or a
  // suspected compromise) invalidates every token already issued to that user,
  // which a bare 7-day JWT could not otherwise do.
  if ((payload.tokenVersion ?? 0) !== user.tokenVersion) return null;

  const { tokenVersion: _tokenVersion, ...safeUser } = user;
  return safeUser;
}

export function hasTierAccess(userTier: string, required: "STARTER" | "PRO" | "ELITE") {
  const levels = { STARTER: 0, PRO: 1, ELITE: 2 };
  return (levels[userTier as keyof typeof levels] ?? 0) >= levels[required];
}
