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
  rateLimitUnavailableResponse,
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

  // 🔴 FAIL CLOSED here, unlike every other rate-limited route.
  //
  // The 20-per-15-minutes cap is the only thing standing between a `CP-XXXX-XXXX`
  // space and an attacker walking it, so it is a SECURITY control, not a fairness
  // one. Before the Postgres store existed, an unset Upstash silently degraded this
  // to a per-lambda counter — 20 × N warm lambdas — which is not that control.
  //
  // If no shared store can be reached, refuse the request (503) rather than let it
  // through on an inflated limit. `/api/stripe/checkout` re-validates the code
  // anyway, so a member is inconvenienced for a moment, never overcharged.
  const limit = await checkRateLimit(
    rateLimitKey("referral-validate", getClientIp(req), session.user.id),
    RATE_LIMITS.referralValidate,
    Date.now(),
    { onSharedStoreUnavailable: "deny" }
  );
  if (!limit.allowed) {
    // `degraded` means the limiter could not count, not that the member over-tried.
    if (limit.degraded) return rateLimitUnavailableResponse(limit);
    return rateLimitResponse(limit);
  }

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
