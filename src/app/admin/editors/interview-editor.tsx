"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { INTERVIEW_CATEGORIES, INTERVIEW_TABS } from "@/data/interview-questions";
import { EditorField, EditorRow, inputClass, textareaClass } from "./shared";
import { JsonImportSection } from "./json-import-section";

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

interface InterviewPayload {
  questions: InterviewQuestion[];
  categories?: string[];
  tabs?: typeof INTERVIEW_TABS;
}

const INTERVIEW_IMPORT_EXAMPLE = JSON.stringify(
  {
    questions: [
      {
        id: "iq-example",
        tab: "technical",
        category: "Markets",
        question: "Walk me through how contango affects storage economics.",
        modelAnswer: "Contango means forward prices exceed spot, creating carry incentives when storage + financing costs are covered.",
        difficulty: "med",
      },
    ],
  },
  null,
  2
);

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

function readInterviewPayload(payload: unknown): InterviewPayload {
  if (Array.isArray(payload)) {
    return { questions: payload as InterviewQuestion[], categories: INTERVIEW_CATEGORIES, tabs: INTERVIEW_TABS };
  }
  const data = (payload ?? {}) as Partial<InterviewPayload>;
  return {
    questions: data.questions ?? [],
    categories: data.categories ?? INTERVIEW_CATEGORIES,
    tabs: data.tabs ?? INTERVIEW_TABS,
  };
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
  const data = readInterviewPayload(payload);
  const items = data.questions;
  const [activeTab, setActiveTab] = useState<InterviewTab>("technical");

  function patchQuestions(questions: InterviewQuestion[]) {
    onChange({ ...data, questions });
  }

  function patchItem(i: number, item: InterviewQuestion) {
    const next = [...items];
    next[i] = item;
    patchQuestions(next);
  }

  function deleteItem(i: number) {
    patchQuestions(items.filter((_, j) => j !== i));
  }

  function addItem() {
    patchQuestions([...items, newQuestion(activeTab)]);
  }

  function importJson(parsed: unknown): { ok: true } | { ok: false; error: string } {
    const imported = readInterviewPayload(parsed).questions;
    if (!imported.length) {
      return { ok: false, error: "JSON must include a non-empty questions array." };
    }
    patchQuestions(imported);
    return { ok: true };
  }

  const filtered = items.map((item, i) => ({ item, i })).filter(({ item }) => item.tab === activeTab);

  return (
    <div className="space-y-4">
      <JsonImportSection
        description="Bulk-load interview questions from JSON ({ questions: [...] })."
        exampleJson={INTERVIEW_IMPORT_EXAMPLE}
        exampleFileName="interview-questions-example.json"
        onImport={importJson}
      />

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

      <div className="rounded-xl border border-border bg-secondary/30 px-4 py-3 text-xs text-muted-fg space-y-1">
        <p className="font-semibold text-gray-800">How content reaches the site</p>
        <p>
          Edit questions here, or use <strong>Import JSON</strong> (download the template first). Click{" "}
          <strong>Save</strong> to publish. Upload File is not used for interview questions.
        </p>
      </div>
    </div>
  );
}
