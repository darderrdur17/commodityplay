import type { GuideAttachment } from "@/app/admin/editors/single-guide-upload";

export interface SalesDashboardDeliverables {
  salesEdgeNote: GuideAttachment | null;
  industryGuideForSales: GuideAttachment | null;
}

export const DEFAULT_SALES_DASHBOARD_DELIVERABLES: SalesDashboardDeliverables = {
  salesEdgeNote: null,
  industryGuideForSales: null,
};

export function normalizeSalesDashboardDeliverables(
  partial?: Partial<SalesDashboardDeliverables> | null
): SalesDashboardDeliverables {
  return {
    salesEdgeNote: partial?.salesEdgeNote ?? null,
    industryGuideForSales: partial?.industryGuideForSales ?? null,
  };
}
