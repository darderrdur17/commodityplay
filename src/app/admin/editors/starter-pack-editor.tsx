"use client";

import React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditorField, EditorRow, UploadSection, inputClass, textareaClass } from "./shared";

interface StarterInfographic {
  id: string;
  num: string;
  title: string;
  description: string;
  thumbClass: string;
  fileKey: string;
}

function newInfographic(idx: number): StarterInfographic {
  return { id: `sp-${Date.now()}`, num: String(idx + 1).padStart(2, "0"), title: "", description: "", thumbClass: "from-gray-100 to-gray-300", fileKey: "" };
}

export function StarterPackEditor({
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
  const items: StarterInfographic[] = Array.isArray(payload) ? (payload as StarterInfographic[]) : [];

  function patchItem(i: number, item: StarterInfographic) {
    const next = [...items];
    next[i] = item;
    onChange(next);
  }

  function deleteItem(i: number) {
    if (!confirm("Delete this item?")) return;
    onChange(items.filter((_, j) => j !== i));
  }

  function addItem() {
    onChange([...items, newInfographic(items.length)]);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-fg">{items.length} infographics</p>
        <Button variant="outline" size="sm" onClick={addItem}>
          <Plus className="w-3.5 h-3.5" /> Add infographic
        </Button>
      </div>

      <div className="space-y-2">
        {items.map((item, i) => (
          <EditorRow
            key={item.id}
            summary={<span><span className="font-medium">{item.num}. {item.title || "(untitled)"}</span></span>}
            onDelete={() => deleteItem(i)}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <EditorField label="Number">
                <input className={inputClass} value={item.num} onChange={(e) => patchItem(i, { ...item, num: e.target.value })} />
              </EditorField>
              <EditorField label="Title">
                <input className={inputClass} value={item.title} onChange={(e) => patchItem(i, { ...item, title: e.target.value })} />
              </EditorField>
              <EditorField label="File key" hint="e.g. starter-pack/ecosystem-map.pdf">
                <input className={inputClass} value={item.fileKey} onChange={(e) => patchItem(i, { ...item, fileKey: e.target.value })} />
              </EditorField>
              <EditorField label="Thumb class" hint="Tailwind gradient classes">
                <input className={inputClass} value={item.thumbClass} onChange={(e) => patchItem(i, { ...item, thumbClass: e.target.value })} />
              </EditorField>
            </div>
            <EditorField label="Description">
              <textarea className={textareaClass} value={item.description} onChange={(e) => patchItem(i, { ...item, description: e.target.value })} />
            </EditorField>
          </EditorRow>
        ))}
        {items.length === 0 && (
          <p className="text-center text-sm text-muted-fg py-8">No infographics yet.</p>
        )}
      </div>

      <UploadSection moduleSlug={moduleSlug} requiredTier={requiredTier} />
    </div>
  );
}
