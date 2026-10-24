import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  RATE_LIMITS,
  checkRateLimit,
  getClientIp,
  rateLimitKey,
  rateLimitResponse,
} from "@/lib/rate-limit";
import { validateReferralCodeForMember } from "@/lib/referral-validation";

/**
 * `POST /api/referral/validate` — the "Validate" button on `/checkout`.
 *
 * This is a CONVENIENCE endpoint: it lets the page tell the member their code was
 * accepted before they are handed to Stripe. It is NOT the gate — `/api/stripe/
 * checkout` re-runs the identical check before it attaches any discount, so a
 * client that never calls this route gains nothing.
 *
 * A rejected code is a normal ANSWER, not a transport error: it returns HTTP 200
 * with `valid: false` and a `reason`, so the UI renders one message map. The only
 * non-200 responses are 401 (not signed in), 400 (malformed body) and 429 (rate
 * limited).
 */

const schema = z.object({
  code: z.string().max(64),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = await checkRateLimit(
    rateLimitKey("referral-validate", getClientIp(req), session.user.id),
    RATE_LIMITS.referralValidate
  );
  if (!limit.allowed) return rateLimitResponse(limit);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const userId = session.user.id;

  // The stored address is the authority for the domain classification (it is the
  // lowercased, unique column). The session copy is only a fallback for the
  // (impossible in practice) case of a session whose user row has no email.
  let email = session.user.email ?? "";
  try {
    const row = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (row?.email) email = row.email;
  } catch (err) {
    console.error("[referral/validate] member lookup failed; using session email", err);
  }

  try {
    const result = await validateReferralCodeForMember({
      code: parsed.data.code,
      userId,
      email,
    });

    // ONE response shape for every outcome, so the client never has to branch on
    // the presence of a field.
    return NextResponse.json({
      valid: result.valid,
      code: result.code,
      reason: result.reason,
      message: result.message,
      accountType: result.accountType,
      reward: result.reward,
    });
  } catch (err) {
    console.error("[referral/validate]", err);
    return NextResponse.json({ error: "Could not check that code" }, { status: 500 });
  }
}
