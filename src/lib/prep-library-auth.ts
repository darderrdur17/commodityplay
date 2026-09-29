import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasResolvedAccess } from "@/lib/entitlements";
import { prisma } from "@/lib/prisma";
import type { Track } from "@prisma/client";
import { ensureFeaturesInfrastructure } from "@/lib/setup-database";

export async function requireProSession() {
  await ensureFeaturesInfrastructure();

  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    // `email` feeds the administrator override; the billing columns are needed by
    // `hasResolvedAccess` so an expired Elite subscription cannot fall back to a
    // paid tier on the stored value alone.
    select: {
      id: true,
      email: true,
      tier: true,
      track: true,
      role: true,
      stripeStatus: true,
      stripeCurrentPeriodEnd: true,
      stripePriceId: true,
    },
  });

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  // Authorise on the effective tier, not the stored one. An allowlisted admin
  // resolves to ELITE and therefore clears PRO.
  if (!hasResolvedAccess(user, "PRO")) {
    return { error: NextResponse.json({ error: "Pro tier required" }, { status: 403 }) };
  }

  return { session, user };
}

export function canAccessPrepTrack(
  user: { track: Track; role: string },
  track: Track
): boolean {
  if (user.role === "ADMIN") return true;
  return user.track === track;
}
