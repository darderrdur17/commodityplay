import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sign } from "jsonwebtoken";
import { z } from "zod";
import { normalizeEmail } from "@/lib/admin-access";
import { isDemoAccountEmail, isProductionRuntime } from "@/lib/demo-guard";
import { prisma } from "@/lib/prisma";
import { RATE_LIMITS, checkRateLimit, getClientIp, rateLimitKey, rateLimitResponse } from "@/lib/rate-limit";

/** Issuer/audience pin the token to this app and this client. */
export const MOBILE_JWT_ISSUER = "commodityplay";
export const MOBILE_JWT_AUDIENCE = "mobile";

/**
 * A real bcrypt hash of a throwaway value, so the "no such account" branch costs
 * the same as "wrong password". See the web credentials provider for the same
 * reasoning.
 */
const DUMMY_PASSWORD_HASH = "$2a$12$dJtHRrHeskhRbdk2lfp.G.imGUJX3xSCEYEQsbTAuG3Bx1djU8bti";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/**
 * Mobile access token.
 *
 * `tokenVersion` is carried in the payload so a token can be revoked
 * server-side: bumping `User.tokenVersion` invalidates every token already
 * issued to that account, without needing a server-side session store.
 */
function createToken(userId: string, tokenVersion: number) {
  return sign({ userId, tokenVersion }, process.env.AUTH_SECRET!, {
    expiresIn: "7d",
    issuer: MOBILE_JWT_ISSUER,
    audience: MOBILE_JWT_AUDIENCE,
  });
}

export async function POST(req: NextRequest) {
  const limit = checkRateLimit(
    rateLimitKey("mobile-login", getClientIp(req)),
    RATE_LIMITS.login
  );
  if (!limit.allowed) return rateLimitResponse(limit);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const email = normalizeEmail(parsed.data.email);

  // Same rule as the web credentials provider: seeded demo inboxes share one
  // public password and are refused outright in production. The response is the
  // generic credential failure so it cannot be used to probe for accounts.
  if (isProductionRuntime() && isDemoAccountEmail(email)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Always spend exactly one bcrypt comparison so a missing account is not
  // measurably faster than a wrong password.
  const passwordHash = user?.passwordHash ?? DUMMY_PASSWORD_HASH;
  const valid = await bcrypt.compare(parsed.data.password, passwordHash);
  if (!user || !user.passwordHash || !valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = createToken(user.id, user.tokenVersion);
  return NextResponse.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tier: user.tier,
      track: user.track,
      persona: user.persona,
      mentorCredits: user.mentorCredits,
    },
  });
}
