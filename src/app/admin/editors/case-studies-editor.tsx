"use client";

import React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditorField, EditorRow, EditorSection, TrackToggle, UploadSection, inputClass, textareaClass } from "./shared";
import type { CaseStudyCard, CaseStudySection } from "@/data/case-studies";
import {
  mergeCaseStudiesHero,
  type CaseStudiesHeroCopy,
} from "@/lib/content/case-studies-payload";

type StudyCard = CaseStudyCard & { track?: "career" | "sales" | "both" };

interface EditorPayload {
  studies: StudyCard[];
  details: Record<string, CaseStudySection[]>;
  hero?: Partial<CaseStudiesHeroCopy>;
}

function readPayload(payload: unknown): EditorPayload {
  if (Array.isArray(payload)) {
    return { studies: payload as StudyCard[], details: {} };
  }
  const data = (payload ?? {}) as Partial<EditorPayload>;
  return {
    studies: Array.isArray(data.studies) ? (data.studies as StudyCard[]) : [],
    details: data.details && typeof data.details === "object" ? data.details : {},
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
  };
}

function newSection(index: number): CaseStudySection {
  const n = String(index + 1).padStart(2, "0");
  return {
    id: `section-${Date.now()}-${index}`,
    label: `${n} · Section`,
    title: "",
    paragraphs: [""],
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
        <p className="text-xs text-muted-fg">{items.length} case studies</p>
        <Button variant="outline" size="sm" onClick={addItem}>
          <Plus className="w-3.5 h-3.5" /> Add case study
        </Button>
      </div>

      <div className="space-y-2">
        {items.map((item, i) => {
          const sections = item.slug ? details[item.slug] ?? [] : [];
          return (
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
                  <select className={inputClass} value={item.status} onChange={(e) => patchItem(i, { ...item, status: e.target.value as StudyCard["status"] })}>
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
                {sections.map((section, si) => (
                  <div key={section.id} className="rounded-md border border-border/70 p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-bold uppercase text-muted-fg">Section {si + 1}</p>
                      <button
                        type="button"
                        className="text-xs text-muted-fg hover:text-red-600"
                        onClick={() =>
                          patchSections(
                            item.slug,
                            sections.filter((_, j) => j !== si)
                          )
                        }
                      >
                        Remove
                      </button>
                    </div>
                    <EditorField label="Label">
                      <input
                        className={inputClass}
                        value={section.label}
                        onChange={(e) => {
                          const next = [...sections];
                          next[si] = { ...section, label: e.target.value };
                          patchSections(item.slug, next);
                        }}
                      />
                    </EditorField>
                    <EditorField label="Title">
                      <input
                        className={inputClass}
                        value={section.title}
                        onChange={(e) => {
                          const next = [...sections];
                          next[si] = { ...section, title: e.target.value };
                          patchSections(item.slug, next);
                        }}
                      />
                    </EditorField>
                    <EditorField label="Paragraphs (blank line between paragraphs)">
                      <textarea
                        className={textareaClass}
                        rows={6}
                        value={section.paragraphs.join("\n\n")}
                        onChange={(e) => {
                          const next = [...sections];
                          next[si] = {
                            ...section,
                            paragraphs: e.target.value.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean),
                          };
                          patchSections(item.slug, next);
                        }}
                      />
                    </EditorField>
                  </div>
                ))}
              </div>
            </EditorRow>
          );
        })}
        {items.length === 0 && (
          <p className="text-center text-sm text-muted-fg py-8">No case studies yet.</p>
        )}
      </div>

      <UploadSection moduleSlug={moduleSlug} requiredTier={requiredTier} />
    </div>
  );
}
