import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getMobileUser, hasTierAccess } from "@/lib/mobile-auth";
import { resolveContentAssetMimeType } from "@/lib/content/asset-files";
import { getContentAsset } from "@/lib/content/repository";
import { hasAccess } from "@/lib/utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const asset = await getContentAsset(id);
  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const mobileUser = await getMobileUser(req);
  const session = mobileUser ? null : await auth();
  const tier = mobileUser?.tier ?? session?.user?.tier;
  const role = mobileUser ? "USER" : session?.user?.role;

  const mode = req.nextUrl.searchParams.get("mode");
  const forceView = mode === "view";
  const isPublicFooterGuide =
    asset.moduleSlug === "footer-guides" && forceView;

  if (!tier && !isPublicFooterGuide) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (
    tier &&
    role !== "ADMIN" &&
    !hasAccess(tier, asset.requiredTier)
  ) {
    return NextResponse.json({ error: "Insufficient tier" }, { status: 403 });
  }

  const mimeType = resolveContentAssetMimeType(asset.fileName, asset.mimeType);
  const forceDownload = mode === "download";
  const inline =
    forceView ||
    (!forceDownload && (mimeType.startsWith("image/") || mimeType === "application/pdf"));

  return new NextResponse(new Uint8Array(asset.data), {
    headers: {
      "Content-Type": mimeType,
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${asset.fileName.replace(/"/g, "")}"`,
      "Cache-Control": "no-store",
    },
  });
}
