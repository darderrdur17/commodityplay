/** Shared attachment metadata for playbook sections, starter infographics, and library files. */
export type AssetDelivery = "view-only" | "download";

export interface ContentAttachment {
  id?: string;
  type?: string;
  title: string;
  description?: string;
  fileKey?: string;
  assetId?: string;
  fileName?: string;
  mimeType?: string;
  delivery?: AssetDelivery;
}

export function resolveAttachmentUrl(
  attachment: ContentAttachment,
  urlMap: Record<string, string>
): string | undefined {
  if (attachment.assetId) {
    return `/api/content/assets/${attachment.assetId}`;
  }
  if (attachment.fileKey && urlMap[attachment.fileKey]) {
    return urlMap[attachment.fileKey];
  }
  return undefined;
}

export function attachmentHref(url: string, delivery: AssetDelivery = "download"): string {
  if (delivery === "view-only") {
    return `${url}${url.includes("?") ? "&" : "?"}mode=view`;
  }
  return `${url}${url.includes("?") ? "&" : "?"}mode=download`;
}

export function slugifyFileName(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}
