"use client";

import React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditorField, EditorRow, EditorSection, TrackToggle, inputClass, textareaClass } from "./shared";
import { SectionEditor } from "./case-study-section-editor";
import type {
  CaseStudyCard,
  CaseStudySection,
} from "@/data/case-studies";
import {
  caseStudyDisplayNumber,
  mergeCaseStudiesHero,
  normalizeCaseStudySection,
  type CaseStudiesHeroCopy,
} from "@/lib/content/case-studies-payload";

type StudyCard = CaseStudyCard & { track?: "career" | "sales" | "both" };

interface EditorPayload {
  studies: StudyCard[];
  details: Record<string, CaseStudySection[]>;
  hero?: Partial<CaseStudiesHeroCopy>;
}

const SOURCE_HINT =
  'Wrap citations as {{IEA}} or {{House of Commons Library}} — they render italic blue. **bold** still works.';

function readPayload(payload: unknown): EditorPayload {
  if (Array.isArray(payload)) {
    return { studies: payload as StudyCard[], details: {} };
  }
  const data = (payload ?? {}) as Partial<EditorPayload>;
  return {
    studies: Array.isArray(data.studies) ? (data.studies as StudyCard[]) : [],
    details:
      data.details && typeof data.details === "object"
        ? Object.fromEntries(
            Object.entries(data.details).map(([slug, sections]) => [
              slug,
              Array.isArray(sections) ? sections.map((section) => normalizeCaseStudySection(section)) : [],
            ])
          )
        : {},
    hero: data.hero,
  };
}

function newCase(): StudyCard {
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
    showSidebar: false,
    stats: [],
  };
}

function newSection(index: number): CaseStudySection {
  const n = String(index + 1).padStart(2, "0");
  return normalizeCaseStudySection({
    id: `section-${Date.now()}-${index}`,
    label: `${n} · Section`,
    title: "",
    paragraphs: [],
    blocks: [],
  });
}

