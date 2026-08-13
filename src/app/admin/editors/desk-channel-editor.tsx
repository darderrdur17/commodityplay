"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EditorField, EditorRow, TrackToggle, UploadSection, inputClass, textareaClass } from "./shared";

type DeskCategory = "trading" | "ops" | "risk" | "tools" | "career";

interface DeskQA {
  id: string;
  category: DeskCategory;
  categoryLabel: string;
  categoryColor: string;
  question: string;
  answer: string;
  deskSignal?: string;
  attribution: string;
  author: string;
  authorRole: string;
  tags: string[];
  helpful: number;
  date: string;
  track?: "career" | "sales" | "both";
}

const CATEGORIES: { id: string; label: string }[] = [
  { id: "all", label: "All" },
  { id: "trading", label: "Trading" },
  { id: "ops", label: "Ops" },
  { id: "risk", label: "Risk" },
  { id: "tools", label: "Tools" },
  { id: "career", label: "Career" },
];

function newQA(): DeskQA {
  return {
    id: `dq-${Date.now()}`,
    category: "trading",
    categoryLabel: "Trading",
    categoryColor: "bg-blue-100 text-blue-700",
    question: "",
    answer: "",
    attribution: "editorial",
    author: "",
    authorRole: "",
    tags: [],
    helpful: 0,
    date: new Date().toISOString().slice(0, 10),
  };
}

export function DeskChannelEditor({
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
  const items: DeskQA[] = Array.isArray(payload) ? (payload as DeskQA[]) : [];
  const [cat, setCat] = useState("all");

  function patchItem(i: number, item: DeskQA) {
    const next = [...items];
    next[i] = item;
    onChange(next);
  }

  function deleteItem(i: number) {
    onChange(items.filter((_, j) => j !== i));
  }

  function addItem() {
    onChange([...items, newQA()]);
  }

  const filtered = items.map((item, i) => ({ item, i })).filter(({ item }) => cat === "all" || item.category === cat);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1 flex-wrap">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCat(c.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                cat === c.id ? "bg-primary-soft text-primary-400" : "bg-secondary text-muted-fg hover:bg-secondary/80"
              )}
            >
              {c.label} {c.id !== "all" && `(${items.filter((x) => x.category === c.id).length})`}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={addItem}>
          <Plus className="w-3.5 h-3.5" /> Add Q&amp;A
        </Button>
      </div>

      <p className="text-xs text-muted-fg">{items.length} entries · showing {filtered.length}</p>

      <div className="space-y-2">
        {filtered.map(({ item, i }) => (
          <EditorRow
            key={item.id}
            summary={
              <span>
                <span className="font-medium line-clamp-1">{item.question || "(no question)"}</span>
                <span className="ml-2 text-xs text-muted-fg">{item.category}</span>
              </span>
            }
            onDelete={() => deleteItem(i)}
          >
            <EditorField label="Question">
              <textarea className={textareaClass} value={item.question} onChange={(e) => patchItem(i, { ...item, question: e.target.value })} />
            </EditorField>
            <EditorField label="Answer">
              <textarea className={textareaClass} rows={5} value={item.answer} onChange={(e) => patchItem(i, { ...item, answer: e.target.value })} />
            </EditorField>
            <div className="grid gap-3 sm:grid-cols-2">
              <EditorField label="Category">
                <select className={inputClass} value={item.category} onChange={(e) => patchItem(i, { ...item, category: e.target.value as DeskCategory, categoryLabel: e.target.value })}>
                  {CATEGORIES.filter((c) => c.id !== "all").map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </EditorField>
              <EditorField label="Attribution">
                <select className={inputClass} value={item.attribution} onChange={(e) => patchItem(i, { ...item, attribution: e.target.value })}>
                  <option value="editorial">Editorial</option>
                  <option value="practitioner">Practitioner</option>
                </select>
              </EditorField>
              <EditorField label="Author">
                <input className={inputClass} value={item.author} onChange={(e) => patchItem(i, { ...item, author: e.target.value })} />
              </EditorField>
              <EditorField label="Author role">
                <input className={inputClass} value={item.authorRole} onChange={(e) => patchItem(i, { ...item, authorRole: e.target.value })} />
              </EditorField>
            </div>
            <EditorField label="Desk signal">
              <input className={inputClass} value={item.deskSignal ?? ""} onChange={(e) => patchItem(i, { ...item, deskSignal: e.target.value })} />
            </EditorField>
            <EditorField label="Tags" hint="Comma-separated">
              <input className={inputClass} value={(item.tags ?? []).join(", ")} onChange={(e) => patchItem(i, { ...item, tags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
            </EditorField>
            <EditorField label="Track">
              <TrackToggle value={item.track ?? "both"} onChange={(v) => patchItem(i, { ...item, track: v })} />
            </EditorField>
          </EditorRow>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-sm text-muted-fg py-8">No entries in this category.</p>
        )}
      </div>

      <UploadSection moduleSlug={moduleSlug} requiredTier={requiredTier} />
    </div>
  );
}
