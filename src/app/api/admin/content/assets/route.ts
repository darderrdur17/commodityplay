import { NextRequest, NextResponse } from "next/server";
import { recordAdminAudit, requireSoleAdmin } from "@/lib/admin-access";
import {
  buildContentAssetKey,
  resolveContentAssetMimeType,
  validateContentAssetFile,
} from "@/lib/content/asset-files";
import {
  attachUploadedAssetToModule,
  listContentAssets,
  upsertContentAsset,
} from "@/lib/content/repository";
import type { ContentSlug } from "@/lib/content/modules";
import { getModuleMeta } from "@/lib/content/modules";
import type { Tier } from "@prisma/client";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const admin = await requireSoleAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const moduleSlug = req.nextUrl.searchParams.get("module") || undefined;
    const assets = await listContentAssets(moduleSlug);
    return NextResponse.json({ assets });
  } catch (err) {
    console.error("[admin/content/assets] GET failed:", err);
    return NextResponse.json({ error: "Failed to load assets" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireSoleAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    const validationError = validateContentAssetFile(file.name, file.size);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = resolveContentAssetMimeType(file.name, file.type);
    const moduleSlug = (form.get("moduleSlug") as string) || undefined;
    const assetKey =
      (form.get("assetKey") as string) ||
      (moduleSlug ? buildContentAssetKey(moduleSlug, file.name) : file.name);
    const label = (form.get("label") as string) || undefined;
    const requiredTier = (form.get("requiredTier") as Tier) || "PRO";

    const asset = await upsertContentAsset({
      fileName: file.name,
      mimeType,
      data: buffer,
      moduleSlug,
      assetKey,
      requiredTier,
      label,
      uploadedById: admin.user.id,
    });

    if (moduleSlug && getModuleMeta(moduleSlug)) {
      await attachUploadedAssetToModule(
        moduleSlug as ContentSlug,
        { id: asset.id, fileName: asset.fileName, assetKey: asset.assetKey },
        admin.user.id
      );
    }

    await recordAdminAudit({
      actorEmail: admin.user.email,
      action: "cms.asset.upsert",
      metadata: { id: asset.id, fileName: asset.fileName, assetKey: asset.assetKey, moduleSlug: asset.moduleSlug },
    });

    return NextResponse.json({
      id: asset.id,
      fileName: asset.fileName,
      size: asset.size,
      url: `/api/content/assets/${asset.id}`,
      assetKey: asset.assetKey,
      moduleSlug: asset.moduleSlug,
      replaced: Boolean(assetKey),
    });
  } catch (err) {
    console.error("[admin/content/assets] POST failed:", err);
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json(
      {
        error: message.includes("ContentAsset")
          ? "CMS storage unavailable. Run: npx prisma db push"
          : "Upload failed. Try a smaller file (max 4MB) or a supported format (PDF, Word, PNG, etc.).",
      },
      { status: 500 }
    );
  }
}
