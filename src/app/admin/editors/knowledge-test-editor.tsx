"use client";

import React, { useEffect, useState } from "react";
import { Plus, AlertCircle, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  normalizeKnowledgeTestPayload,
  mergeKnowledgeTestHero,
  type KnowledgeTestPayload,
  type KnowledgeTestSet,
} from "@/lib/content/knowledge-test-payload";
import { EditorField, EditorRow, EditorSection, TrackToggle, inputClass, textareaClass } from "./shared";
import { JsonImportSection } from "./json-import-section";

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

const KNOWLEDGE_IMPORT_EXAMPLE = JSON.stringify(
  {
    activeTestSetId: "march-2026",
    testSets: [
      {
        id: "march-2026",
        label: "March 2026 rolling test",
        published: true,
        questions: [
          {
            id: "k-example",
            question: "What is contango?",
            options: ["Forward > spot", "Spot > forward", "Flat curve", "No curve"],
            correctIndex: 0,
            explanation: "Contango means forward prices trade above spot.",
            topic: "Markets",
            recommendChapter: "a",
            recommendLabel: "Chapter A",
          },
        ],
      },
      {
        id: "april-2026",
        label: "April 2026 rolling test",
        published: true,
        questions: [],
      },
    ],
  },
  null,
  2
);

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

function newTestSet(index: number): KnowledgeTestSet {
  const id = `set-${Date.now()}`;
  return { id, label: `Test set ${index}`, questions: [], published: false };
}

