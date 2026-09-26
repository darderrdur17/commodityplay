import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { normalizeEmail } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";
import { notifyOperatorLead } from "@/lib/email";
import { RATE_LIMITS, checkRateLimit, getClientIp, rateLimitKey, rateLimitResponse } from "@/lib/rate-limit";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  plan: z.enum(["starter", "pro", "elite"]).optional().default("starter"),
  track: z.enum(["CAREER", "SALES"]).default("CAREER"),
});

/**
 * Response for a request that cannot create an account.
 *
 * Deliberately identical whether or not the address is already registered: a
 * distinct "account already exists" reply is a user-enumeration oracle that
 * tells an attacker which addresses are worth attacking.
 */
const GENERIC_SIGNUP_FAILURE =
  "We could not create that account. If you already have one, sign in instead or reset your password.";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { name, password, track } = parsed.data;
    // Store the normalised form so `Foo@X.com` and `foo@x.com` are one account.
    const email = normalizeEmail(parsed.data.email);

    const limit = checkRateLimit(
      rateLimitKey("register", getClientIp(req)),
      RATE_LIMITS.register
    );
    if (!limit.allowed) return rateLimitResponse(limit);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: GENERIC_SIGNUP_FAILURE }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        tier: "STARTER",
        track,
        onboardingDone: false,
      },
    });

    // Add to email subscriber list
    await prisma.emailSubscriber.upsert({
      where: { email },
      update: { subscribed: true },
      create: { email, name, source: "starter-signup", subscribed: true },
    });

    void notifyOperatorLead({
      kind: "operator_member_signup",
      subject: "New starter member signup",
      lines: [
        { label: "Name", value: name },
        { label: "Email", value: email },
        { label: "Track", value: track },
        { label: "Tier", value: "STARTER" },
      ],
    });

    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
  } catch (error) {
    console.error("[register]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
