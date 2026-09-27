import { NextResponse } from "next/server";
import { assertSoleAdmin } from "@/lib/admin-access";
import { listContentModules, seedContentModulesIfEmpty } from "@/lib/content/repository";

export async function GET() {
  const denied = await assertSoleAdmin();
  if (denied) return denied;

  try {
    await seedContentModulesIfEmpty();
    const modules = await listContentModules();
    return NextResponse.json(
      { modules },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("[admin/content] GET failed:", err);
    const message =
      err instanceof Error ? err.message : "Failed to load content modules";
    return NextResponse.json(
      {
        error:
          message.includes("ContentModule") || message.includes("does not exist")
            ? "CMS tables missing. Run: npx prisma db push && npm run db:seed"
            : "Failed to load content modules. Check database connection.",
      },
      { status: 500 }
    );
  }
}
