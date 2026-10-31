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

/**
 * Field caps are REQUIRED, not cosmetic. Without `.max()` this endpoint accepted a
 * 200,000-character message and persisted it: an unauthenticated caller could grow
 * the table at no cost, and every such row is also copied into the operator email.
 * `mentor-apply` already uses this pattern; this route now matches it.
 */
const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200, "Name is too long"),
  email: z.string().trim().email().max(254, "Email is too long"),
  message: z.string().trim().min(1, "Message is required").max(5000, "Message is too long"),
});

export async function POST(req: NextRequest) {
  // Every accepted POST emails the operator, so this is the most abusable public
  // write in the app. 5/hour per IP bounds it without getting in a real user's way.
  const limit = await checkRateLimit(
    rateLimitKey("contact", getClientIp(req)),
    RATE_LIMITS.contactMessage
  );
  if (!limit.allowed) {
    return rateLimitResponse(limit, "Too many messages. Please try again later.");
  }

  try {
    // A malformed body is a client mistake: 400, not the 500 the old `req.json()`
    // produced (it threw into the catch-all and logged a parse stack).
    const body = await req.json().catch(() => null);
    if (body === null) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { name, message } = parsed.data;
    const email = normalizeEmail(parsed.data.email);

    const { ensureCoreInfrastructure } = await import("@/lib/setup-database");
    await ensureCoreInfrastructure();

    await prisma.contactMessage.create({ data: { name, email, message } });

    await prisma.emailSubscriber.upsert({
      where: { email },
      update: {},
      create: { email, name, source: "contact" },
    });

    void notifyOperatorLead({
      kind: "operator_contact",
      subject: "New Contact Us message",
      lines: [
        { label: "Name", value: name },
        { label: "Email", value: email },
        { label: "Message", value: message },
      ],
    });

    return NextResponse.json({ success: true, message: "Message sent!" }, { status: 201 });
  } catch (err) {
    console.error("[contact]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
