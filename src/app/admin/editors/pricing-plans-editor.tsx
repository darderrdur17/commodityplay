"use client";

import React, { useState } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { EditorSection } from "./shared";
import { ComparisonTableEditor, type ComparisonColumn } from "../admin-landing-editor";
import { resolveEditorLandingContent } from "./landing-editor";
import type { FeatureComparisonGroup } from "@/data/landing-content";

/**
 * Focused "Pricing plans" card — the plan-by-plan view of what each tier includes.
 *
 * ---------------------------------------------------------------------------
 * WHAT THIS EDITS, AND WHY IT IS THE COMPARISON ROWS
 * ---------------------------------------------------------------------------
 * The ✓ / ✗ list in each plan column on `/pricing` is built by
 * `pricing-tier-grid.tsx` from `comparisonGroups` — the STORED
 * `pricing.comparison.groups` (Career) and `sales.comparison.groups` (Sales)
 * fields. It is NOT built from `tier.features`.
 *
 * `tier.features` looks like the obvious place to edit plan bullets, and it is
 * editable in the Landing editor — but it only ever seeds the *code* defaults for
 * the comparison table at module load. Nothing the CMS saves into it reaches the
 * live page, so editing it is a silent no-op. That is exactly the trap this card
 * exists to route around, and why it edits the comparison rows instead.
 *
 * ---------------------------------------------------------------------------
 * WHY IT WRITES SURGICALLY
 * ---------------------------------------------------------------------------
 * The payload also holds every other landing section. Writing back a merged
 * `LandingContent` would risk stamping defaults over keys this card does not own,
 * so each edit replaces only the one nested key it is responsible for
 * (`pricing.comparison` or `sales.comparison`) inside the RAW payload.
 */

type PricingTrack = "career" | "sales";

const CAREER_COLUMNS: ComparisonColumn[] = [
  { key: "starter", label: "Starter" },
  { key: "pro", label: "Pro" },
  { key: "elite", label: "Elite" },
];

const SALES_COLUMNS: ComparisonColumn[] = [
  { key: "pro", label: "Pro" },
  { key: "elite", label: "Elite" },
];

/** One plan column as it will actually render — mirrors `pricing-tier-grid.tsx`. */
function PlanColumnPreview({
  label,
  groups,
  columnKey,
}: {
  label: string;
  groups: FeatureComparisonGroup[];
  columnKey: "starter" | "pro" | "elite";
}) {
  const rows = groups.flatMap((group) =>
    group.items.map((item) => ({
      name: item.name,
      included: Boolean(item[columnKey]),
    }))
  );
  const includedCount = rows.filter((row) => row.included).length;

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-secondary/60">
        <p className="text-xs font-bold text-gray-800">{label}</p>
        <span className="text-[11px] text-muted-fg">
          {includedCount} ✓ · {rows.length - includedCount} greyed
        </span>
      </div>
      <ul className="divide-y divide-border max-h-72 overflow-y-auto">
        {rows.length === 0 && (
          <li className="px-3 py-3 text-xs text-muted-fg">No rows yet — add one below.</li>
        )}
        {rows.map((row, i) => (
          <li key={`${row.name}-${i}`} className="flex items-start gap-2 px-3 py-1.5">
            {row.included ? (
              <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-green-500" />
            ) : (
              <X className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gray-400" />
            )}
            <span className={cn("text-xs leading-snug", row.included ? "text-gray-700" : "text-gray-500")}>
              {row.name}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PricingPlansEditor({
  payload,
  onChange,
}: {
  payload: unknown;
  onChange: (p: unknown) => void;
}) {
  const [track, setTrack] = useState<PricingTrack>("career");

  const content = resolveEditorLandingContent(payload);
  const rawPayload = (payload && typeof payload === "object" ? payload : {}) as Record<string, unknown>;

  const groups = track === "career" ? content.pricing.comparison.groups : content.sales.comparison.groups;
  const columns = track === "career" ? CAREER_COLUMNS : SALES_COLUMNS;

  function writeComparison(next: FeatureComparisonGroup[]) {
    if (track === "career") {
      const rawPricing = (rawPayload.pricing ?? {}) as Record<string, unknown>;
      onChange({
        ...rawPayload,
        pricing: { ...rawPricing, comparison: { groups: next } },
      });
      return;
    }
    const rawSales = (rawPayload.sales ?? {}) as Record<string, unknown>;
    onChange({
      ...rawPayload,
      sales: { ...rawSales, comparison: { groups: next } },
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <span className="text-xs font-semibold text-gray-700">Track:</span>
        {(["career", "sales"] as PricingTrack[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTrack(t)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              track === t ? "bg-primary-soft text-primary-400" : "bg-secondary text-muted-fg hover:bg-secondary/80"
            )}
          >
            {t === "career" ? "Career" : "Sales"}
          </button>
        ))}
      </div>

      <div className="mx-1 rounded-lg border border-border bg-secondary/30 px-3 py-2 text-xs text-muted-fg leading-relaxed">
        <strong className="text-gray-700">These rows are the ✓ / ✗ list on /pricing.</strong> A row ticked for a
        plan shows a green ✓ in that plan&apos;s column; an unticked row is greyed out with an ✗. Editing a row name
        changes the wording everywhere it appears.
        <span className="block mt-1">
          The plan columns below are a live preview — they show exactly what /pricing will render once you save.
        </span>
      </div>

      <EditorSection
        title="Preview — what each plan column shows"
        description="Read-only. Updates as you edit below."
        defaultOpen
      >
        <div className={cn("grid gap-3", columns.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
          {columns.map((col) => (
            <PlanColumnPreview key={col.key} label={col.label} groups={groups} columnKey={col.key} />
          ))}
        </div>
      </EditorSection>

      <EditorSection
        title="Edit feature rows"
        description="Row wording, and which plans tick it off. Group labels and colors are optional — they are not shown on /pricing."
        defaultOpen
      >
        <ComparisonTableEditor
          table={{ groups }}
          onChange={(table) => writeComparison(table.groups)}
          columns={columns}
        />
      </EditorSection>
    </div>
  );
}
