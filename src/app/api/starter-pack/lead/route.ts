import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { normalizeEmail } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import {
  RATE_LIMITS,
  checkRateLimit,
  getClientIp,
  rateLimitKey,
  rateLimitResponse,
} from "@/lib/rate-limit";

const schema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100, "First name is too long"),
  lastName: z.string().trim().min(1, "Last name is required").max(100, "Last name is too long"),
  email: z.string().trim().email("Please enter a valid work email").max(254, "Email is too long"),
  track: z.enum(["CAREER", "SALES"], { message: "Please select a track" }),
});

export async function POST(req: NextRequest) {
  // Public and unauthenticated: each accepted POST upserts a subscriber and can
  // rewrite a user's track.
  const limit = await checkRateLimit(
    rateLimitKey("starter-pack-lead", getClientIp(req)),
    RATE_LIMITS.leadCapture
  );
  if (!limit.allowed) return rateLimitResponse(limit);

  const session = await auth();
  // Malformed JSON is a client mistake: 400, not the unhandled 500 this used to be.
  const body = await req.json().catch(() => null);
  if (body === null) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { firstName, lastName, track } = parsed.data;
  // Normalise: this address is used both as an `EmailSubscriber` key and to look
  // up an existing `User`, so a mixed-case variant would miss the real account.
  const email = normalizeEmail(parsed.data.email);
  const name = `${firstName.trim()} ${lastName.trim()}`;

  const source = track === "CAREER" ? "starter-pack-modal-career" : "starter-pack-modal-sales";

  await prisma.emailSubscriber.upsert({
    where: { email },
    update: {
      subscribed: true,
      name,
      source,
    },
    create: {
      email,
      name,
      source,
      subscribed: true,
    },
  });

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    await prisma.user.update({
      where: { email },
      data: { track },
    });
  } else if (session?.user?.id) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { track },
    });
  }

  return NextResponse.json({ success: true, message: "Starter pack request received" }, { status: 201 });
}
