"use client";

import React, { useState } from "react";
import { Plus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EditorField, EditorRow, TrackToggle, UploadSection, inputClass, textareaClass } from "./shared";

interface KnowledgeQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  topic: string;
  recommendChapter?: string;
  recommendLabel?: string;
  track?: "career" | "sales" | "both";
}

function newQuestion(): KnowledgeQuestion {
  return {
    id: `kq-${Date.now()}`,
    question: "",
    options: ["", "", "", ""],
    correctIndex: 0,
    explanation: "",
    topic: "",
  };
}

export function KnowledgeTestEditor({
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
  const [activeTab, setActiveTab] = useState<"questions" | "results">("questions");
  const items: KnowledgeQuestion[] = Array.isArray(payload) ? (payload as KnowledgeQuestion[]) : [];

  function patchItem(i: number, item: KnowledgeQuestion) {
    const next = [...items];
    next[i] = item;
    onChange(next);
  }

  function deleteItem(i: number) {
    onChange(items.filter((_, j) => j !== i));
  }

  function addItem() {
    onChange([...items, newQuestion()]);
  }

  function patchOption(i: number, oi: number, val: string) {
    const item = items[i];
    const options = [...item.options];
    options[oi] = val;
    patchItem(i, { ...item, options });
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-border pb-2">
        {(["questions", "results"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors",
              activeTab === tab ? "bg-primary-soft text-primary-400" : "text-muted-fg hover:bg-secondary/60"
            )}
          >
            {tab === "results" ? "Test Results" : "Questions"}
          </button>
        ))}
      </div>

      {activeTab === "results" && (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-fg bg-secondary/30 rounded-xl border border-dashed border-border">
          <AlertCircle className="w-8 h-8 mb-3 opacity-40" />
          <p className="font-medium text-sm">Test attempt analytics coming soon</p>
          <p className="text-xs mt-1">User attempt history will appear here once the analytics endpoint is available.</p>
        </div>
      )}

      {activeTab === "questions" && <>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-fg">{items.length} questions</p>
        <Button variant="outline" size="sm" onClick={addItem}>
          <Plus className="w-3.5 h-3.5" /> Add question
        </Button>
      </div>

      <div className="space-y-2">
        {items.map((item, i) => {
          const hasValidOptions = item.options?.length === 4 && item.options.every((o) => o.trim());
          return (
            <EditorRow
              key={item.id}
              summary={
                <span className="flex items-center gap-2">
                  <span className="font-medium line-clamp-1">{item.question || "(no question)"}</span>
                  <span className="text-xs text-muted-fg">{item.topic}</span>
                  {!hasValidOptions && <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                </span>
              }
              onDelete={() => deleteItem(i)}
            >
              <EditorField label="Question">
                <textarea className={textareaClass} value={item.question} onChange={(e) => patchItem(i, { ...item, question: e.target.value })} />
              </EditorField>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-700">Options (exactly 4)</p>
                {[0, 1, 2, 3].map((oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${i}`}
                      checked={item.correctIndex === oi}
                      onChange={() => patchItem(i, { ...item, correctIndex: oi })}
                      title="Mark as correct"
                    />
                    <input
                      className={inputClass}
                      value={item.options?.[oi] ?? ""}
                      onChange={(e) => patchOption(i, oi, e.target.value)}
                      placeholder={`Option ${oi + 1}${item.correctIndex === oi ? " (correct)" : ""}`}
                    />
                  </div>
                ))}
                <p className="text-[11px] text-muted-fg">Select the radio button next to the correct answer.</p>
              </div>

              <EditorField label="Explanation">
                <textarea className={textareaClass} value={item.explanation} onChange={(e) => patchItem(i, { ...item, explanation: e.target.value })} />
              </EditorField>
              <div className="grid gap-3 sm:grid-cols-2">
                <EditorField label="Topic">
                  <input className={inputClass} value={item.topic} onChange={(e) => patchItem(i, { ...item, topic: e.target.value })} />
                </EditorField>
                <EditorField label="Recommend chapter">
                  <input className={inputClass} value={item.recommendChapter ?? ""} onChange={(e) => patchItem(i, { ...item, recommendChapter: e.target.value })} />
                </EditorField>
                <EditorField label="Track">
                  <TrackToggle value={item.track ?? "both"} onChange={(v) => patchItem(i, { ...item, track: v })} />
                </EditorField>
              </div>
            </EditorRow>
          );
        })}
        {items.length === 0 && (
          <p className="text-center text-sm text-muted-fg py-8">No questions yet.</p>
        )}
      </div>

      <UploadSection moduleSlug={moduleSlug} requiredTier={requiredTier} />
      </>}
    </div>
  );
}
