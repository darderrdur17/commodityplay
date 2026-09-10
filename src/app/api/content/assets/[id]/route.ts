import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getMobileUser } from "@/lib/mobile-auth";
import { resolveContentAssetMimeType } from "@/lib/content/asset-files";
import { getContentAsset } from "@/lib/content/repository";
import { hasAccess } from "@/lib/utils";
import {
  shouldStampPdfFooter,
  shouldWatermarkPaidPdf,
  stampPaidPdfWatermark,
} from "@/lib/content/pdf-watermark";

export const maxDuration = 30;

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
  const mimeType = resolveContentAssetMimeType(asset.fileName, asset.mimeType);
  const isPublicFooterGuide =
    asset.moduleSlug === "footer-guides" && forceView;
  const isPublicStarterThumb =
    asset.moduleSlug === "starter-pack" &&
    !!asset.assetKey?.startsWith("starter-pack/thumbs/") &&
    mimeType.startsWith("image/");

  if (!tier && !isPublicFooterGuide && !isPublicStarterThumb) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (
    tier &&
    role !== "ADMIN" &&
    !hasAccess(tier, asset.requiredTier)
  ) {
    return NextResponse.json({ error: "Insufficient tier" }, { status: 403 });
  }

  const forceDownload = mode === "download";
  const inline =
    forceView ||
    (!forceDownload && (mimeType.startsWith("image/") || mimeType === "application/pdf"));

  const member = {
    name: mobileUser?.name ?? session?.user?.name ?? null,
    email: mobileUser?.email ?? session?.user?.email ?? null,
  };
  let bytes = new Uint8Array(asset.data);
  const stampInput = {
    fileName: asset.fileName,
    mimeType,
    requiredTier: asset.requiredTier,
    isPublicUnpaid: Boolean(isPublicFooterGuide || isPublicStarterThumb),
    byteLength: bytes.byteLength,
    member,
  };
  if (shouldStampPdfFooter(stampInput)) {
    bytes = new Uint8Array(
      await stampPaidPdfWatermark(bytes, member, new Date(), {
        includeLicense: shouldWatermarkPaidPdf(stampInput),
      })
    );
  }

  return new NextResponse(bytes, {
    headers: {
      "Content-Type": mimeType,
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${asset.fileName.replace(/"/g, "")}"`,
      "Cache-Control": isPublicStarterThumb
        ? "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800"
        : "no-store",
    },
  });
}
