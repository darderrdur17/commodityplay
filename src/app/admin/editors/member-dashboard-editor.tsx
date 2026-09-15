"use client";

import { cn } from "@/lib/utils";
import {
  DEFAULT_MEMBER_DASHBOARD_CONTENT,
  type DashboardModuleTrack,
  type DashboardPromoBox,
  type MemberDashboardContent,
} from "@/data/member-dashboard";
import { normalizeMemberDashboardPayload } from "@/lib/content/member-dashboard-schema";
import { CONTENT_STAT_PLACEHOLDER_HINT } from "@/lib/content/content-stat-placeholders";
import { EditorField, EditorSection, inputClass, textareaClass } from "./shared";
import { SingleGuideUpload } from "./single-guide-upload";

const TRACK_OPTIONS: DashboardModuleTrack[] = ["Career", "Sales", "Both"];

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

  function patchCard(index: number, updates: Partial<MemberDashboardContent["resourceCards"][number]>) {
    const next = [...content.resourceCards];
    next[index] = { ...next[index], ...updates };
    patch({ ...content, resourceCards: next });
  }

  function moveCard(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= content.resourceCards.length) return;
    const next = [...content.resourceCards];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    patch({ ...content, resourceCards: next });
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-fg bg-secondary/50 rounded-lg px-3 py-2">
        Edit marketing banners and resource cards on the member dashboard (
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
        title="Resource cards"
        description="Title and small text for each card in the dashboard grid. Counts auto-fill from live CMS data. Track (Career / Sales / Both) is CMS-owned and filters the live dashboard: Career members see Career+Both, Sales members see Sales+Both, Both-track members see all."
        defaultOpen
      >
        <p className="text-xs text-muted-fg mb-3">
          Optional placeholders (updated automatically on the site):{" "}
          <code className="text-[11px] bg-secondary px-1 rounded">{CONTENT_STAT_PLACEHOLDER_HINT}</code>
        </p>
        <p className="text-xs text-muted-fg mb-3">
          Slugs stay fixed so links and downloads keep working. Reorder with the arrows — titles are labels, not URLs.
        </p>
        <div className="space-y-4">
          {content.resourceCards.map((card, i) => (
            <div key={card.slug} className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[11px] font-mono text-muted-fg break-all">{card.slug}</p>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    className="h-7 w-7 rounded-md border border-border text-xs font-semibold text-muted-fg hover:bg-secondary disabled:opacity-40"
                    onClick={() => moveCard(i, -1)}
                    disabled={i === 0}
                    aria-label={`Move ${card.slug} up`}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="h-7 w-7 rounded-md border border-border text-xs font-semibold text-muted-fg hover:bg-secondary disabled:opacity-40"
                    onClick={() => moveCard(i, 1)}
                    disabled={i === content.resourceCards.length - 1}
                    aria-label={`Move ${card.slug} down`}
                  >
                    ↓
                  </button>
                </div>
              </div>
              <EditorField label="Title">
                <input
                  className={inputClass}
                  value={card.title}
                  onChange={(e) => patchCard(i, { title: e.target.value })}
                />
              </EditorField>
              <EditorField
                label="Description"
                hint={`Shown to ${card.track === "Both" ? "Career and Sales" : `${card.track} only`} (after Save + Publish)`}
              >
                <textarea
                  className={textareaClass}
                  rows={2}
                  value={card.description}
                  onChange={(e) => patchCard(i, { description: e.target.value })}
                />
              </EditorField>
              <EditorField label="Track">
                <div className="flex flex-wrap items-center gap-2">
                  {TRACK_OPTIONS.map((track) => (
                    <button
                      key={track}
                      type="button"
                      onClick={() => patchCard(i, { track })}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                        card.track === track
                          ? "bg-primary-soft text-primary-400"
                          : "bg-secondary text-muted-fg hover:bg-secondary/80"
                      )}
                    >
                      {track}
                    </button>
                  ))}
                </div>
              </EditorField>
            </div>
          ))}
        </div>
      </EditorSection>

      <EditorSection
        title="Sales track file uploads"
        description="PDFs for Sales Market Nudges and Industry Guide for Sales — unlock on the dashboard when a Pro+ member has access to those cards."
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
