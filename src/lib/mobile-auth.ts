import { NextRequest } from "next/server";
import { verify } from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

export async function getMobileUser(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  try {
    const payload = verify(authHeader.slice(7), process.env.AUTH_SECRET!) as { userId: string };
    return await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, tier: true, role: true, track: true, mentorCredits: true },
    });
  } catch {
    return null;
  }
}

export function hasTierAccess(userTier: string, required: "STARTER" | "PRO" | "ELITE") {
  const levels = { STARTER: 0, PRO: 1, ELITE: 2 };
  return (levels[userTier as keyof typeof levels] ?? 0) >= levels[required];
}
