import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  marketingConsent: z.boolean(),
});

/**
 * Persist a member's marketing-consent decision from the login page.
 *
 * R-4 (team-lead override): the design doc proposed a login checkbox whose answer
 * was discarded. Collecting a consent signal and throwing it away is a compliance
 * liability, so this authed endpoint records it instead. Signup consent is stored
 * inline by `/api/auth/register`; this route exists for the login-time opt-in,
 * where the account already exists.
 *
 * `marketingConsentAt` is stamped on BOTH branches so the column always records
 * the *last* consent event (opt-in or opt-out), which is what an audit needs.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { marketingConsent } = parsed.data;

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        marketingConsent,
        marketingConsentAt: new Date(),
      },
      select: { id: true },
    });
    return NextResponse.json({ marketingConsent });
  } catch (err) {
    console.error("[account/marketing-consent]", err);
    return NextResponse.json({ error: "Could not save consent" }, { status: 500 });
  }
}
