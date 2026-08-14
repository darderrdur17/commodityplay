import { prisma } from "@/lib/prisma";
import type { Tier } from "@prisma/client";
import { CONTENT_MODULE_META, getModuleMeta, type ContentSlug } from "./modules";
import { GLOSSARY_TERMS } from "@/data/glossary";
import { getDefaultPayload, getAllDefaultPayloads } from "./defaults";
import { deepMerge, mergeLandingContent } from "./merge";
import type { LandingContent } from "@/data/landing-content";
import { applyCmsSchemaSql } from "@/lib/setup-database";

const MAX_REVISIONS = 20;

let cmsTablesReady: boolean | null = null;

export async function ensureContentInfrastructure() {
  if (cmsTablesReady) return;
  try {
    await prisma.contentModule.findFirst({ take: 1 });
    cmsTablesReady = true;
    return;
  } catch {
    // Table missing — create CMS schema
  }
  await applyCmsSchemaSql();
  await prisma.contentModule.findFirst({ take: 1 });
  cmsTablesReady = true;
}

export async function tryReadPublishedPayload<T>(slug: ContentSlug): Promise<T | null> {
  try {
    const row = await prisma.contentModule.findUnique({ where: { slug } });
    if (row?.published) return row.payload as T;
  } catch {
    // CMS tables missing or DB unavailable — fall back to static defaults
  }
  return null;
}

export async function seedContentModulesIfEmpty() {
  await ensureContentInfrastructure();
  const count = await prisma.contentModule.count();
  if (count > 0) return { seeded: false, count };

  const defaults = getAllDefaultPayloads();
  for (const meta of CONTENT_MODULE_META) {
    await prisma.contentModule.create({
      data: {
        slug: meta.slug,
        title: meta.title,
        description: meta.description,
        requiredTier: meta.requiredTier,
        payload: defaults[meta.slug] as object,
        published: true,
        version: 1,
      },
    });
  }
  return { seeded: true, count: CONTENT_MODULE_META.length };
}

/** Keep CMS glossary in sync with desk-glossary_updated_24.06.html extract */
export async function syncGlossaryFromDefaults() {
  await ensureContentInfrastructure();
  const meta = getModuleMeta("glossary");
  if (!meta) throw new Error("Glossary module not configured");

  const payload = { terms: GLOSSARY_TERMS } as object;
  const existing = await prisma.contentModule.findUnique({ where: { slug: "glossary" } });

  if (!existing) {
    await prisma.contentModule.create({
      data: {
        slug: "glossary",
        title: meta.title,
        description: meta.description,
        requiredTier: meta.requiredTier,
        payload,
        published: true,
        version: 1,
      },
    });
    return { updated: true, termCount: GLOSSARY_TERMS.length, created: true };
  }

  await prisma.contentModule.update({
    where: { slug: "glossary" },
    data: {
      payload,
      version: existing.version + 1,
    },
  });
  return { updated: true, termCount: GLOSSARY_TERMS.length, created: false };
}

/** Merge repo defaults with CMS on deploy — admin edits preserved, new code fields added. */
function mergeModulePayloadOnDeploy(
  slug: ContentSlug,
  defaults: object,
  existing: object
): object {
  if (slug === "landing") {
    return mergeLandingContent(
      defaults as LandingContent,
      existing as Partial<LandingContent>
    ) as object;
  }

  // CMS values win on conflicts; repo defaults fill missing keys/sections.
  return deepMerge(defaults as Record<string, unknown>, existing as Record<string, unknown>);
}

/** Push repo defaults into CMS — never fully replace existing admin-edited modules. */
export async function syncAllContentModulesFromDefaults() {
  await ensureContentInfrastructure();
  const defaults = getAllDefaultPayloads();
  let updated = 0;
  let created = 0;
  let unchanged = 0;

  for (const meta of CONTENT_MODULE_META) {
    const slug = meta.slug as ContentSlug;
    const defaultPayload = defaults[slug] as object;
    const existing = await prisma.contentModule.findUnique({ where: { slug } });

    if (!existing) {
      await prisma.contentModule.create({
        data: {
          slug,
          title: meta.title,
          description: meta.description,
          requiredTier: meta.requiredTier,
          payload: defaultPayload,
          published: true,
          version: 1,
        },
      });
      created++;
      continue;
    }

    const payload = mergeModulePayloadOnDeploy(
      slug,
      defaultPayload,
      existing.payload as object
    );

    const payloadChanged =
      JSON.stringify(existing.payload) !== JSON.stringify(payload);

    if (!payloadChanged) {
      unchanged++;
      continue;
    }

    await prisma.contentModule.update({
      where: { slug },
      data: {
        payload,
        version: existing.version + 1,
      },
    });
    updated++;
  }

  return { updated, created, unchanged, total: CONTENT_MODULE_META.length };
}

export async function listContentModules() {
  await ensureContentInfrastructure();
  await seedContentModulesIfEmpty();

  const rows = await prisma.contentModule.findMany({ orderBy: { slug: "asc" } });
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    description: r.description,
    requiredTier: r.requiredTier,
    published: r.published,
    version: r.version,
    updatedAt: r.updatedAt.toISOString(),
    payloadSize: JSON.stringify(r.payload).length,
  }));
}

