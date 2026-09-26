import { NextRequest } from "next/server";
import { verify } from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

/** Must match the values used when the token is signed in the mobile login route. */
const MOBILE_JWT_ISSUER = "commodityplay";
const MOBILE_JWT_AUDIENCE = "mobile";

interface MobileTokenPayload {
  userId: string;
  tokenVersion?: number;
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
