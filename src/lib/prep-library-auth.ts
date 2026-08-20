import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasAccess } from "@/lib/utils";
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
    select: { id: true, tier: true, track: true, role: true },
  });

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  if (!hasAccess(user.tier, "PRO")) {
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
