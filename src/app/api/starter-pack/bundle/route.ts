import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getStarterPackContent } from "@/lib/content/accessors";
import { getContentAsset, getContentAssetByKey } from "@/lib/content/repository";
import { createStoreZip } from "@/lib/zip-store";
import { slugifyFileName } from "@/lib/content/attachments";

export const dynamic = "force-dynamic";

function fileNameFor(title: string, fallback: string, index: number) {
  const base = slugifyFileName(title) || fallback.replace(/\.pdf$/i, "") || `starter-${index + 1}`;
  return `${String(index + 1).padStart(2, "0")}-${base}.pdf`;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { infographics } = await getStarterPackContent();
  const files: { name: string; data: Uint8Array }[] = [];

  for (let i = 0; i < infographics.length; i++) {
    const info = infographics[i]!;
    const asset = info.assetId
      ? await getContentAsset(info.assetId)
      : info.fileKey
        ? await getContentAssetByKey(info.fileKey)
        : null;
    if (!asset?.data) continue;
    files.push({
      name: fileNameFor(info.title, info.fileName || info.fileKey || `file-${i + 1}`, i),
      data: new Uint8Array(asset.data),
    });
  }

  if (files.length === 0) {
    return NextResponse.json(
      { error: "Starter pack PDFs are not uploaded yet." },
      { status: 404 }
    );
  }

  const zip = createStoreZip(files);
  return new NextResponse(Buffer.from(zip), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="CommodityPlay-Starter-Pack.zip"',
      "Cache-Control": "no-store",
    },
  });
}
