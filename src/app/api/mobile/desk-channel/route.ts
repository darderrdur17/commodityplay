import { NextRequest, NextResponse } from "next/server";
import { getDeskChannelData } from "@/lib/content/accessors";
export const dynamic = "force-dynamic";
export const revalidate = 0;
import { requireMobileContentAccess } from "@/lib/mobile-content";

export async function GET(req: NextRequest) {
  const access = await requireMobileContentAccess(req, "desk-channel");
  if (access.error) return access.error;

  const data = await getDeskChannelData();
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
