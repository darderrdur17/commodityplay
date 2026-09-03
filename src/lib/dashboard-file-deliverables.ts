import { attachmentHref } from "@/lib/content/attachments";
import type { NavigationGuideAttachment } from "@/lib/content/accessors";
import type { GuideAttachment } from "@/app/admin/editors/single-guide-upload";
import type { SalesDashboardDeliverables } from "@/lib/content/sales-dashboard-deliverables";
import type { DashboardDeliverableKey } from "@/data/member-dashboard";

export type { DashboardDeliverableKey };

export interface DashboardFileDeliverableSources {
  careerNavigationGuide: NavigationGuideAttachment | null;
  salesDeliverables: SalesDashboardDeliverables;
}

type FileAsset = NavigationGuideAttachment | GuideAttachment | null;

export function resolveDashboardFileAsset(
  key: DashboardDeliverableKey,
  sources: DashboardFileDeliverableSources
): FileAsset {
  if (key === "careerNavigationGuide") return sources.careerNavigationGuide;
  return sources.salesDeliverables[key] ?? null;
}

export function isDashboardFileReady(
  key: DashboardDeliverableKey | undefined,
  sources: DashboardFileDeliverableSources
): boolean {
  if (!key) return true;
  return Boolean(resolveDashboardFileAsset(key, sources)?.assetId);
}

export function resolveDashboardFileDownloadHref(
  key: DashboardDeliverableKey,
  sources: DashboardFileDeliverableSources
): string | null {
  const asset = resolveDashboardFileAsset(key, sources);
  if (!asset?.assetId) return null;
  return attachmentHref(`/api/content/assets/${asset.assetId}`, "download");
}
