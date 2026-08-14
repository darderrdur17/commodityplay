"use client";

import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EditorField, EditorRow, UploadSection, inputClass, textareaClass } from "./shared";
import { SingleGuideUpload, type GuideAttachment } from "./single-guide-upload";

type RoleCategory = "front" | "ops" | "middle" | "adjacent";

interface CareerRole {
  id: number;
  slug: string;
  cat: RoleCategory;
  categoryLabel: string;
  title: string;
  tags: { label: string; variant: string }[];
  summary: string;
  difficulty: "low" | "med" | "high";
  timeline: string;
  firms: string;
  what: string;
  backgrounds: string[];
  redFlags: string[];
  comp: { label: string; range: string }[];
  upgrade: string;
}

function newRole(id: number): CareerRole {
  return {
    id,
    slug: "",
    cat: "front",
    categoryLabel: "Front Office",
    title: "New Role",
    tags: [],
    summary: "",
    difficulty: "med",
    timeline: "",
    firms: "",
    what: "",
    backgrounds: [],
    redFlags: [],
    comp: [],
    upgrade: "",
  };
}

type RoadmapPayload = {
  roles?: CareerRole[];
  careerNavigationGuide?: GuideAttachment | null;
  navigationGuides?: { id: string; label: string; fileName: string; assetId: string; track: "career" | "sales" | "both"; updatedAt: string }[];
  [key: string]: unknown;
};

export function CareerRoadmapEditor({
  payload,
  onChange,
  moduleSlug,
  requiredTier,
  initialTab = "roles",
}: {
  payload: unknown;
  onChange: (p: unknown) => void;
  moduleSlug: string;
  requiredTier: string;
  initialTab?: "roles" | "navguide";
}) {
  const [activeTab, setActiveTab] = useState<"roles" | "navguide">(initialTab);

  // Support both legacy array payload and object payload
  const isLegacyArray = Array.isArray(payload);
  const raw: RoadmapPayload = isLegacyArray
    ? { roles: payload as CareerRole[] }
    : ((payload as RoadmapPayload) ?? {});

  const items: CareerRole[] = raw.roles ?? [];

  function updateRaw(updates: Partial<RoadmapPayload>) {
    onChange({ ...raw, ...updates });
  }

  function patchItem(i: number, item: CareerRole) {
    const next = [...items];
    next[i] = item;
    updateRaw({ roles: next });
  }

  function deleteItem(i: number) {
    if (!confirm("Delete this role?")) return;
    updateRaw({ roles: items.filter((_, j) => j !== i) });
  }

  function addItem() {
    updateRaw({ roles: [...items, newRole(items.length + 1)] });
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-border pb-2">
        {(["roles", "navguide"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              activeTab === tab ? "bg-primary-soft text-primary-400" : "text-muted-fg hover:bg-secondary/60"
            )}
          >
            {tab === "navguide" ? "Career Navigation Guide" : "Roles"}
          </button>
        ))}
      </div>

      {activeTab === "navguide" && (
        <div className="space-y-4">
          <p className="text-xs text-muted-fg">
            Pro Pack deliverable shown on the member dashboard for <strong>Career track</strong> Pro
            and Elite members. View-only PDF — not the same as the free footer Career Guide.
          </p>
          <SingleGuideUpload
            guide={raw.careerNavigationGuide ?? null}
            onChange={(g) => updateRaw({ careerNavigationGuide: g })}
            moduleSlug={moduleSlug}
            requiredTier={requiredTier}
            assetKey="career-roadmap/career-navigation-guide"
            defaultLabel="Career Navigation Guide"
          />
        </div>
      )}

      {activeTab === "roles" && <>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-fg">{items.length} roles</p>
        <Button variant="outline" size="sm" onClick={addItem}>
          <Plus className="w-3.5 h-3.5" /> Add role
        </Button>
      </div>

      <div className="space-y-2">
        {items.map((item, i) => (
          <EditorRow
            key={item.id}
            summary={
              <span>
                <span className="font-medium">{item.title}</span>
                <span className="ml-2 text-xs text-muted-fg">{item.categoryLabel}</span>
              </span>
            }
            onDelete={() => deleteItem(i)}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <EditorField label="Title">
                <input className={inputClass} value={item.title} onChange={(e) => patchItem(i, { ...item, title: e.target.value })} />
              </EditorField>
              <EditorField label="Category">
                <select className={inputClass} value={item.cat} onChange={(e) => {
                  const cat = e.target.value as RoleCategory;
                  const labels: Record<RoleCategory, string> = { front: "Front Office", ops: "Operations", middle: "Middle Office", adjacent: "Adjacent" };
                  patchItem(i, { ...item, cat, categoryLabel: labels[cat] });
                }}>
                  <option value="front">Front Office</option>
                  <option value="ops">Operations</option>
                  <option value="middle">Middle Office</option>
                  <option value="adjacent">Adjacent</option>
                </select>
              </EditorField>
              <EditorField label="Difficulty">
                <select className={inputClass} value={item.difficulty} onChange={(e) => patchItem(i, { ...item, difficulty: e.target.value as CareerRole["difficulty"] })}>
                  <option value="low">Low</option>
                  <option value="med">Medium</option>
                  <option value="high">High</option>
                </select>
              </EditorField>
              <EditorField label="Timeline">
                <input className={inputClass} value={item.timeline} onChange={(e) => patchItem(i, { ...item, timeline: e.target.value })} />
              </EditorField>
            </div>
            <EditorField label="Summary">
              <textarea className={textareaClass} value={item.summary} onChange={(e) => patchItem(i, { ...item, summary: e.target.value })} />
            </EditorField>
            <EditorField label="What you do">
              <textarea className={textareaClass} value={item.what} onChange={(e) => patchItem(i, { ...item, what: e.target.value })} />
            </EditorField>
            <EditorField label="Firms">
              <input className={inputClass} value={item.firms} onChange={(e) => patchItem(i, { ...item, firms: e.target.value })} />
            </EditorField>
            <EditorField label="Backgrounds" hint="One per line">
              <textarea className={textareaClass} value={(item.backgrounds ?? []).join("\n")} onChange={(e) => patchItem(i, { ...item, backgrounds: e.target.value.split("\n").filter(Boolean) })} />
            </EditorField>
            <EditorField label="Red flags" hint="One per line">
              <textarea className={textareaClass} value={(item.redFlags ?? []).join("\n")} onChange={(e) => patchItem(i, { ...item, redFlags: e.target.value.split("\n").filter(Boolean) })} />
            </EditorField>
            <EditorField label="Upgrade path">
              <textarea className={textareaClass} value={item.upgrade} onChange={(e) => patchItem(i, { ...item, upgrade: e.target.value })} />
            </EditorField>
          </EditorRow>
        ))}
        {items.length === 0 && (
          <p className="text-center text-sm text-muted-fg py-8">No roles yet.</p>
        )}
      </div>

      <UploadSection moduleSlug={moduleSlug} requiredTier={requiredTier} />
      </>}
    </div>
  );
}