function primaryLiveId(sets: KnowledgeTestSet[]): string {
  return sets.find((s) => s.published)?.id ?? sets[0]?.id ?? "";
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
  const normalized = normalizeKnowledgeTestPayload(payload);
  const testSets = normalized.testSets ?? [];
  const liveCount = testSets.filter((s) => s.published).length;
  const [editingSetId, setEditingSetId] = useState(testSets[0]?.id ?? "");

  useEffect(() => {
    setEditingSetId((prev) => {
      if (testSets.some((s) => s.id === prev)) return prev;
      return testSets[0]?.id ?? "";
    });
  }, [testSets]);

  const editingSet = testSets.find((s) => s.id === editingSetId) ?? testSets[0];
  const items = editingSet?.questions ?? [];

  function patchPayload(next: Partial<KnowledgeTestPayload>) {
    onChange({ ...normalized, ...next });
  }

  function commitSets(nextSets: KnowledgeTestSet[]) {
    patchPayload({ testSets: nextSets, activeTestSetId: primaryLiveId(nextSets) });
  }

  function patchQuestions(questions: KnowledgeQuestion[]) {
    if (!editingSet) return;
    commitSets(testSets.map((s) => (s.id === editingSet.id ? { ...s, questions } : s)));
  }

  function patchItem(i: number, item: KnowledgeQuestion) {
    const next = [...items];
    next[i] = item;
    patchQuestions(next);
  }

  function deleteItem(i: number) {
    patchQuestions(items.filter((_, j) => j !== i));
  }

  function addItem() {
    patchQuestions([...items, newQuestion()]);
  }

  function patchOption(i: number, oi: number, val: string) {
    const item = items[i];
    const options = [...item.options];
    options[oi] = val;
    patchItem(i, { ...item, options });
  }

  function addTestSet() {
    const set = newTestSet(testSets.length + 1);
    commitSets([...testSets, set]);
    setEditingSetId(set.id);
  }

  function renameSet(id: string, label: string) {
    commitSets(testSets.map((s) => (s.id === id ? { ...s, label } : s)));
  }

  function deleteTestSet(id: string) {
    if (testSets.length <= 1) return;
    const nextSets = testSets.filter((s) => s.id !== id);
    commitSets(nextSets);
    if (editingSetId === id) setEditingSetId(nextSets[0].id);
  }

  function setPublished(id: string, published: boolean) {
    commitSets(testSets.map((s) => (s.id === id ? { ...s, published } : s)));
  }

  function importJson(parsed: unknown): { ok: true } | { ok: false; error: string } {
    if (Array.isArray(parsed)) {
      patchQuestions(parsed as KnowledgeQuestion[]);
      return { ok: true };
    }

    if (typeof parsed !== "object" || parsed === null) {
      return { ok: false, error: "Expected a JSON object or questions array." };
    }

    const obj = parsed as Record<string, unknown>;

    if (Array.isArray(obj.testSets)) {
      const imported = normalizeKnowledgeTestPayload(parsed);
      if (!imported.testSets?.length) {
        return { ok: false, error: "testSets array is empty." };
      }
      patchPayload(imported);
      setEditingSetId(imported.activeTestSetId ?? imported.testSets[0].id);
      return { ok: true };
    }

    if (Array.isArray(obj.questions)) {
      patchQuestions(obj.questions as KnowledgeQuestion[]);
      return { ok: true };
    }

    return { ok: false, error: "Include testSets or questions in your JSON file." };
  }

  return (
    <div className="space-y-4">
      <EditorSection
        title="Page hero strip"
        description="Blue banner on /knowledge-test — kicker, title, and description. Use {questionCount} and {activeSetSuffix} (or {activeSetLabel}) for live values."
      >
        <EditorField label="Kicker / eyebrow">
          <input
            className={inputClass}
            value={mergeKnowledgeTestHero(normalized.hero).eyebrow}
            onChange={(e) => patchPayload({ hero: { ...mergeKnowledgeTestHero(normalized.hero), eyebrow: e.target.value } })}
          />
        </EditorField>
        <EditorField label="Title">
          <input
            className={inputClass}
            value={mergeKnowledgeTestHero(normalized.hero).title}
            onChange={(e) => patchPayload({ hero: { ...mergeKnowledgeTestHero(normalized.hero), title: e.target.value } })}
          />
        </EditorField>
        <EditorField label="Description">
          <textarea
            className={textareaClass}
            rows={3}
            value={mergeKnowledgeTestHero(normalized.hero).description}
            onChange={(e) => patchPayload({ hero: { ...mergeKnowledgeTestHero(normalized.hero), description: e.target.value } })}
          />
        </EditorField>
      </EditorSection>

      <JsonImportSection
        description="Import a full rolling test (testSets with published flags, optional activeTestSetId) or questions for the set you're editing."
        exampleJson={KNOWLEDGE_IMPORT_EXAMPLE}
        exampleFileName="knowledge-test-example.json"
        onImport={importJson}
      />

      <div className="rounded-xl border border-border bg-secondary/20 p-4 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm font-semibold text-gray-900">Rolling test sets</p>
            <p className="text-xs text-muted-fg">
              Publish as many banks as you like. Members can take every published set; finishing one does not block the others.
              Older CMS that only set <code className="text-[11px] bg-white px-1 rounded">activeTestSetId</code> still treats that set as live.
              {liveCount > 0 ? ` ${liveCount} live now.` : " None live yet."}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={addTestSet}>
            <Plus className="w-3.5 h-3.5" /> New test set
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {testSets.map((set) => (
            <div
              key={set.id}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs",
                editingSetId === set.id ? "border-primary-400 bg-primary-soft/40" : "border-border bg-white"
              )}
            >
              <button type="button" className="font-medium" onClick={() => setEditingSetId(set.id)}>
                {set.label} ({set.questions.length})
              </button>
              {set.published && (
                <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                  Published
                </Badge>
              )}
              <button
                type="button"
                className="inline-flex items-center gap-1 text-primary-400 hover:underline"
                onClick={() => setPublished(set.id, !set.published)}
              >
                <Star className="w-3 h-3" /> {set.published ? "Unpublish" : "Publish"}
              </button>
              {testSets.length > 1 && (
                <button type="button" className="text-red-500 hover:underline" onClick={() => deleteTestSet(set.id)}>
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
        {editingSet && (
          <EditorField label="Set label">
            <input
              className={inputClass}
              value={editingSet.label}
              onChange={(e) => renameSet(editingSet.id, e.target.value)}
            />
          </EditorField>
        )}
      </div>

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

      {activeTab === "questions" && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-fg">
              Editing <strong>{editingSet?.label ?? "set"}</strong> · {items.length} questions
              {editingSet?.published ? " · published for members" : " · draft (not on site)"}
            </p>
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
              <p className="text-center text-sm text-muted-fg py-8">No questions in this set yet.</p>
            )}
          </div>

          <div className="rounded-xl border border-border bg-secondary/30 px-4 py-3 text-xs text-muted-fg space-y-1">
            <p className="font-semibold text-gray-800">How content reaches the site</p>
            <p>
              Use <strong>Rolling test sets</strong> to keep several banks. Edit questions or <strong>Import JSON</strong>{" "}
              (template includes <code className="text-[11px] bg-white px-1 rounded">testSets</code> +{" "}
              <code className="text-[11px] bg-white px-1 rounded">activeTestSetId</code>), toggle{" "}
              <strong>Publish</strong> on each set members should see, then <strong>Save</strong>. Upload File does not load test questions.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
