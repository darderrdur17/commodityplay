import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setupProductionDatabase } from "@/lib/setup-database";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * One-time production DB setup when local port 5432 is blocked.
 * POST with header: Authorization: Bearer <SETUP_SECRET>
 */
export async function POST(req: NextRequest) {
  const secret = process.env.SETUP_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "SETUP_SECRET not configured on server" }, { status: 503 });
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.DATABASE_URL?.includes("neon.tech")) {
    return NextResponse.json({ error: "DATABASE_URL does not look like Neon" }, { status: 400 });
  }

  try {
    const { alreadySeeded } = await setupProductionDatabase();
    const { syncGlossaryFromDefaults } = await import("@/lib/content/repository");
    const glossarySync = await syncGlossaryFromDefaults();

    return NextResponse.json({
      success: true,
      alreadySeeded,
      glossaryTerms: glossarySync.termCount,
      message: alreadySeeded
        ? "Database already seeded — demo accounts and glossary refreshed."
        : "Database schema applied and demo accounts seeded.",
      demo: {
        proSales: { email: "pro.vendor@demo.com", password: "Demo1234!" },
        eliteSales: { email: "elite.vendor@demo.com", password: "Demo1234!" },
      },
    });
  } catch (err) {
    console.error("[setup-db]", err);
    const message = err instanceof Error ? err.message : "Setup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
