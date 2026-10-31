import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { normalizeEmail } from "@/lib/admin-access";
import { notifyOperatorLead } from "@/lib/email";
import {
  RATE_LIMITS,
  checkRateLimit,
  getClientIp,
  rateLimitKey,
  rateLimitResponse,
} from "@/lib/rate-limit";

const schema = z.object({
  // 254 is the RFC 5321 maximum for a forward-path; `.email()` alone does not bound
  // the string, so an arbitrarily long address would otherwise be persisted.
  email: z.string().trim().email("Please enter a valid email address").max(254, "Email is too long"),
});

export async function POST(req: NextRequest) {
  // Public and unauthenticated, and each new subscriber emails the operator.
  const limit = await checkRateLimit(
    rateLimitKey("newsletter", getClientIp(req)),
    RATE_LIMITS.leadCapture
  );
  if (!limit.allowed) return rateLimitResponse(limit);

  // A malformed body used to throw out of the handler entirely (this route had no
  // try/catch), surfacing as a 500. It is a client mistake, so answer 400.
  const body = await req.json().catch(() => null);
  if (body === null) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  // Lowercase before using the address as a key, so `Foo@X.com` and `foo@x.com`
  // resolve to the same subscriber rather than creating a duplicate row.
  const email = normalizeEmail(parsed.data.email);

  await prisma.emailSubscriber.upsert({
    where: { email },
    update: { subscribed: true },
    create: {
      email,
      source: "footer-newsletter",
      subscribed: true,
    },
  });

  void notifyOperatorLead({
    kind: "operator_newsletter",
    subject: "New newsletter signup",
    lines: [
      { label: "Email", value: email },
      { label: "Source", value: "Footer newsletter" },
    ],
  });

  return NextResponse.json({ success: true, message: "You're on the list!" });
}
