"use client";

import React from "react";
import { SingleGuideUpload, type GuideAttachment } from "./single-guide-upload";

type FooterGuidesPayload = {
  careerGuide?: GuideAttachment | null;
  salesGuide?: GuideAttachment | null;
};

export function FooterGuidesEditor({
  payload,
  onChange,
  moduleSlug,
}: {
  payload: unknown;
  onChange: (p: unknown) => void;
  moduleSlug: string;
}) {
  const raw = (payload as FooterGuidesPayload) ?? {};

  function patch(updates: Partial<FooterGuidesPayload>) {
    onChange({ ...raw, ...updates });
  }

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-fg">
        Free view-only PDFs linked from the site footer as <strong>Career Guide</strong> and{" "}
        <strong>Sales Guide</strong>. Uploads are public (no login required to view). These are
        separate from Pro Pack Navigation Guides on the member dashboard.
      </p>

      <SingleGuideUpload
        guide={raw.careerGuide ?? null}
        onChange={(g) => patch({ careerGuide: g })}
        moduleSlug={moduleSlug}
        requiredTier="STARTER"
        assetKey="footer-guides/career-guide"
        defaultLabel="Career Guide"
        description="Footer link: Career Guide — opens as view-only PDF in a new tab."
      />

      <SingleGuideUpload
        guide={raw.salesGuide ?? null}
        onChange={(g) => patch({ salesGuide: g })}
        moduleSlug={moduleSlug}
        requiredTier="STARTER"
        assetKey="footer-guides/sales-guide"
        defaultLabel="Sales Guide"
        description="Footer link: Sales Guide — opens as view-only PDF in a new tab."
      />
    </div>
  );
}