export async function getContentModuleRecord(slug: string) {
  await ensureContentInfrastructure();
  await seedContentModulesIfEmpty();

  const row = await prisma.contentModule.findUnique({ where: { slug } });
  if (!row) {
    const meta = getModuleMeta(slug);
    if (!meta) return null;
    return {
      slug: meta.slug,
      title: meta.title,
      description: meta.description,
      requiredTier: meta.requiredTier,
      published: true,
      version: 0,
      payload: getDefaultPayload(meta.slug as ContentSlug),
      source: "default" as const,
    };
  }
  return {
    slug: row.slug,
    title: row.title,
    description: row.description,
    requiredTier: row.requiredTier,
    published: row.published,
    version: row.version,
    payload: row.payload,
    source: "database" as const,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getPublishedPayload<T>(slug: ContentSlug): Promise<T> {
  const fromDb = await tryReadPublishedPayload<T>(slug);
  if (fromDb !== null) return fromDb;
  return getDefaultPayload(slug) as T;
}

async function archiveContentModuleRevision(
  slug: string,
  row: {
    version: number;
    payload: unknown;
    requiredTier: Tier;
    published: boolean;
  },
  updatedById?: string
) {
  try {
    await prisma.contentModuleRevision.upsert({
      where: {
        moduleSlug_version: { moduleSlug: slug, version: row.version },
      },
      create: {
        moduleSlug: slug,
        version: row.version,
        payload: row.payload as object,
        requiredTier: row.requiredTier,
        published: row.published,
        updatedById: updatedById ?? null,
      },
      update: {
        payload: row.payload as object,
        requiredTier: row.requiredTier,
        published: row.published,
        updatedById: updatedById ?? null,
      },
    });

    const stale = await prisma.contentModuleRevision.findMany({
      where: { moduleSlug: slug },
      orderBy: { version: "desc" },
      skip: MAX_REVISIONS,
      select: { id: true },
    });
    if (stale.length > 0) {
      await prisma.contentModuleRevision.deleteMany({
        where: { id: { in: stale.map((r) => r.id) } },
      });
    }
  } catch {
    // Revision table missing on older DBs until cms-migration runs — save still succeeds.
  }
}

/** Restore the immediately previous saved version (creates a new version number). */
export async function revertContentModuleToPrevious(slug: string, updatedById: string) {
  await ensureContentInfrastructure();
  const meta = getModuleMeta(slug);
  if (!meta) throw new Error("Unknown content module");

  const existing = await prisma.contentModule.findUnique({ where: { slug } });
  if (!existing) throw new Error("Module not found");
  if (existing.version <= 1) throw new Error("No previous version to revert to");

  const targetVersion = existing.version - 1;
  const revision = await prisma.contentModuleRevision.findUnique({
    where: { moduleSlug_version: { moduleSlug: slug, version: targetVersion } },
  });
  if (!revision) {
    throw new Error(`Previous version v${targetVersion} is not available`);
  }

  await archiveContentModuleRevision(slug, existing, updatedById);

  return prisma.contentModule.update({
    where: { slug },
    data: {
      payload: revision.payload as object,
      requiredTier: revision.requiredTier,
      published: revision.published,
      version: existing.version + 1,
      updatedById,
    },
  });
}

export async function hasContentModuleRevision(slug: string): Promise<boolean> {
  try {
    const existing = await prisma.contentModule.findUnique({
      where: { slug },
      select: { version: true },
    });
    if (!existing || existing.version <= 1) return false;

    const revision = await prisma.contentModuleRevision.findUnique({
      where: {
        moduleSlug_version: { moduleSlug: slug, version: existing.version - 1 },
      },
      select: { id: true },
    });
    return Boolean(revision);
  } catch {
    return false;
  }
}

export async function updateContentModule(
  slug: string,
  data: {
    payload?: unknown;
    requiredTier?: Tier;
    published?: boolean;
    title?: string;
    description?: string;
  },
  /** Admin user id, when the write is admin-attributed. Omit for system/public writes
   * (e.g. the unauthenticated /api/mentor-apply endpoint) — left `null` rather than
   * pointing the FK at a made-up id. */
  updatedById?: string
) {
  await ensureContentInfrastructure();
  const meta = getModuleMeta(slug);
  if (!meta) throw new Error("Unknown content module");

  const existing = await prisma.contentModule.findUnique({ where: { slug } });
  if (!existing) {
    return prisma.contentModule.create({
      data: {
        slug,
        title: data.title ?? meta.title,
        description: data.description ?? meta.description,
        requiredTier: data.requiredTier ?? meta.requiredTier,
        payload: (data.payload ?? getDefaultPayload(slug as ContentSlug)) as object,
        published: data.published ?? true,
        version: 1,
        updatedById: updatedById ?? null,
      },
    });
  }

  await archiveContentModuleRevision(slug, existing, updatedById);

  return prisma.contentModule.update({
    where: { slug },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.requiredTier !== undefined && { requiredTier: data.requiredTier }),
      ...(data.published !== undefined && { published: data.published }),
      ...(data.payload !== undefined && { payload: data.payload as object }),
      version: existing.version + 1,
      updatedById: updatedById ?? null,
    },
  });
}

