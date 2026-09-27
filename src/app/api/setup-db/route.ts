import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { recordAdminAudit } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";
import { isDatabaseSeeded, setupProductionDatabase } from "@/lib/setup-database";
import { RATE_LIMITS, checkRateLimit, getClientIp, rateLimitKey, rateLimitResponse } from "@/lib/rate-limit";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * Constant-time bearer-token comparison.
 *
 * A plain `===` on the secret short-circuits at the first differing byte, which
 * leaks the secret one byte at a time to an attacker who can time the response.
 * The length check is unavoidable (timingSafeEqual throws on a length mismatch)
 * but only reveals the secret's length, which is not sensitive.
 */
function secretMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Read-only check — safe to call without auth (does not expose secrets). */
export async function GET() {
  try {
    const seeded = await isDatabaseSeeded();
    return NextResponse.json({
      seeded,
      // Generic on purpose: echoing the demo password here would hand an
      // unauthenticated caller a working credential for every seeded account.
      message: seeded
        ? "Database is seeded."
        : "Database not seeded — POST /api/setup-db with SETUP_SECRET (see VERCEL_DEMO_SETUP.md).",
    });
  } catch (err) {
    console.error("[setup-db GET]", err);
    return NextResponse.json({ seeded: false, error: "Database unreachable" }, { status: 503 });
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * One-time production DB setup when local port 5432 is blocked.
 * POST with header: Authorization: Bearer <SETUP_SECRET>
 */
export async function POST(req: NextRequest) {
  const secret = process.env.SETUP_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "SETUP_SECRET not configured on server" }, { status: 503 });
  }

  const auth = req.headers.get("authorization") ?? "";
  // Rate-limit setup-db attempts by IP: 5 per hour. A wrong secret still
  // counts toward the limit so brute-force secret guessing is slowed.
  const limit = await checkRateLimit(
    rateLimitKey("setup-db", getClientIp(req)),
    RATE_LIMITS.setupDb
  );
  if (!limit.allowed) {
    return rateLimitResponse(limit);
  }

  if (!secretMatches(auth, `Bearer ${secret}`)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.DATABASE_URL?.includes("neon.tech")) {
    return NextResponse.json({ error: "DATABASE_URL does not look like Neon" }, { status: 400 });
  }

  try {
    const { alreadySeeded, demoPasswordsCleared } = await setupProductionDatabase();
    const { syncGlossaryFromDefaults } = await import("@/lib/content/repository");
    const glossarySync = await syncGlossaryFromDefaults();
    const { getFeedbackDemoUserStatuses } = await import("@/lib/feedback-demo-users");
    const feedbackUsers = await getFeedbackDemoUserStatuses(prisma);

    await recordAdminAudit({
      actorEmail: "setup-db",
      action: "setup-db.run",
      metadata: {
        alreadySeeded,
        demoPasswordsCleared,
        glossaryTerms: glossarySync.termCount,
      },
    });

    return NextResponse.json({
      success: true,
      alreadySeeded,
      glossaryTerms: glossarySync.termCount,
      feedbackUsers,
      message: alreadySeeded
        ? "Database already seeded — demo accounts and glossary refreshed."
        : "Database schema applied and demo accounts seeded.",
      // Deliberately NOT returning the demo passwords that were just written.
      // This endpoint is reachable by anyone holding SETUP_SECRET, so echoing
      // them turned one leaked secret into working credentials for every seeded
      // account. In production the hashes are cleared again before we reply.
      demoPasswordsCleared,
    });
  } catch (err) {
    console.error("[setup-db]", err);
    const message = err instanceof Error ? err.message : "Setup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
