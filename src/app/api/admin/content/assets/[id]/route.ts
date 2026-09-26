import { NextRequest, NextResponse } from "next/server";
import { requireSoleAdmin } from "@/lib/admin-access";
import {
  attachUploadedAssetToModule,
  deleteContentAsset,
  getContentAsset,
} from "@/lib/content/repository";
import {
  resolveContentAssetMimeType,
  validateContentAssetFile,
} from "@/lib/content/asset-files";
import type { ContentSlug } from "@/lib/content/modules";
import { getModuleMeta } from "@/lib/content/modules";
import type { Tier } from "@prisma/client";
import { z } from "zod";

export const runtime = "nodejs";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireSoleAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  try {
    await deleteContentAsset(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

const patchSchema = z.object({
  label: z.string().optional(),
  requiredTier: z.enum(["STARTER", "PRO", "ELITE"]).optional(),
  moduleSlug: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireSoleAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const existing = await getContentAsset(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
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
      const moduleSlug = (form.get("moduleSlug") as string) || existing.moduleSlug || undefined;
      const requiredTier = (form.get("requiredTier") as Tier) || existing.requiredTier;

      const { prisma } = await import("@/lib/prisma");
      const asset = await prisma.contentAsset.update({
        where: { id },
        data: {
          fileName: file.name,
          mimeType,
          size: buffer.length,
          data: buffer,
          moduleSlug: moduleSlug ?? existing.moduleSlug,
          assetKey: existing.assetKey || file.name,
          requiredTier,
          label: (form.get("label") as string) || existing.label,
          uploadedById: admin.user.id,
        },
      });

      if (moduleSlug && getModuleMeta(moduleSlug)) {
        await attachUploadedAssetToModule(
          moduleSlug as ContentSlug,
          { id: asset.id, fileName: asset.fileName, assetKey: asset.assetKey },
          admin.user.id
        );
      }

      return NextResponse.json({
        ok: true,
        id: asset.id,
        fileName: asset.fileName,
        url: `/api/content/assets/${asset.id}`,
      });
    } catch (err) {
      console.error("[admin/content/assets] PATCH file failed:", err);
      return NextResponse.json({ error: "File update failed" }, { status: 500 });
    }
  }

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { prisma } = await import("@/lib/prisma");
  const asset = await prisma.contentAsset.update({
    where: { id },
    data: {
      ...(parsed.data.label !== undefined && { label: parsed.data.label }),
      ...(parsed.data.requiredTier !== undefined && { requiredTier: parsed.data.requiredTier }),
      ...(parsed.data.moduleSlug !== undefined && { moduleSlug: parsed.data.moduleSlug }),
    },
  });

  return NextResponse.json({
    ok: true,
    id: asset.id,
    fileName: asset.fileName,
    requiredTier: asset.requiredTier,
    moduleSlug: asset.moduleSlug,
  });
}
