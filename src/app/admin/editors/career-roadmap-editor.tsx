"use client";

import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditorField, EditorRow, UploadSection, inputClass, textareaClass } from "./shared";

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

export function CareerRoadmapEditor({
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
  const items: CareerRole[] = Array.isArray(payload) ? (payload as CareerRole[]) : [];

  function patchItem(i: number, item: CareerRole) {
    const next = [...items];
    next[i] = item;
    onChange(next);
  }

  function deleteItem(i: number) {
    if (!confirm("Delete this role?")) return;
    onChange(items.filter((_, j) => j !== i));
  }

  function addItem() {
    onChange([...items, newRole(items.length + 1)]);
  }

  return (
    <div className="space-y-4">
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
    </div>
  );
}
