"use client";

import React from "react";
import { SingleGuideUpload, type GuideAttachment } from "./single-guide-upload";

type Payload = {
  salesNavigationGuide?: GuideAttachment | null;
  [key: string]: unknown;
};

export function SalesNavigationGuideEditor({
  payload,
  onChange,
  moduleSlug,
  requiredTier,
}: {
  payload: unknown;
  onChange: (p: unknown) => void;
  moduleSlug: string;
  requiredTier: string;
}) {
  const raw = (payload as Payload) ?? {};

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-fg">
        Pro Pack deliverable shown on the member dashboard for <strong>Sales track</strong> Pro and
        Elite members. View-only PDF — not the same as the free footer Sales Guide.
      </p>
      <SingleGuideUpload
        guide={raw.salesNavigationGuide ?? null}
        onChange={(g) => onChange({ ...raw, salesNavigationGuide: g })}
        moduleSlug={moduleSlug}
        requiredTier={requiredTier}
        assetKey="career-roadmap/sales-navigation-guide"
        defaultLabel="Sales Navigation Guide"
      />
    </div>
  );
}
