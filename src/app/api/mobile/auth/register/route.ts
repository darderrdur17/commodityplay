import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sign } from "jsonwebtoken";
import { z } from "zod";
import { normalizeEmail } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";
import { ensureCoreInfrastructure } from "@/lib/setup-database";
import { MOBILE_JWT_AUDIENCE, MOBILE_JWT_ISSUER } from "@/lib/mobile-auth";
import { notifyOperatorLead } from "@/lib/email";
import { RATE_LIMITS, checkRateLimit, getClientIp, rateLimitKey, rateLimitResponse } from "@/lib/rate-limit";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  track: z.enum(["CAREER", "SALES"]).default("CAREER"),
});

/**
 * Same generic failure for "email taken" and "input rejected" — a distinct 409
 * would let a caller enumerate which addresses already have accounts.
 */
const GENERIC_SIGNUP_FAILURE = "Could not create an account with those details.";

export async function POST(req: NextRequest) {
  const limit = checkRateLimit(
    rateLimitKey("mobile-register", getClientIp(req)),
    RATE_LIMITS.register
  );
  if (!limit.allowed) return rateLimitResponse(limit);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: GENERIC_SIGNUP_FAILURE }, { status: 400 });
  }

  const { name, password, track } = parsed.data;
  // Normalise on write so the address matches the web signup path and the
  // lowercased admin allowlist comparison.
  const email = normalizeEmail(parsed.data.email);

  // `create` below returns every scalar field, and the token reads
  // `user.tokenVersion`. Reconcile that column before the first `User` query.
  await ensureCoreInfrastructure();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: GENERIC_SIGNUP_FAILURE }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      tier: "STARTER",
      track,
    },
  });

  void notifyOperatorLead({
    kind: "operator_member_signup",
    subject: "New starter member signup",
    lines: [
      { label: "Name", value: name },
      { label: "Email", value: email },
      { label: "Track", value: track },
      { label: "Tier", value: "STARTER" },
      { label: "Source", value: "Mobile" },
    ],
  });

  // 7 days, and pinned to this issuer/audience, matching the mobile login route
  // so tokens from either path are verifiable by `getMobileUser`.
  const token = sign({ userId: user.id, tokenVersion: user.tokenVersion }, process.env.AUTH_SECRET!, {
    expiresIn: "7d",
    issuer: MOBILE_JWT_ISSUER,
    audience: MOBILE_JWT_AUDIENCE,
  });
  return NextResponse.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, tier: user.tier, track: user.track, persona: user.persona, mentorCredits: user.mentorCredits },
  }, { status: 201 });
}
