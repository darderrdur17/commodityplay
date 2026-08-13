"use client";

import React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditorField, EditorRow, TrackToggle, UploadSection, inputClass, textareaClass } from "./shared";

interface CaseStudyCard {
  slug: string;
  id: string;
  category: string;
  title: string;
  catchLine: string;
  description: string;
  readMinutes: number;
  status: "published" | "coming-soon";
  hasFullContent: boolean;
  track?: "career" | "sales" | "both";
}

function newCase(): CaseStudyCard {
  return {
    slug: "",
    id: `cs-${Date.now()}`,
    category: "",
    title: "",
    catchLine: "",
    description: "",
    readMinutes: 5,
    status: "coming-soon",
    hasFullContent: false,
  };
}

export function CaseStudiesEditor({
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
  const items: CaseStudyCard[] = Array.isArray(payload) ? (payload as CaseStudyCard[]) : [];

  function patchItem(i: number, item: CaseStudyCard) {
    const next = [...items];
    next[i] = item;
    onChange(next);
  }

  function deleteItem(i: number) {
    if (!confirm("Delete this case study?")) return;
    onChange(items.filter((_, j) => j !== i));
  }

  function addItem() {
    onChange([...items, newCase()]);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-fg">{items.length} case studies</p>
        <Button variant="outline" size="sm" onClick={addItem}>
          <Plus className="w-3.5 h-3.5" /> Add case study
        </Button>
      </div>

      <div className="space-y-2">
        {items.map((item, i) => (
          <EditorRow
            key={item.id}
            summary={
              <span>
                <span className="font-medium">{item.title || "(untitled)"}</span>
                <span className="ml-2 text-xs text-muted-fg">{item.category}</span>
                <span className={`ml-2 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${item.status === "published" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {item.status}
                </span>
              </span>
            }
            onDelete={() => deleteItem(i)}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <EditorField label="Title">
                <input className={inputClass} value={item.title} onChange={(e) => patchItem(i, { ...item, title: e.target.value })} />
              </EditorField>
              <EditorField label="Category">
                <input className={inputClass} value={item.category} onChange={(e) => patchItem(i, { ...item, category: e.target.value })} />
              </EditorField>
              <EditorField label="Slug">
                <input className={inputClass} value={item.slug} onChange={(e) => patchItem(i, { ...item, slug: e.target.value })} />
              </EditorField>
              <EditorField label="Read time (minutes)">
                <input type="number" className={inputClass} value={item.readMinutes} onChange={(e) => patchItem(i, { ...item, readMinutes: Number(e.target.value) })} />
              </EditorField>
              <EditorField label="Status">
                <select className={inputClass} value={item.status} onChange={(e) => patchItem(i, { ...item, status: e.target.value as CaseStudyCard["status"] })}>
                  <option value="published">Published</option>
                  <option value="coming-soon">Coming soon</option>
                </select>
              </EditorField>
            </div>
            <EditorField label="Catch line">
              <input className={inputClass} value={item.catchLine} onChange={(e) => patchItem(i, { ...item, catchLine: e.target.value })} />
            </EditorField>
            <EditorField label="Description">
              <textarea className={textareaClass} value={item.description} onChange={(e) => patchItem(i, { ...item, description: e.target.value })} />
            </EditorField>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input type="checkbox" checked={item.hasFullContent} onChange={(e) => patchItem(i, { ...item, hasFullContent: e.target.checked })} />
              Has full content
            </label>
            <EditorField label="Track">
              <TrackToggle value={item.track ?? "both"} onChange={(v) => patchItem(i, { ...item, track: v })} />
            </EditorField>
          </EditorRow>
        ))}
        {items.length === 0 && (
          <p className="text-center text-sm text-muted-fg py-8">No case studies yet.</p>
        )}
      </div>

      <UploadSection moduleSlug={moduleSlug} requiredTier={requiredTier} />
    </div>
  );
}