export function CaseStudiesEditor({
  payload,
  onChange,
}: {
  payload: unknown;
  onChange: (p: unknown) => void;
}) {
  const data = readPayload(payload);
  const { studies: items, details } = data;
  const hero = mergeCaseStudiesHero(data.hero);

  function emit(next: Partial<EditorPayload>) {
    onChange({ ...data, ...next });
  }

  function patchHero(updates: Partial<CaseStudiesHeroCopy>) {
    emit({ hero: { ...hero, ...updates } });
  }

  function patchItem(i: number, item: StudyCard) {
    const next = [...items];
    const prev = next[i];
    next[i] = item;
    const nextDetails = { ...details };
    if (prev && prev.slug && item.slug && prev.slug !== item.slug && nextDetails[prev.slug]) {
      nextDetails[item.slug] = nextDetails[prev.slug]!;
      delete nextDetails[prev.slug];
    }
    emit({ studies: next, details: nextDetails });
  }

  function deleteItem(i: number) {
    if (!confirm("Delete this case study?")) return;
    const removed = items[i];
    const nextDetails = { ...details };
    if (removed?.slug) delete nextDetails[removed.slug];
    emit({ studies: items.filter((_, j) => j !== i), details: nextDetails });
  }

  function addItem() {
    emit({ studies: [...items, newCase()] });
  }

  function moveItem(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    const tmp = next[i];
    next[i] = next[j]!;
    next[j] = tmp!;
    emit({ studies: next });
  }

  function patchSections(slug: string, sections: CaseStudySection[]) {
    if (!slug) return;
    emit({ details: { ...details, [slug]: sections } });
  }

  return (
    <div className="space-y-4">
      <EditorSection
        title="Page hero strip"
        description="Blue banner on /case-studies — kicker, title, and description. Disclaimer sits below the description in smaller muted type. Use {studyCount} and {brandName} if needed."
        defaultOpen
      >
        <EditorField label="Kicker / eyebrow">
          <input className={inputClass} value={hero.eyebrow} onChange={(e) => patchHero({ eyebrow: e.target.value })} />
        </EditorField>
        <EditorField label="Title">
          <input className={inputClass} value={hero.title} onChange={(e) => patchHero({ title: e.target.value })} />
        </EditorField>
        <EditorField label="Description">
          <textarea
            className={textareaClass}
            rows={3}
            value={hero.description}
            onChange={(e) => patchHero({ description: e.target.value })}
          />
        </EditorField>
        <EditorField
          label="Disclaimer"
          hint="Shown at the bottom of the navy strip in smaller muted white. Leave blank to use the default hypothetical/illustrative copy."
        >
          <textarea
            className={textareaClass}
            rows={4}
            value={hero.disclaimer}
            onChange={(e) => patchHero({ disclaimer: e.target.value })}
          />
        </EditorField>
      </EditorSection>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-fg">
          {items.length} case studies — list order sets Case Study # on the live page (unless a case number override is set)
        </p>
        <Button variant="outline" size="sm" onClick={addItem}>
          <Plus className="w-3.5 h-3.5" /> Add case study
        </Button>
      </div>

      <div className="space-y-2">
        {items.map((item, i) => {
          const sections = item.slug ? details[item.slug] ?? [] : [];
          const stats = item.stats ?? [];
          return (
            <EditorRow
              key={item.id}
              summary={
                <span>
                  <span className="text-[10px] font-bold uppercase text-muted-fg mr-2">
                    #{caseStudyDisplayNumber(item, i)}
                  </span>
                  <span className="font-medium">{item.title || "(untitled)"}</span>
                  <span className="ml-2 text-xs text-muted-fg">{item.category}</span>
                  <span className={`ml-2 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${item.status === "published" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {item.status}
                  </span>
                </span>
              }
              onMoveUp={() => moveItem(i, -1)}
              onMoveDown={() => moveItem(i, 1)}
              canMoveUp={i > 0}
              canMoveDown={i < items.length - 1}
              onDelete={() => deleteItem(i)}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <EditorField label="Title">
                  <input className={inputClass} value={item.title} onChange={(e) => patchItem(i, { ...item, title: e.target.value })} />
                </EditorField>
                <EditorField label="Category" hint="Shown next to the CASE STUDY pill on the navy member hero.">
                  <input className={inputClass} value={item.category} onChange={(e) => patchItem(i, { ...item, category: e.target.value })} />
                </EditorField>
                <EditorField label="Slug">
                  <input className={inputClass} value={item.slug} onChange={(e) => patchItem(i, { ...item, slug: e.target.value })} />
                </EditorField>
                <EditorField
                  label="Case number"
                  hint="Override for “CASE STUDY {n}”. Leave blank to use list order (1, 2, 3…)."
                >
                  <input
                    type="number"
                    min={1}
                    className={inputClass}
                    value={item.number ?? ""}
                    onChange={(e) => {
                      const raw = e.target.value;
                      patchItem(i, {
                        ...item,
                        number: raw === "" ? undefined : Number(raw),
                      });
                    }}
                  />
                </EditorField>
                <EditorField label="Read time (minutes)">
                  <input type="number" className={inputClass} value={item.readMinutes} onChange={(e) => patchItem(i, { ...item, readMinutes: Number(e.target.value) })} />
                </EditorField>
                <EditorField label="Status">
                  <select className={inputClass} value={item.status} onChange={(e) => patchItem(i, { ...item, status: e.target.value as StudyCard["status"] })}>
                    <option value="published">Published</option>
                    <option value="coming-soon">Coming soon</option>
                  </select>
                </EditorField>
              </div>
              <EditorField label="Catch line" hint="List-card italic line. Member-hero quote uses Subtitle below.">
                <input className={inputClass} value={item.catchLine} onChange={(e) => patchItem(i, { ...item, catchLine: e.target.value })} />
              </EditorField>
              <EditorField label="Subtitle / pull-quote" hint="Italic line under the title on the navy member hero. Leave blank to hide.">
                <input className={inputClass} value={item.subtitle ?? ""} onChange={(e) => patchItem(i, { ...item, subtitle: e.target.value })} />
              </EditorField>
              <EditorField label="List description">
                <textarea className={textareaClass} value={item.description} onChange={(e) => patchItem(i, { ...item, description: e.target.value })} />
              </EditorField>
              <EditorField
                label="Hero body"
                hint={`Boxed paragraph on the navy member hero. Leave blank to hide. ${SOURCE_HINT}`}
              >
                <textarea
                  className={textareaClass}
                  rows={4}
                  value={item.heroBody ?? ""}
                  onChange={(e) => patchItem(i, { ...item, heroBody: e.target.value })}
                />
              </EditorField>
              <div className="rounded-lg border border-border p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-gray-900">Key stats (optional)</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      patchItem(i, { ...item, stats: [...stats, { value: "", label: "" }] })
                    }
                  >
                    <Plus className="w-3.5 h-3.5" /> Add stat
                  </Button>
                </div>
                <p className="text-[11px] text-muted-fg">N cards on the navy hero. Empty list hides the row.</p>
                {stats.map((stat, si) => (
                  <div key={si} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                    <input
                      className={inputClass}
                      placeholder="Value — e.g. $72 → ~$120"
                      value={stat.value}
                      onChange={(e) => {
                        const next = [...stats];
                        next[si] = { ...stat, value: e.target.value };
                        patchItem(i, { ...item, stats: next });
                      }}
                    />
                    <input
                      className={inputClass}
                      placeholder="Label"
                      value={stat.label}
                      onChange={(e) => {
                        const next = [...stats];
                        next[si] = { ...stat, label: e.target.value };
                        patchItem(i, { ...item, stats: next });
                      }}
                    />
                    <button
                      type="button"
                      className="text-xs text-muted-fg hover:text-red-600"
                      onClick={() =>
                        patchItem(i, { ...item, stats: stats.filter((_, j) => j !== si) })
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input type="checkbox" checked={item.hasFullContent} onChange={(e) => patchItem(i, { ...item, hasFullContent: e.target.checked })} />
                Has full content
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.showSidebar === true}
                  onChange={(e) => patchItem(i, { ...item, showSidebar: e.target.checked })}
                />
                Show “In this case study” sidebar — leave unchecked (default). It stays hidden unless you tick this box.
              </label>
              <EditorField label="Track">
                <TrackToggle value={item.track ?? "both"} onChange={(v) => patchItem(i, { ...item, track: v })} />
              </EditorField>

              <div className="rounded-lg border border-border p-3 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-gray-900">Article body</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!item.slug}
                    onClick={() => patchSections(item.slug, [...sections, newSection(sections.length)])}
                  >
                    <Plus className="w-3.5 h-3.5" /> Add section
                  </Button>
                </div>
                {!item.slug && (
                  <p className="text-xs text-muted-fg">Set a slug first to edit the full article.</p>
                )}
                <p className="text-[11px] text-muted-fg">
                  Each section is an ordered list of blocks (title, paragraph, numbered list, quote, table, and so on). Add a paragraph after a numbered list with Add paragraph — it appends in sequence. Empty blocks hide on the member page. {SOURCE_HINT}
                </p>
                {sections.map((section, si) => (
                  <SectionEditor
                    key={section.id}
                    index={si}
                    defaultOpen={si === sections.length - 1}
                    section={section}
                    onChange={(nextSection) => {
                      const next = [...sections];
                      next[si] = nextSection;
                      patchSections(item.slug, next);
                    }}
                    onRemove={() =>
                      patchSections(
                        item.slug,
                        sections.filter((_, j) => j !== si)
                      )
                    }
                  />
                ))}
              </div>
            </EditorRow>
          );
        })}
        {items.length === 0 && (
          <p className="text-center text-sm text-muted-fg py-8">No case studies yet.</p>
        )}
      </div>
    </div>
  );
}
