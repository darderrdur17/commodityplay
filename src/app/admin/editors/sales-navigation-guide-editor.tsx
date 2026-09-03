"use client";

import React from "react";
import { DEFAULT_MEMBER_DASHBOARD_CONTENT } from "@/data/member-dashboard";
import { normalizeMemberDashboardPayload } from "@/lib/content/member-dashboard-schema";
import { SingleGuideUpload } from "./single-guide-upload";

export function SalesNavigationGuideEditor({
  payload,
  onChange,
  requiredTier,
}: {
  payload: unknown;
  onChange: (p: unknown) => void;
  moduleSlug: string;
  requiredTier: string;
}) {
  const content = normalizeMemberDashboardPayload(payload ?? DEFAULT_MEMBER_DASHBOARD_CONTENT);

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-fg">
        Sales Pro / Elite dashboard card — <strong>Industry Guide for Sales</strong>. PDF download only;
        this is not an in-app article and is stored on the member dashboard module (not Career Roadmap).
      </p>
      <SingleGuideUpload
        guide={content.salesDeliverables.industryGuideForSales}
        onChange={(g) =>
          onChange({
            ...content,
            salesDeliverables: { ...content.salesDeliverables, industryGuideForSales: g },
          })
        }
        moduleSlug="member-dashboard"
        requiredTier={requiredTier}
        assetKey="member-dashboard/industry-guide-for-sales"
        defaultLabel="Industry Guide for Sales"
      />
    </div>
  );
}
