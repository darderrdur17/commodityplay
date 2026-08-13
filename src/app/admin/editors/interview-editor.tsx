"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { EditorField, EditorRow, UploadSection, inputClass, textareaClass } from "./shared";

type InterviewTab = "technical" | "commercial" | "behavioural" | "elimination";
type Difficulty = "easy" | "med" | "hard";

interface InterviewQuestion {
  id: string;
  tab: InterviewTab;
  category: string;
  question: string;
  modelAnswer: string;
  difficulty?: Difficulty;
  framework?: string;
  interviewTip?: string;
  weakAnswer?: string;
  why?: string;
}

const TABS: { id: InterviewTab; label: string }[] = [
  { id: "technical", label: "Technical" },
  { id: "commercial", label: "Commercial" },
  { id: "behavioural", label: "Behavioural" },
  { id: "elimination", label: "Elimination" },
];

const DIFF_COLORS: Record<Difficulty, string> = {
  easy: "bg-green-100 text-green-700",
  med: "bg-amber-100 text-amber-700",
  hard: "bg-red-100 text-red-700",
};

function newQuestion(tab: InterviewTab): InterviewQuestion {
  return { id: `iq-${Date.now()}`, tab, category: "", question: "", modelAnswer: "", difficulty: "med" };
}

export function InterviewEditor({
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
  const items: InterviewQuestion[] = Array.isArray(payload) ? (payload as InterviewQuestion[]) : [];
  const [activeTab, setActiveTab] = useState<InterviewTab>("technical");

  function patchItem(i: number, item: InterviewQuestion) {
    const next = [...items];
    next[i] = item;
    onChange(next);
  }

  function deleteItem(i: number) {
    onChange(items.filter((_, j) => j !== i));
  }

  function addItem() {
    onChange([...items, newQuestion(activeTab)]);
  }

  const filtered = items.map((item, i) => ({ item, i })).filter(({ item }) => item.tab === activeTab);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                activeTab === t.id ? "bg-primary-soft text-primary-400" : "bg-secondary text-muted-fg hover:bg-secondary/80"
              )}
            >
              {t.label} ({items.filter((x) => x.tab === t.id).length})
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={addItem}>
          <Plus className="w-3.5 h-3.5" /> Add question
        </Button>
      </div>

      <div className="space-y-2">
        {filtered.map(({ item, i }) => (
          <EditorRow
            key={item.id}
            summary={
              <span className="flex items-center gap-2">
                <span className="font-medium line-clamp-1">{item.question || "(no question)"}</span>
                {item.difficulty && (
                  <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold uppercase", DIFF_COLORS[item.difficulty])}>
                    {item.difficulty}
                  </span>
                )}
              </span>
            }
            onDelete={() => deleteItem(i)}
          >
            <EditorField label="Question">
              <textarea className={textareaClass} value={item.question} onChange={(e) => patchItem(i, { ...item, question: e.target.value })} />
            </EditorField>
            <EditorField label="Model answer">
              <textarea className={textareaClass} rows={5} value={item.modelAnswer} onChange={(e) => patchItem(i, { ...item, modelAnswer: e.target.value })} />
            </EditorField>
            <div className="grid gap-3 sm:grid-cols-2">
              <EditorField label="Category">
                <input className={inputClass} value={item.category} onChange={(e) => patchItem(i, { ...item, category: e.target.value })} />
              </EditorField>
              <EditorField label="Difficulty">
                <select className={inputClass} value={item.difficulty ?? "med"} onChange={(e) => patchItem(i, { ...item, difficulty: e.target.value as Difficulty })}>
                  <option value="easy">Easy</option>
                  <option value="med">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </EditorField>
            </div>
            <EditorField label="Framework">
              <input className={inputClass} value={item.framework ?? ""} onChange={(e) => patchItem(i, { ...item, framework: e.target.value })} />
            </EditorField>
            <EditorField label="Interview tip">
              <textarea className={textareaClass} value={item.interviewTip ?? ""} onChange={(e) => patchItem(i, { ...item, interviewTip: e.target.value })} />
            </EditorField>
            <EditorField label="Weak answer example">
              <textarea className={textareaClass} value={item.weakAnswer ?? ""} onChange={(e) => patchItem(i, { ...item, weakAnswer: e.target.value })} />
            </EditorField>
            <EditorField label="Why this matters">
              <textarea className={textareaClass} value={item.why ?? ""} onChange={(e) => patchItem(i, { ...item, why: e.target.value })} />
            </EditorField>
          </EditorRow>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-sm text-muted-fg py-8">No {activeTab} questions yet.</p>
        )}
      </div>

      <UploadSection moduleSlug={moduleSlug} requiredTier={requiredTier} />
    </div>
  );
}