export async function resetContentModule(slug: string, updatedById: string) {
  const meta = getModuleMeta(slug);
  if (!meta) throw new Error("Unknown content module");
  return updateContentModule(
    slug,
    { payload: getDefaultPayload(slug as ContentSlug), requiredTier: meta.requiredTier, published: true },
    updatedById
  );
}

export async function listContentAssets(moduleSlug?: string) {
  await ensureContentInfrastructure();
  return prisma.contentAsset.findMany({
    where: moduleSlug ? { moduleSlug } : undefined,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      fileName: true,
      mimeType: true,
      size: true,
      moduleSlug: true,
      assetKey: true,
      requiredTier: true,
      label: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function getContentAsset(id: string) {
  return prisma.contentAsset.findUnique({ where: { id } });
}

export async function upsertContentAsset(input: {
  fileName: string;
  mimeType: string;
  data: Buffer;
  moduleSlug?: string;
  assetKey?: string;
  requiredTier?: Tier;
  label?: string;
  uploadedById: string;
}) {
  await ensureContentInfrastructure();
  if (input.assetKey) {
    return prisma.contentAsset.upsert({
      where: { assetKey: input.assetKey },
      create: {
        fileName: input.fileName,
        mimeType: input.mimeType,
        size: input.data.length,
        data: input.data,
        moduleSlug: input.moduleSlug,
        assetKey: input.assetKey,
        requiredTier: input.requiredTier ?? "PRO",
        label: input.label,
        uploadedById: input.uploadedById,
      },
      update: {
        fileName: input.fileName,
        mimeType: input.mimeType,
        size: input.data.length,
        data: input.data,
        moduleSlug: input.moduleSlug,
        requiredTier: input.requiredTier ?? "PRO",
        label: input.label,
        uploadedById: input.uploadedById,
      },
    });
  }
  return prisma.contentAsset.create({
    data: {
      fileName: input.fileName,
      mimeType: input.mimeType,
      size: input.data.length,
      data: input.data,
      moduleSlug: input.moduleSlug,
      requiredTier: input.requiredTier ?? "PRO",
      label: input.label,
      uploadedById: input.uploadedById,
    },
  });
}

export async function deleteContentAsset(id: string) {
  return prisma.contentAsset.delete({ where: { id } });
}

type UploadedAssetRef = {
  id: string;
  fileName: string;
  assetKey: string;
  url: string;
  updatedAt: string;
};

/** After admin upload — register file on module payload so members + editor see it. */
export async function attachUploadedAssetToModule(
  moduleSlug: ContentSlug,
  asset: { id: string; fileName: string; assetKey: string | null },
  updatedById: string
) {
  const existing = await prisma.contentModule.findUnique({ where: { slug: moduleSlug } });
  if (!existing) return;

  const payload = { ...(existing.payload as Record<string, unknown>) };
  const key = asset.assetKey || asset.fileName;
  const ref: UploadedAssetRef = {
    id: asset.id,
    fileName: asset.fileName,
    assetKey: key,
    url: `/api/content/assets/${asset.id}`,
    updatedAt: new Date().toISOString(),
  };

  const uploaded = Array.isArray(payload.uploadedAssets)
    ? [...(payload.uploadedAssets as UploadedAssetRef[])]
    : [];
  const idx = uploaded.findIndex((a) => a.assetKey === key || a.id === asset.id);
  if (idx >= 0) uploaded[idx] = ref;
  else uploaded.push(ref);
  payload.uploadedAssets = uploaded;

  if (moduleSlug === "resume-templates" && Array.isArray(payload.templates)) {
    payload.templates = (payload.templates as Record<string, unknown>[]).map((t) => {
      const templateFile = t.templateFile as string | undefined;
      const matchesTemplate =
        templateFile &&
        (templateFile === key ||
          templateFile === asset.fileName ||
          key.endsWith(`/${templateFile}`) ||
          asset.fileName === templateFile);
      if (matchesTemplate) {
        return { ...t, assetId: asset.id };
      }
      return t;
    });
  }

  await prisma.contentModule.update({
    where: { slug: moduleSlug },
    data: {
      payload: payload as object,
      version: existing.version + 1,
      updatedById,
    },
  });
}

/** Public read — maps assetKey/fileName to tier-gated download URLs. */
export async function getContentAssetUrlMap(moduleSlug: string): Promise<Record<string, string>> {
  try {
    const assets = await prisma.contentAsset.findMany({
      where: { moduleSlug },
      select: { id: true, assetKey: true, fileName: true },
    });
    const map: Record<string, string> = {};
    for (const asset of assets) {
      const url = `/api/content/assets/${asset.id}`;
      if (asset.assetKey) map[asset.assetKey] = url;
      map[asset.fileName] = url;
    }
    return map;
  } catch {
    return {};
  }
}
