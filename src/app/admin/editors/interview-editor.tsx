"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { INTERVIEW_CATEGORIES, INTERVIEW_TABS, mergeInterviewQuestionsHero } from "@/data/interview-questions";
import { toIsoDateOnly } from "@/lib/content/interview-questions-freshness";
import { EditorField, EditorRow, EditorSection, inputClass, textareaClass } from "./shared";
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
  addedAt?: string;
  updatedAt?: string;
  currentMarket?: boolean;
}

interface InterviewPayload {
  questions: InterviewQuestion[];
  categories?: string[];
  tabs?: typeof INTERVIEW_TABS;
  hero?: Partial<import("@/data/interview-questions").InterviewQuestionsHeroCopy>;
  lastRefreshed?: string;
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
        addedAt: "2026-09-08",
        updatedAt: "2026-09-08",
        currentMarket: false,
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
  const today = toIsoDateOnly(new Date());
  return {
    id: `iq-${Date.now()}`,
    tab,
    category: tab === "commercial" ? "Commercial judgement" : "",
    question: "",
    modelAnswer: "",
    difficulty: "med",
    addedAt: today,
    currentMarket: false,
  };
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
    hero: data.hero,
    lastRefreshed: data.lastRefreshed,
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
      <EditorSection
        title="Page hero strip"
        description="Blue banner on /interview-questions — kicker, title, description, and search placeholder. Use {questionCount} for the live question total."
      >
        {(() => {
          const hero = mergeInterviewQuestionsHero(data.hero);
          const patchHero = (updates: Partial<typeof hero>) =>
            onChange({ ...data, hero: { ...hero, ...updates } });
          return (
            <>
              <EditorField label="Kicker / eyebrow">
                <input className={inputClass} value={hero.eyebrow} onChange={(e) => patchHero({ eyebrow: e.target.value })} />
              </EditorField>
              <EditorField label="Title">
                <input className={inputClass} value={hero.title} onChange={(e) => patchHero({ title: e.target.value })} />
              </EditorField>
              <EditorField label="Description">
                <textarea className={textareaClass} rows={3} value={hero.description} onChange={(e) => patchHero({ description: e.target.value })} />
              </EditorField>
              <EditorField label="Search placeholder">
                <input className={inputClass} value={hero.searchPlaceholder} onChange={(e) => patchHero({ searchPlaceholder: e.target.value })} />
              </EditorField>
            </>
          );
        })()}
      </EditorSection>

      <EditorSection
        title="Bank freshness"
        description="Optional override for the member “last refreshed” line. If blank, the latest Added/Updated date on any question is used."
      >
        <EditorField label="Bank last refreshed">
          <input
            type="date"
            className={inputClass}
            value={data.lastRefreshed ?? ""}
            onChange={(e) => onChange({ ...data, lastRefreshed: e.target.value || undefined })}
          />
        </EditorField>
      </EditorSection>

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
                {item.currentMarket && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-sky-100 text-sky-800">
                    Market
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
            <div className="grid gap-3 sm:grid-cols-2">
              <EditorField label="Added date" hint="ISO calendar date. New badge if within 30 days.">
                <input
                  type="date"
                  className={inputClass}
                  value={item.addedAt ?? ""}
                  onChange={(e) => patchItem(i, { ...item, addedAt: e.target.value || undefined })}
                />
              </EditorField>
              <EditorField label="Updated / revisit date" hint="Revisit badge if updated within 30 days and not New.">
                <input
                  type="date"
                  className={inputClass}
                  value={item.updatedAt ?? ""}
                  onChange={(e) => patchItem(i, { ...item, updatedAt: e.target.value || undefined })}
                />
              </EditorField>
            </div>
            <label className="flex items-start gap-2 text-sm text-gray-800">
              <input
                type="checkbox"
                className="mt-1"
                checked={Boolean(item.currentMarket)}
                onChange={(e) => patchItem(i, { ...item, currentMarket: e.target.checked })}
              />
              <span>
                <span className="font-medium">Current market</span>
                <span className="block text-xs text-muted-fg">
                  Include in the rotating Current Market pod on the Commercial tab. Up to 3 show at a time; extra flagged items rotate each calendar month.
                </span>
              </span>
            </label>
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
        <p>
          Freshness: set <strong>Added date</strong> for New (30 days) and <strong>Updated date</strong> for Revisit.
          Tick <strong>Current market</strong> on Commercial questions to rotate them in the blue pod. Leave dates blank
          on evergreen items — they stay in the full bank with no badge.
        </p>
      </div>
    </div>
  );
}
