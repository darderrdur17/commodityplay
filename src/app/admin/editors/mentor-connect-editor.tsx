"use client";

import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditorField, TrackToggle, inputClass } from "./shared";

interface MentorCategory {
  id: string;
  label: string;
  track: "career" | "sales" | "both";
}

function newCategory(): MentorCategory {
  return { id: `mc-${Date.now()}`, label: "", track: "both" };
}

export function MentorConnectEditor({
  payload,
  onChange,
}: {
  payload: unknown;
  onChange: (p: unknown) => void;
}) {
  const raw = payload as { categories?: MentorCategory[] } | null;
  const categories: MentorCategory[] = raw?.categories ?? [];

  function patchCategory(i: number, cat: MentorCategory) {
    const next = [...categories];
    next[i] = cat;
    onChange({ ...raw, categories: next });
  }

  function deleteCategory(i: number) {
    if (!confirm("Delete this category?")) return;
    onChange({ ...raw, categories: categories.filter((_, j) => j !== i) });
  }

  function addCategory() {
    onChange({ ...raw, categories: [...categories, newCategory()] });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-fg">{categories.length} subject categories</p>
        <Button variant="outline" size="sm" onClick={addCategory}>
          <Plus className="w-3.5 h-3.5" /> Add category
        </Button>
      </div>

      <div className="space-y-2">
        {categories.map((cat, i) => (
          <div key={cat.id} className="flex items-center gap-3 p-3 border border-border rounded-lg">
            <div className="flex-1 grid gap-3 sm:grid-cols-2">
              <EditorField label="Label">
                <input
                  className={inputClass}
                  value={cat.label}
                  onChange={(e) => patchCategory(i, { ...cat, label: e.target.value })}
                  placeholder="e.g. Crude Oil Desk"
                />
              </EditorField>
              <EditorField label="Track">
                <TrackToggle value={cat.track} onChange={(v) => patchCategory(i, { ...cat, track: v })} />
              </EditorField>
            </div>
            <button
              type="button"
              onClick={() => deleteCategory(i)}
              className="text-red-400 hover:text-red-600 p-1 shrink-0 mt-5"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {categories.length === 0 && (
          <p className="text-center text-sm text-muted-fg py-8">No categories yet.</p>
        )}
      </div>
    </div>
  );
}
