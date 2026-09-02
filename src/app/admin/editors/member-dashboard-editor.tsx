"use client";

import React from "react";
import {
  DEFAULT_MEMBER_DASHBOARD_CONTENT,
  type DashboardPromoBox,
  type MemberDashboardContent,
} from "@/data/member-dashboard";
import { normalizeMemberDashboardPayload } from "@/lib/content/member-dashboard-schema";
import { CONTENT_STAT_PLACEHOLDER_HINT } from "@/lib/content/content-stat-placeholders";
import { EditorField, EditorSection, inputClass, textareaClass } from "./shared";
import { SingleGuideUpload } from "./single-guide-upload";

function PromoBoxFields({
  label,
  box,
  onChange,
  showFooterNote = false,
}: {
  label: string;
  box: DashboardPromoBox;
  onChange: (next: DashboardPromoBox) => void;
  showFooterNote?: boolean;
}) {
  return (
    <EditorSection title={label} defaultOpen>
      <div className="grid gap-4 sm:grid-cols-2">
        <EditorField label="Badge (pill label)">
          <input
            className={inputClass}
            value={box.badge}
            onChange={(e) => onChange({ ...box, badge: e.target.value })}
          />
        </EditorField>
        <EditorField label="Button text">
          <input
            className={inputClass}
            value={box.cta}
            onChange={(e) => onChange({ ...box, cta: e.target.value })}
          />
        </EditorField>
      </div>
      <EditorField label="Headline">
        <input
          className={inputClass}
          value={box.headline}
          onChange={(e) => onChange({ ...box, headline: e.target.value })}
        />
      </EditorField>
      <EditorField label="Description / subtext">
        <textarea
          className={textareaClass}
          value={box.description}
          onChange={(e) => onChange({ ...box, description: e.target.value })}
        />
      </EditorField>
      {showFooterNote && (
        <EditorField label="Footer note (optional)">
          <input
            className={inputClass}
            value={box.footerNote ?? ""}
            onChange={(e) => onChange({ ...box, footerNote: e.target.value || undefined })}
          />
        </EditorField>
      )}
    </EditorSection>
  );
}

export function MemberDashboardEditor({
  payload,
  onChange,
}: {
  payload: unknown;
  onChange: (p: unknown) => void;
  moduleSlug: string;
  requiredTier: string;
}) {
  const content: MemberDashboardContent = normalizeMemberDashboardPayload(
    payload ?? DEFAULT_MEMBER_DASHBOARD_CONTENT
  );

  function patch(next: MemberDashboardContent) {
    onChange(next);
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-fg bg-secondary/50 rounded-lg px-3 py-2">
        Edit marketing banners and resource card descriptions on the member dashboard (
        <code className="text-[11px]">/dashboard</code>). With <strong>Published</strong> checked, Save updates the
        live site.
      </p>

      <PromoBoxFields
        label="Starter Pack banner (Starter members)"
        box={content.starterPack}
        onChange={(starterPack) => patch({ ...content, starterPack })}
        showFooterNote
      />

      <PromoBoxFields
        label="Upgrade to Pro banner (Starter members)"
        box={content.upgradeToPro}
        onChange={(upgradeToPro) => patch({ ...content, upgradeToPro })}
      />

      <PromoBoxFields
        label="Upgrade to Elite banner (Pro members)"
        box={content.upgradeToElite}
        onChange={(upgradeToElite) => patch({ ...content, upgradeToElite })}
      />

      <EditorSection
        title="Resource card descriptions"
        description="Small text under each title in the dashboard grid. Counts auto-fill from live CMS data. Track (Career / Sales / Both) is product-owned and filters the live dashboard."
        defaultOpen
      >
        <p className="text-xs text-muted-fg mb-3">
          Optional placeholders (updated automatically on the site):{" "}
          <code className="text-[11px] bg-secondary px-1 rounded">{CONTENT_STAT_PLACEHOLDER_HINT}</code>
        </p>
        <div className="space-y-4">
          {content.resourceCards.map((card, i) => (
            <EditorField
              key={card.slug}
              label={card.title}
              hint={`${card.track} track · shown to ${card.track === "Both" ? "Career and Sales" : `${card.track} only`}`}
            >
              <textarea
                className={textareaClass}
                rows={2}
                value={card.description}
                onChange={(e) => {
                  const next = [...content.resourceCards];
                  next[i] = { ...card, description: e.target.value };
                  patch({ ...content, resourceCards: next });
                }}
              />
            </EditorField>
          ))}
        </div>
      </EditorSection>

      <EditorSection
        title="Sales track resource cards"
        description="Extra locked/unlocked cards shown only to Sales track members on /dashboard."
        defaultOpen
      >
        <div className="space-y-4">
          {content.salesResourceCards.map((card, i) => (
            <div key={card.slug} className="rounded-lg border border-border p-4 space-y-3">
              <p className="text-sm font-semibold text-gray-900">{card.title}</p>
              <EditorField label="Description">
                <textarea
                  className={textareaClass}
                  rows={2}
                  value={card.description}
                  onChange={(e) => {
                    const next = [...content.salesResourceCards];
                    next[i] = { ...card, description: e.target.value };
                    patch({ ...content, salesResourceCards: next });
                  }}
                />
              </EditorField>
            </div>
          ))}
        </div>
      </EditorSection>

      <EditorSection
        title="Sales track file uploads"
        description="PDFs for Sales Market Nudges and Industry Guide for Sales — unlock on the dashboard when a Pro+ Sales member has access."
        defaultOpen
      >
        <div className="space-y-6">
          <SingleGuideUpload
            guide={content.salesDeliverables.salesEdgeNote}
            onChange={(g) =>
              patch({
                ...content,
                salesDeliverables: { ...content.salesDeliverables, salesEdgeNote: g },
              })
            }
            moduleSlug="member-dashboard"
            requiredTier="PRO"
            assetKey="member-dashboard/sales-edge-note"
            defaultLabel="Sales Market Nudges"
          />
          <SingleGuideUpload
            guide={content.salesDeliverables.industryGuideForSales}
            onChange={(g) =>
              patch({
                ...content,
                salesDeliverables: { ...content.salesDeliverables, industryGuideForSales: g },
              })
            }
            moduleSlug="member-dashboard"
            requiredTier="PRO"
            assetKey="member-dashboard/industry-guide-for-sales"
            defaultLabel="Industry Guide for Sales"
          />
        </div>
      </EditorSection>
    </div>
  );
}
