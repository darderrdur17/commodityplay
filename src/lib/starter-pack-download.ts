import { attachmentHref, resolveAttachmentUrl } from "@/lib/content/attachments";
import type { StarterInfographic } from "@/data/starter-pack";

export function getStarterPackDownloadUrls(
  infographics: StarterInfographic[],
  assetUrls: Record<string, string>
): string[] {
  return infographics
    .map((info) => {
      const url = resolveAttachmentUrl(
        { title: info.title, fileKey: info.fileKey, assetId: info.assetId },
        assetUrls
      );
      if (!url) return null;
      return attachmentHref(url, info.delivery ?? "download");
    })
    .filter((url): url is string => Boolean(url));
}

/** Trigger browser downloads for each starter-pack PDF (signed-in users only). */
export function triggerStarterPackDownloads(urls: string[]) {
  urls.forEach((url, index) => {
    window.setTimeout(() => {
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.rel = "noopener";
      anchor.style.display = "none";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    }, index * 350);
  });
}
