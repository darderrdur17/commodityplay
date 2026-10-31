import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  termsAccepted: z.literal(true),
  marketingConsent: z.boolean().default(false),
});

/**
 * Record the signup consent that the Google path cannot store inline.
 *
 * `/api/auth/register` writes `termsAcceptedAt` / `marketingConsent` as part of
 * creating the account. The Google button never reaches that route — it hands
 * control to Google and comes back with the account already created — so without
 * this endpoint a Google signup produced an account with **no recorded Terms
 * acceptance at all**. The signup form stashes the ticked boxes in
 * `sessionStorage` before the redirect and the onboarding page posts them here,
 * mirroring how `signupTrack` already survives the round trip.
 *
 * Two deliberate asymmetries between the two fields:
 *
 *  - **`termsAcceptedAt` is write-once.** The first acceptance is the legally
 *    meaningful one, so a later visit must not overwrite it with a newer date.
 *    The update is therefore conditional on the column being null.
 *  - **`marketingConsentAt` is stamped on every call**, opt-in or opt-out, so the
 *    column always records the *last* consent event — same contract as
 *    `/api/account/marketing-consent`.
 *
 * A `termsAccepted: false` payload is rejected by the schema rather than recorded.
 * Absence of an acceptance is represented by the column staying null, and this
 * route exists only to record an acceptance.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { marketingConsent } = parsed.data;

  try {
    const current = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { termsAcceptedAt: true },
    });
    if (!current) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        // Write-once: keep the original acceptance date if one already exists.
        ...(current.termsAcceptedAt ? {} : { termsAcceptedAt: now }),
        marketingConsent,
        marketingConsentAt: now,
      },
      select: { id: true },
    });

    return NextResponse.json({
      ok: true,
      termsAcceptedAt: current.termsAcceptedAt ?? now,
      marketingConsent,
    });
  } catch (err) {
    console.error("[account/signup-consent]", err);
    return NextResponse.json({ error: "Could not save consent" }, { status: 500 });
  }
}
