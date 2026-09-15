"use client";

import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DESK_CATEGORIES, type DeskQA, mergeDeskCategories, slugifyDeskCategoryId, deskCategoryMeta } from "@/data/desk-channel";
import {
  DEFAULT_DESK_CHANNEL_PAGE_COPY,
  mergeDeskChannelPageCopy,
  type DeskChannelPageCopy,
} from "@/data/desk-channel-content";
import { CONTENT_STAT_PLACEHOLDER_HINT } from "@/lib/content/content-stat-placeholders";
import { EditorField, EditorRow, EditorSection, TrackToggle, inputClass, textareaClass } from "./shared";
import { JsonImportSection } from "./json-import-section";

interface DeskChannelPayload {
  categories?: typeof DESK_CATEGORIES;
  questions: DeskQA[];
  pageCopy?: Partial<DeskChannelPageCopy>;
  lastRefreshed?: string;
}

const DESK_IMPORT_EXAMPLE = JSON.stringify(
  {
    questions: [
      {
        id: "dq-example",
        category: "trading",
        categoryLabel: "Trading",
        categoryColor: "bg-blue-100 text-blue-700",
        question: "Example question?",
        answer: "Example answer from a practitioner.",
        attribution: "practitioner",
        author: "Anonymous",
        authorRole: "Senior Trader",
        tags: ["spreads"],
        helpful: 0,
        date: "2026-03-01",
        addedAt: "2026-03-01",
        updatedAt: "2026-03-01",
        track: "both",
      },
    ],
  },
  null,
  2
);

function newQA(categoryId: string, meta: { label: string; color: string }): DeskQA {
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: `dq-${Date.now()}`,
    category: categoryId,
    categoryLabel: meta.label,
    categoryColor: meta.color,
    question: "",
    answer: "",
    attribution: "editorial",
    author: "",
    authorRole: "",
    tags: [],
    helpful: 0,
    date: today,
    addedAt: today,
    updatedAt: today,
  };
}

