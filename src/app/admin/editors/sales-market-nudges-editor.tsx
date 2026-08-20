"use client";

import React from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  DEFAULT_SALES_MARKET_NUDGES_CONTENT,
  formatBriefPeriodLabel,
  type IntelligenceBrief,
  type MarketNudgeItem,
} from "@/data/sales-market-nudges";
import { normalizeSalesMarketNudgesPayload } from "@/lib/content/sales-market-nudges-schema";
import { EditorField, EditorSection, inputClass, textareaClass } from "./shared";
import { Button } from "@/components/ui/button";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function newNudgeId() {
  return `nudge-${Date.now()}`;
}

function newBriefId() {
  return `brief-${Date.now()}`;
}

export function SalesMarketNudgesEditor({
  payload,
  onChange,
}: {
  payload: unknown;
  onChange: (p: unknown) => void;
  moduleSlug: string;
  requiredTier: string;
}) {
  const content = normalizeSalesMarketNudgesPayload(
    payload ?? DEFAULT_SALES_MARKET_NUDGES_CONTENT
  );

  function patch(next: typeof content) {
    onChange(next);
  }

  function updateNudge(index: number, updates: Partial<MarketNudgeItem>) {
    const next = [...content.weeklyNudges];
    next[index] = { ...next[index]!, ...updates };
    patch({ ...content, weeklyNudges: next });
  }

  function addNudge() {
    patch({
      ...content,
      weeklyNudges: [
        ...content.weeklyNudges,
        { id: newNudgeId(), text: "", accountNames: [] },
      ],
    });
  }

  function removeNudge(index: number) {
    patch({
      ...content,
      weeklyNudges: content.weeklyNudges.filter((_, i) => i !== index),
    });
  }

  function updateBrief(index: number, updates: Partial<IntelligenceBrief>) {
    const next = [...content.intelligenceBriefs];
    next[index] = { ...next[index]!, ...updates };
    patch({ ...content, intelligenceBriefs: next });
  }

  function addBrief() {
    const now = new Date();
    patch({
      ...content,
      intelligenceBriefs: [
        ...content.intelligenceBriefs,
        {
          id: newBriefId(),
          title: "New Brief",
          category: "Crude",
          month: now.getMonth() + 1,
          year: now.getFullYear(),
          description: "",
          discoveryQuestions: ["", ""],
          updatedLabel: "Updated Mon",
        },
      ],
    });
  }

  function removeBrief(index: number) {
    patch({
      ...content,
      intelligenceBriefs: content.intelligenceBriefs.filter((_, i) => i !== index),
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-fg bg-secondary/50 rounded-lg px-3 py-2">
        Edit weekly market nudges and intelligence briefs for{" "}
        <code className="text-[11px]">/dashboard/sales-market-nudges</code>. Briefs appear under
        Intelligence Briefs filtered by month and year.
      </p>

      <EditorSection title="Page hero" defaultOpen>
        <EditorField label="Eyebrow">
          <input
            className={inputClass}
            value={content.eyebrow}
            onChange={(e) => patch({ ...content, eyebrow: e.target.value })}
          />
        </EditorField>
        <EditorField label="Title">
          <input
            className={inputClass}
            value={content.title}
            onChange={(e) => patch({ ...content, title: e.target.value })}
          />
        </EditorField>
        <EditorField label="Description">
          <textarea
            className={textareaClass}
            value={content.description}
            onChange={(e) => patch({ ...content, description: e.target.value })}
          />
        </EditorField>
      </EditorSection>

      <EditorSection
        title="This Week — Market Nudges"
        description="Shown in the dark green card at the top of the page."
        defaultOpen
      >
        <div className="space-y-4">
          {content.weeklyNudges.map((nudge, i) => (
            <div key={nudge.id} className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-gray-900">Nudge {i + 1}</p>
                <button
                  type="button"
                  onClick={() => removeNudge(i)}
                  className="p-1 rounded hover:bg-red-50 text-muted-fg hover:text-red-500"
                  aria-label="Remove nudge"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <EditorField label="Text (account names added separately)">
                <textarea
                  className={textareaClass}
                  rows={2}
                  value={nudge.text}
                  onChange={(e) => updateNudge(i, { text: e.target.value })}
                />
              </EditorField>
              <EditorField label="Account names (comma-separated, rendered bold)">
                <input
                  className={inputClass}
                  value={nudge.accountNames.join(", ")}
                  onChange={(e) =>
                    updateNudge(i, {
                      accountNames: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </EditorField>
            </div>
          ))}
          <Button type="button" size="sm" variant="outline" onClick={addNudge} className="gap-1.5">
            <Plus className="w-4 h-4" /> Add nudge
          </Button>
        </div>
      </EditorSection>

      <EditorSection
        title="Intelligence Briefs"
        description="Grouped by month/year on the member page sidebar."
        defaultOpen
      >
        <div className="space-y-4">
          {content.intelligenceBriefs.map((brief, i) => (
            <div key={brief.id} className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-gray-900">
                  {brief.title} · {formatBriefPeriodLabel(brief.month, brief.year)}
                </p>
                <button
                  type="button"
                  onClick={() => removeBrief(i)}
                  className="p-1 rounded hover:bg-red-50 text-muted-fg hover:text-red-500"
                  aria-label="Remove brief"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <EditorField label="Title">
                  <input
                    className={inputClass}
                    value={brief.title}
                    onChange={(e) => updateBrief(i, { title: e.target.value })}
                  />
                </EditorField>
                <EditorField label="Category">
                  <input
                    className={inputClass}
                    value={brief.category}
                    onChange={(e) => updateBrief(i, { category: e.target.value })}
                  />
                </EditorField>
                <EditorField label="Month">
                  <select
                    className={inputClass}
                    value={brief.month}
                    onChange={(e) => updateBrief(i, { month: Number(e.target.value) })}
                  >
                    {MONTHS.map((name, monthIndex) => (
                      <option key={name} value={monthIndex + 1}>
                        {name}
                      </option>
                    ))}
                  </select>
                </EditorField>
                <EditorField label="Year">
                  <input
                    className={inputClass}
                    type="number"
                    min={2020}
                    max={2100}
                    value={brief.year}
                    onChange={(e) => updateBrief(i, { year: Number(e.target.value) })}
                  />
                </EditorField>
                <EditorField label="Updated label (optional)">
                  <input
                    className={inputClass}
                    value={brief.updatedLabel ?? ""}
                    onChange={(e) =>
                      updateBrief(i, { updatedLabel: e.target.value || undefined })
                    }
                    placeholder="Updated Mon"
                  />
                </EditorField>
              </div>
              <EditorField label="Description">
                <textarea
                  className={textareaClass}
                  rows={3}
                  value={brief.description}
                  onChange={(e) => updateBrief(i, { description: e.target.value })}
                />
              </EditorField>
              <EditorField label="Discovery questions (one per line)">
                <textarea
                  className={textareaClass}
                  rows={3}
                  value={brief.discoveryQuestions.join("\n")}
                  onChange={(e) =>
                    updateBrief(i, {
                      discoveryQuestions: e.target.value
                        .split("\n")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </EditorField>
            </div>
          ))}
          <Button type="button" size="sm" variant="outline" onClick={addBrief} className="gap-1.5">
            <Plus className="w-4 h-4" /> Add brief
          </Button>
        </div>
      </EditorSection>
    </div>
  );
}
