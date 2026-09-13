"use client";

import React, { useMemo, useState } from "react";
import { Archive, ArchiveRestore, Plus, Trash2 } from "lucide-react";
import {
  DEFAULT_SALES_MARKET_NUDGES_CONTENT,
  formatBriefPeriodLabel,
  type IntelligenceBrief,
  type MarketNudgeItem,
} from "@/data/sales-market-nudges";
import { normalizeSalesMarketNudgesPayload } from "@/lib/content/sales-market-nudges-schema";
import { EditorField, EditorSection, inputClass, textareaClass } from "./shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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

type ArchiveFilter = "active" | "archived" | "all";

function ArchiveFilterBar({
  value,
  onChange,
  counts,
}: {
  value: ArchiveFilter;
  onChange: (value: ArchiveFilter) => void;
  counts: { active: number; archived: number; all: number };
}) {
  const options: { id: ArchiveFilter; label: string; count: number }[] = [
    { id: "active", label: "Active", count: counts.active },
    { id: "archived", label: "Archived", count: counts.archived },
    { id: "all", label: "All", count: counts.all },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
            value === option.id
              ? "bg-[#065F46]/10 text-[#065F46]"
              : "bg-secondary text-muted-fg hover:bg-secondary/80 hover:text-gray-900"
          )}
        >
          {option.label}
          <span className="ml-1 opacity-70">({option.count})</span>
        </button>
      ))}
    </div>
  );
}

function matchesArchiveFilter(archived: boolean | undefined, filter: ArchiveFilter) {
  if (filter === "all") return true;
  if (filter === "archived") return Boolean(archived);
  return !archived;
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
  const [nudgeFilter, setNudgeFilter] = useState<ArchiveFilter>("active");
  const [briefFilter, setBriefFilter] = useState<ArchiveFilter>("active");

  const nudgeCounts = useMemo(
    () => ({
      active: content.weeklyNudges.filter((n) => !n.archived).length,
      archived: content.weeklyNudges.filter((n) => n.archived).length,
      all: content.weeklyNudges.length,
    }),
    [content.weeklyNudges]
  );

  const briefCounts = useMemo(
    () => ({
      active: content.intelligenceBriefs.filter((b) => !b.archived).length,
      archived: content.intelligenceBriefs.filter((b) => b.archived).length,
      all: content.intelligenceBriefs.length,
    }),
    [content.intelligenceBriefs]
  );

  const visibleNudges = content.weeklyNudges
    .map((nudge, index) => ({ nudge, index }))
    .filter(({ nudge }) => matchesArchiveFilter(nudge.archived, nudgeFilter));

  const visibleBriefs = content.intelligenceBriefs
    .map((brief, index) => ({ brief, index }))
    .filter(({ brief }) => matchesArchiveFilter(brief.archived, briefFilter));

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
          category: content.briefCategories[0] || "Crude",
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
        <code className="text-[11px]">/dashboard/sales-market-nudges</code>. Members can filter
        briefs by month and by the categories you define below.
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
        title="Brief categories"
        description="Commodity labels (Crude, Gasoline, LNG, etc.) used on each intelligence brief and as the member category filter."
        defaultOpen
      >
        <EditorField label="Categories (one per line)">
          <textarea
            className={textareaClass}
            rows={4}
            value={content.briefCategories.join("\n")}
            onChange={(e) =>
              patch({
                ...content,
                briefCategories: e.target.value
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
          />
        </EditorField>
      </EditorSection>

      <EditorSection
        title="This Week — Market Nudges"
        description="Shown in the dark green card at the top of the page. Archive old nudges when drafting a new weekly set."
        defaultOpen
      >
        <ArchiveFilterBar value={nudgeFilter} onChange={setNudgeFilter} counts={nudgeCounts} />
        <div className="space-y-4">
          {visibleNudges.length === 0 ? (
            <p className="text-sm text-muted-fg">No nudges in this view.</p>
          ) : (
            visibleNudges.map(({ nudge, index: i }) => (
            <div
              key={nudge.id}
              className={cn(
                "rounded-lg border p-4 space-y-3",
                nudge.archived ? "border-amber-200 bg-amber-50/40" : "border-border"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">Nudge {i + 1}</p>
                  {nudge.archived && (
                    <Badge size="sm" variant="secondary">
                      Archived
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => updateNudge(i, { archived: !nudge.archived })}
                    className="p-1 rounded hover:bg-secondary text-muted-fg hover:text-gray-900"
                    aria-label={nudge.archived ? "Restore nudge" : "Archive nudge"}
                    title={nudge.archived ? "Restore to active" : "Archive (hide from members)"}
                  >
                    {nudge.archived ? (
                      <ArchiveRestore className="w-4 h-4" />
                    ) : (
                      <Archive className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeNudge(i)}
                    className="p-1 rounded hover:bg-red-50 text-muted-fg hover:text-red-500"
                    aria-label="Remove nudge"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
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
            ))
          )}
          <Button type="button" size="sm" variant="outline" onClick={addNudge} className="gap-1.5">
            <Plus className="w-4 h-4" /> Add nudge
          </Button>
        </div>
      </EditorSection>

      <EditorSection
        title="Intelligence Briefs"
        description="Grouped by month/year on the member page sidebar. Archive past briefs when publishing new weekly content."
        defaultOpen
      >
        <ArchiveFilterBar value={briefFilter} onChange={setBriefFilter} counts={briefCounts} />
        <div className="space-y-4">
          {visibleBriefs.length === 0 ? (
            <p className="text-sm text-muted-fg">No briefs in this view.</p>
          ) : (
            visibleBriefs.map(({ brief, index: i }) => (
            <div
              key={brief.id}
              className={cn(
                "rounded-lg border p-4 space-y-3",
                brief.archived ? "border-amber-200 bg-amber-50/40" : "border-border"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {brief.title} · {formatBriefPeriodLabel(brief.month, brief.year)}
                  </p>
                  {brief.archived && (
                    <Badge size="sm" variant="secondary">
                      Archived
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => updateBrief(i, { archived: !brief.archived })}
                    className="p-1 rounded hover:bg-secondary text-muted-fg hover:text-gray-900"
                    aria-label={brief.archived ? "Restore brief" : "Archive brief"}
                    title={brief.archived ? "Restore to active" : "Archive (hide from members)"}
                  >
                    {brief.archived ? (
                      <ArchiveRestore className="w-4 h-4" />
                    ) : (
                      <Archive className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeBrief(i)}
                    className="p-1 rounded hover:bg-red-50 text-muted-fg hover:text-red-500"
                    aria-label="Remove brief"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
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
                  <select
                    className={inputClass}
                    value={brief.category}
                    onChange={(e) => updateBrief(i, { category: e.target.value })}
                  >
                    {!content.briefCategories.includes(brief.category) && brief.category && (
                      <option value={brief.category}>{brief.category}</option>
                    )}
                    {content.briefCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
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
            ))
          )}
          <Button type="button" size="sm" variant="outline" onClick={addBrief} className="gap-1.5">
            <Plus className="w-4 h-4" /> Add brief
          </Button>
        </div>
      </EditorSection>
    </div>
  );
}
