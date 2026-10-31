import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
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
  // Caps matter: `.optional()` alone let an unauthenticated caller persist an
  // arbitrarily long name or address straight into `JobWaitlistEntry`.
  email: z.string().trim().email().max(254, "Email is too long").optional(),
  name: z.string().trim().max(200, "Name is too long").optional(),
  track: z.enum(["CAREER", "SALES"]).optional().default("CAREER"),
  gdprOpt: z.boolean().refine((v) => v, "GDPR consent required"),
});

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function findWaitlistHit(email: string, userId?: string | null) {
  const normalized = normalizeEmail(email);
  return prisma.jobWaitlistEntry.findFirst({
    where: {
      OR: [
        { email: normalized },
        ...(userId ? [{ userId }] : []),
      ],
    },
  });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ enrolled: false, authenticated: false });
  }

  const hit = await findWaitlistHit(session.user.email, session.user.id);
  return NextResponse.json({
    enrolled: Boolean(hit),
    authenticated: true,
    email: normalizeEmail(session.user.email),
    name: session.user.name ?? "",
    track: session.user.track ?? "CAREER",
  });
}

export async function POST(req: NextRequest) {
  // Public and unauthenticated; each accepted POST writes two rows.
  const limit = await checkRateLimit(
    rateLimitKey("waitlist", getClientIp(req)),
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

  const email = normalizeEmail(session?.user?.email || parsed.data.email || "");
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const name = session?.user?.name || parsed.data.name;
  const track = session?.user?.track || parsed.data.track;

  const existing = await findWaitlistHit(email, session?.user?.id);
  if (existing) {
    return NextResponse.json({ success: true, alreadyEnrolled: true, message: "Already on the waitlist!" });
  }

  await prisma.jobWaitlistEntry.create({
    data: {
      email,
      name,
      track,
      gdprOpt: parsed.data.gdprOpt,
      ...(session?.user?.id && { userId: session.user.id }),
    },
  });

  await prisma.emailSubscriber.upsert({
    where: { email },
    update: {},
    create: { email, name, source: "waitlist" },
  });

  return NextResponse.json({ success: true, message: "You're on the list!" }, { status: 201 });
}
