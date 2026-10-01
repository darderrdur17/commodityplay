"use client";

import React, { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  DEFAULT_SALES_MARKET_NUDGES_CONTENT,
  defaultBriefUpdatedAt,
  formatBriefPeriodLabel,
  type IntelligenceBrief,
  type MarketNudgeItem,
  type NudgeLifecycleStatus,
} from "@/data/sales-market-nudges";
import { normalizeSalesMarketNudgesPayload } from "@/lib/content/sales-market-nudges-schema";
import { EditorField, EditorSection, inputClass, textareaClass } from "./shared";
import { Button } from "@/components/ui/button";
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

type StatusFilter = "active" | "expired" | "archive" | "all";

function StatusFilterBar({
  value,
  onChange,
  counts,
}: {
  value: StatusFilter;
  onChange: (value: StatusFilter) => void;
  counts: { active: number; expired: number; archive: number; all: number };
}) {
  const options: { id: StatusFilter; label: string; count: number }[] = [
    { id: "active", label: "Active", count: counts.active },
    { id: "expired", label: "Expired", count: counts.expired },
    { id: "archive", label: "Archive", count: counts.archive },
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

function matchesStatusFilter(status: NudgeLifecycleStatus | undefined, filter: StatusFilter) {
  if (filter === "all") return true;
  return (status ?? "active") === filter;
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
  const [nudgeFilter, setNudgeFilter] = useState<StatusFilter>("active");
  const [briefFilter, setBriefFilter] = useState<StatusFilter>("active");

  const nudgeCounts = useMemo(
    () => ({
      active: content.weeklyNudges.filter((n) => n.status === "active").length,
      expired: content.weeklyNudges.filter((n) => n.status === "expired").length,
      archive: content.weeklyNudges.filter((n) => n.status === "archive").length,
      all: content.weeklyNudges.length,
    }),
    [content.weeklyNudges]
  );

  const briefCounts = useMemo(
    () => ({
      active: content.intelligenceBriefs.filter((b) => b.status === "active").length,
      expired: content.intelligenceBriefs.filter((b) => b.status === "expired").length,
      archive: content.intelligenceBriefs.filter((b) => b.status === "archive").length,
      all: content.intelligenceBriefs.length,
    }),
    [content.intelligenceBriefs]
  );

  const visibleNudges = content.weeklyNudges
    .map((nudge, index) => ({ nudge, index }))
    .filter(({ nudge }) => matchesStatusFilter(nudge.status, nudgeFilter));

  const visibleBriefs = content.intelligenceBriefs
    .map((brief, index) => ({ brief, index }))
    .filter(({ brief }) => matchesStatusFilter(brief.status, briefFilter));

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
        { id: newNudgeId(), title: "", whyNow: "", accountAction: "", accountNames: [], status: "active" },
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
          updatedAt: defaultBriefUpdatedAt(now.getFullYear(), now.getMonth() + 1),
          status: "active",
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
        <EditorField label="This week card heading">
          <input
            className={inputClass}
            value={content.weeklyHeading}
            onChange={(e) => patch({ ...content, weeklyHeading: e.target.value })}
            placeholder="This Week — Talking Points"
          />
        </EditorField>
        <EditorField label="Briefs section heading">
          <input
            className={inputClass}
            value={content.briefsHeading}
            onChange={(e) => patch({ ...content, briefsHeading: e.target.value })}
            placeholder="Talking Points"
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
        title="This Week — Talking Points"
        description="Shown in the dark green card at the top of the page. Archive old nudges when drafting a new weekly set."
        defaultOpen
      >
        <StatusFilterBar value={nudgeFilter} onChange={setNudgeFilter} counts={nudgeCounts} />
        <div className="space-y-4">
          {visibleNudges.length === 0 ? (
            <p className="text-sm text-muted-fg">No nudges in this view.</p>
          ) : (
            visibleNudges.map(({ nudge, index: i }) => (
            <div
              key={nudge.id}
              className={cn(
                "rounded-lg border p-4 space-y-3",
                nudge.status === "archive" ? "border-amber-200 bg-amber-50/40" : "border-border"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-gray-900">Nudge {i + 1}</p>
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    className={inputClass}
                    value={nudge.status}
                    onChange={(e) =>
                      updateNudge(i, { status: e.target.value as NudgeLifecycleStatus })
                    }
                  >
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="archive">Archive</option>
                  </select>
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
              <EditorField label="Title">
                <input
                  className={inputClass}
                  maxLength={120}
                  value={nudge.title}
                  onChange={(e) => updateNudge(i, { title: e.target.value })}
                />
              </EditorField>
              <EditorField label="What's now">
                <textarea
                  className={textareaClass}
                  rows={2}
                  maxLength={500}
                  value={nudge.whyNow}
                  onChange={(e) => updateNudge(i, { whyNow: e.target.value })}
                />
              </EditorField>
              <EditorField label="Account action">
                <textarea
                  className={textareaClass}
                  rows={2}
                  maxLength={500}
                  value={nudge.accountAction}
                  onChange={(e) => updateNudge(i, { accountAction: e.target.value })}
                />
              </EditorField>
              <EditorField label="Account names (comma-separated)">
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
        title="Talking Points"
        description="Grouped by month/year on the member page sidebar. Archive past briefs when publishing new weekly content."
        defaultOpen
      >
        <StatusFilterBar value={briefFilter} onChange={setBriefFilter} counts={briefCounts} />
        <div className="space-y-4">
          {visibleBriefs.length === 0 ? (
            <p className="text-sm text-muted-fg">No briefs in this view.</p>
          ) : (
            visibleBriefs.map(({ brief, index: i }) => (
            <div
              key={brief.id}
              className={cn(
                "rounded-lg border p-4 space-y-3",
                brief.status === "archive" ? "border-amber-200 bg-amber-50/40" : "border-border"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-gray-900 min-w-0">
                  {brief.title} · {formatBriefPeriodLabel(brief.month, brief.year)}
                </p>
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    className={inputClass}
                    value={brief.status}
                    onChange={(e) =>
                      updateBrief(i, { status: e.target.value as NudgeLifecycleStatus })
                    }
                  >
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="archive">Archive</option>
                  </select>
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
                <EditorField label="Updated date">
                  <input
                    className={inputClass}
                    type="date"
                    value={brief.updatedAt ?? ""}
                    onChange={(e) =>
                      updateBrief(i, { updatedAt: e.target.value || undefined })
                    }
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
