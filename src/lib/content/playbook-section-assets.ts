import { getSectionAssets } from "@/data/playbook-assets";
import {
  slugifyFileName,
  type ContentAttachment,
} from "@/lib/content/attachments";

export const PLAYBOOK_REFERENCE_ASSET_TYPES = ["Infographic", "Framework", "Worked Example"] as const;

export function defaultPlaybookAttachment(
  chapterId: string,
  sectionId: string,
  type: (typeof PLAYBOOK_REFERENCE_ASSET_TYPES)[number],
  title: string
): ContentAttachment {
  const slug = slugifyFileName(title) || type.toLowerCase().replace(/\s+/g, "-");
  return {
    id: `${sectionId}-${slug}`,
    type,
    title,
    description: "",
    fileKey: `playbook/${chapterId}/${sectionId}/${slug}.pdf`,
    delivery: "download",
  };
}

/** Always three reference slots so unuploaded PDFs can show Coming soon. */
export function ensurePlaybookSectionAssets(
  chapterId: string,
  sectionId: string,
  sectionTitle: string,
  assets: ContentAttachment[]
): ContentAttachment[] {
  const byType = new Map<string, ContentAttachment>();
  for (const asset of assets) {
    if (asset.type) byType.set(asset.type, asset);
  }
  for (const fallback of getSectionAssets(chapterId, sectionId)) {
    if (fallback.type && !byType.has(fallback.type)) {
      byType.set(fallback.type, { ...fallback, delivery: "download" as const });
    }
  }

  return PLAYBOOK_REFERENCE_ASSET_TYPES.map((type) => {
    const existing = byType.get(type);
    if (existing) return existing;
    return defaultPlaybookAttachment(chapterId, sectionId, type, `${sectionTitle} — ${type}`);
  });
}
