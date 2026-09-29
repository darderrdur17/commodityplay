import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasResolvedAccess } from "@/lib/entitlements";
import { prisma } from "@/lib/prisma";
import { ensureFeaturesInfrastructure } from "@/lib/setup-database";

export async function requireEliteSession() {
  await ensureFeaturesInfrastructure();

  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    // `email` feeds the administrator override; the billing columns are required by
    // `hasResolvedAccess` — without them a lapsed or `past_due` Elite subscription
    // would still pass on the stored `tier` value alone.
    select: {
      id: true,
      email: true,
      tier: true,
      stripeStatus: true,
      stripeCurrentPeriodEnd: true,
      stripePriceId: true,
    },
  });

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  // Authorise on the EFFECTIVE tier: Elite is a recurring plan, so it only counts
  // while Stripe reports the subscription live and the paid-through date has not
  // passed. Reading the stored `tier` alone would keep a failed card active.
  if (!hasResolvedAccess(user, "ELITE")) {
    return { error: NextResponse.json({ error: "Elite tier required" }, { status: 403 }) };
  }

  return { session, user };
}