function readDeskChannelPayload(payload: unknown): DeskChannelPayload {
  if (Array.isArray(payload)) {
    const questions = payload as DeskQA[];
    return {
      categories: mergeDeskCategories(DESK_CATEGORIES, questions),
      questions,
      pageCopy: DEFAULT_DESK_CHANNEL_PAGE_COPY,
    };
  }
  const data = (payload ?? {}) as Partial<DeskChannelPayload>;
  const questions = data.questions ?? [];
  return {
    categories: mergeDeskCategories(data.categories ?? DESK_CATEGORIES, questions),
    questions,
    pageCopy: mergeDeskChannelPageCopy(data.pageCopy),
    lastRefreshed: data.lastRefreshed,
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
  const data = readDeskChannelPayload(payload);
  const items = data.questions;
  const categories = mergeDeskCategories(data.categories, items);
  const categoryDefs = categories.filter((c) => c.id !== "all");
  const [cat, setCat] = useState("all");

  function persist(next: Partial<DeskChannelPayload>) {
    const questions = next.questions ?? items;
    const merged = mergeDeskCategories(next.categories ?? data.categories, questions);
    onChange({
      ...data,
      ...next,
      questions,
      categories: merged,
    });
  }

  function patchQuestions(questions: DeskQA[]) {
    persist({ questions });
  }

  function patchPageCopy(pageCopy: DeskChannelPageCopy) {
    persist({ pageCopy });
  }

  function patchItem(i: number, item: DeskQA) {
    const next = [...items];
    next[i] = item;
    persist({ questions: next });
  }

  function deleteItem(i: number) {
    persist({ questions: items.filter((_, j) => j !== i) });
  }

  function addItem() {
    const first = categoryDefs[0] ?? { id: "trading", label: "Trading & Market Analysis", color: "#3280ff" };
    persist({ questions: [...items, newQA(first.id, first)] });
  }

  function addCategory() {
    const ids = categoryDefs.map((c) => c.id);
    const id = slugifyDeskCategoryId("New category", ids);
    persist({
      categories: [
        ...categoryDefs,
        { id, label: "New category", color: "#3280ff", count: 0 },
      ],
    });
  }

  function patchCategory(id: string, patch: { label?: string; color?: string }) {
    persist({
      categories: categoryDefs.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      questions: items.map((q) =>
        q.category === id
          ? {
              ...q,
              categoryLabel: patch.label ?? q.categoryLabel,
              categoryColor: patch.color ?? q.categoryColor,
            }
          : q
      ),
    });
  }

  function deleteCategory(id: string) {
    if (categoryDefs.length <= 1) return;
    const fallback = categoryDefs.find((c) => c.id !== id) ?? categoryDefs[0];
    persist({
      categories: categoryDefs.filter((c) => c.id !== id),
      questions: items.map((q) =>
        q.category === id
          ? {
              ...q,
              category: fallback.id,
              categoryLabel: fallback.label,
              categoryColor: fallback.color,
            }
          : q
      ),
    });
    if (cat === id) setCat("all");
  }

  function importJson(parsed: unknown): { ok: true } | { ok: false; error: string } {
    const imported = readDeskChannelPayload(parsed).questions;
    if (!imported.length) {
      return { ok: false, error: "JSON must include a non-empty questions array." };
    }
    patchQuestions(imported);
    return { ok: true };
  }

  const filtered = items.map((item, i) => ({ item, i })).filter(({ item }) => cat === "all" || item.category === cat);
  const pageCopy: DeskChannelPageCopy = mergeDeskChannelPageCopy(data.pageCopy);

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-fg bg-secondary/50 rounded-lg px-3 py-2">
        Edit page copy on <code className="text-[11px]">/desk-channel</code>. With <strong>Published</strong> checked,
        Save updates the live page. Hero description supports{" "}
        <code className="text-[11px]">{`{deskQaCount}`}</code>,{" "}
        <code className="text-[11px]">{`{deskSegmentCount}`}</code>, and{" "}
        <code className="text-[11px]">{`{brandName}`}</code> for live counts and brand name.
      </p>

      <EditorSection
        title="Top blue hero"
        description="Badge, headline, description, and search placeholder"
        defaultOpen
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <EditorField label="Badge (pill label)">
            <input
              className={inputClass}
              value={pageCopy.hero.badge}
              onChange={(e) =>
                patchPageCopy({
                  ...pageCopy,
                  hero: { ...pageCopy.hero, badge: e.target.value },
                })
              }
            />
          </EditorField>
          <EditorField label="Search placeholder">
            <input
              className={inputClass}
              value={pageCopy.hero.searchPlaceholder}
              onChange={(e) =>
                patchPageCopy({
                  ...pageCopy,
                  hero: { ...pageCopy.hero, searchPlaceholder: e.target.value },
                })
              }
            />
          </EditorField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <EditorField label="Headline">
            <input
              className={inputClass}
              value={pageCopy.hero.headline}
              onChange={(e) =>
                patchPageCopy({
                  ...pageCopy,
                  hero: { ...pageCopy.hero, headline: e.target.value },
                })
              }
            />
          </EditorField>
          <EditorField label="Headline accent (italic)">
            <input
              className={inputClass}
              value={pageCopy.hero.headlineAccent}
              onChange={(e) =>
                patchPageCopy({
                  ...pageCopy,
                  hero: { ...pageCopy.hero, headlineAccent: e.target.value },
                })
              }
            />
          </EditorField>
        </div>
        <EditorField
          label="Description"
          hint={`Placeholders: ${CONTENT_STAT_PLACEHOLDER_HINT}, plus {brandName}.`}
        >
          <textarea
            className={textareaClass}
            value={pageCopy.hero.description}
            onChange={(e) =>
              patchPageCopy({
                ...pageCopy,
                hero: { ...pageCopy.hero, description: e.target.value },
              })
            }
          />
        </EditorField>
      </EditorSection>

      <EditorSection
        title="Library freshness"
        description="Optional override for the member “last refreshed” line. If blank, the latest Added/Updated date on any Q&A is used (including month-year dates like May 2025)."
      >
        <EditorField label="Bank last refreshed">
          <input
            type="date"
            className={inputClass}
            value={data.lastRefreshed ?? ""}
            onChange={(e) => persist({ lastRefreshed: e.target.value || undefined })}
          />
        </EditorField>
      </EditorSection>

      <EditorSection
        title="Bottom blue section"
        description="Submit-a-question CTA block at the bottom of the page"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <EditorField label="Eyebrow">
            <input
              className={inputClass}
              value={pageCopy.submit.eyebrow}
              onChange={(e) =>
                patchPageCopy({
                  ...pageCopy,
                  submit: { ...pageCopy.submit, eyebrow: e.target.value },
                })
              }
            />
          </EditorField>
          <EditorField label="Form CTA href">
            <input
              className={inputClass}
              value={pageCopy.submit.formHref}
              onChange={(e) =>
                patchPageCopy({
                  ...pageCopy,
                  submit: { ...pageCopy.submit, formHref: e.target.value },
                })
              }
            />
          </EditorField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <EditorField label="Headline">
            <input
              className={inputClass}
              value={pageCopy.submit.headline}
              onChange={(e) =>
                patchPageCopy({
                  ...pageCopy,
                  submit: { ...pageCopy.submit, headline: e.target.value },
                })
              }
            />
          </EditorField>
          <EditorField label="Headline accent (italic)">
            <input
              className={inputClass}
              value={pageCopy.submit.headlineAccent}
              onChange={(e) =>
                patchPageCopy({
                  ...pageCopy,
                  submit: { ...pageCopy.submit, headlineAccent: e.target.value },
                })
              }
            />
          </EditorField>
        </div>
        <EditorField label="Description">
          <textarea
            className={textareaClass}
            value={pageCopy.submit.description}
            onChange={(e) =>
              patchPageCopy({
                ...pageCopy,
                submit: { ...pageCopy.submit, description: e.target.value },
              })
            }
          />
        </EditorField>
        <EditorField label="Bullet points" hint="One per line">
          <textarea
            className={textareaClass}
            rows={3}
            value={pageCopy.submit.bullets.join("\n")}
            onChange={(e) =>
              patchPageCopy({
                ...pageCopy,
                submit: {
                  ...pageCopy.submit,
                  bullets: e.target.value
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean),
                },
              })
            }
          />
        </EditorField>
        <div className="grid gap-4 sm:grid-cols-3">
          <EditorField label="Form title">
            <input
              className={inputClass}
              value={pageCopy.submit.formTitle}
              onChange={(e) =>
                patchPageCopy({
                  ...pageCopy,
                  submit: { ...pageCopy.submit, formTitle: e.target.value },
                })
              }
            />
          </EditorField>
          <EditorField label="Form subtitle">
            <input
              className={inputClass}
              value={pageCopy.submit.formSubtitle}
              onChange={(e) =>
                patchPageCopy({
                  ...pageCopy,
                  submit: { ...pageCopy.submit, formSubtitle: e.target.value },
                })
              }
            />
          </EditorField>
          <EditorField label="Form button label">
            <input
              className={inputClass}
              value={pageCopy.submit.formButton}
              onChange={(e) =>
                patchPageCopy({
                  ...pageCopy,
                  submit: { ...pageCopy.submit, formButton: e.target.value },
                })
              }
            />
          </EditorField>
        </div>
      </EditorSection>

      <EditorSection
        title="Categories"
        description="Add-on categories for the member filters. Not limited to five. Changing a label or color updates Q&As in that category."
      >
        <div className="space-y-3">
          {categoryDefs.map((c) => (
            <div key={c.id} className="grid gap-2 sm:grid-cols-[1fr_7rem_auto] items-end">
              <EditorField label="Label">
                <input
                  className={inputClass}
                  value={c.label}
                  onChange={(e) => patchCategory(c.id, { label: e.target.value })}
                />
              </EditorField>
              <EditorField label="Color">
                <input
                  type="color"
                  className="h-10 w-full rounded-md border border-border bg-white"
                  value={/^#[0-9A-Fa-f]{6}$/.test(c.color) ? c.color : "#3280ff"}
                  onChange={(e) => patchCategory(c.id, { color: e.target.value })}
                />
              </EditorField>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mb-1 text-muted-fg"
                disabled={categoryDefs.length <= 1}
                onClick={() => deleteCategory(c.id)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addCategory}>
          <Plus className="w-3.5 h-3.5" /> Add category
        </Button>
      </EditorSection>

      <EditorSection title="Q&A library" description="Practitioner questions and answers">
      <JsonImportSection
        description="Bulk-load Q&As from JSON (same shape as site defaults: { questions: [...] })."
        exampleJson={DESK_IMPORT_EXAMPLE}
        exampleFileName="desk-channel-example.json"
        onImport={importJson}
      />

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1 flex-wrap">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCat(c.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                cat === c.id ? "bg-primary-soft text-primary-400" : "bg-secondary text-muted-fg hover:bg-secondary/80"
              )}
            >
              {c.label} {c.id !== "all" && `(${c.count})`}
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
                <select
                  className={inputClass}
                  value={item.category}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    const meta = deskCategoryMeta(categories, nextId);
                    patchItem(i, {
                      ...item,
                      category: nextId,
                      categoryLabel: meta.label,
                      categoryColor: meta.color,
                    });
                  }}
                >
                  {categoryDefs.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </EditorField>
              <EditorField label="Attribution">
                <select
                  className={inputClass}
                  value={item.attribution}
                  onChange={(e) =>
                    patchItem(i, {
                      ...item,
                      attribution: e.target.value === "practitioner" ? "practitioner" : "editorial",
                    })
                  }
                >
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
            <div className="grid gap-3 sm:grid-cols-2">
              <EditorField label="Added date" hint="ISO calendar date. Counts toward “new this month”.">
                <input
                  type="date"
                  className={inputClass}
                  value={item.addedAt ?? (item.date?.match(/^\d{4}-\d{2}-\d{2}$/) ? item.date : "")}
                  onChange={(e) =>
                    patchItem(i, {
                      ...item,
                      addedAt: e.target.value || undefined,
                      date: e.target.value || item.date,
                    })
                  }
                />
              </EditorField>
              <EditorField label="Updated date">
                <input
                  type="date"
                  className={inputClass}
                  value={item.updatedAt ?? ""}
                  onChange={(e) => patchItem(i, { ...item, updatedAt: e.target.value || undefined })}
                />
              </EditorField>
            </div>
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

      <div className="rounded-xl border border-border bg-secondary/30 px-4 py-3 text-xs text-muted-fg space-y-1">
        <p className="font-semibold text-gray-800">How content reaches the site</p>
        <p>
          Edit page copy and questions here, or use <strong>Import JSON</strong> (download the template first). Click{" "}
          <strong>Save</strong> to publish. Upload File is not used for Desk Channel — it does not parse PDFs or Word
          docs into Q&amp;As.
        </p>
      </div>
      </EditorSection>
    </div>
  );
}
