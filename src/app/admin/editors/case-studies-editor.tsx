"use client";

import React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditorField, EditorRow, EditorSection, TrackToggle, UploadSection, inputClass, textareaClass } from "./shared";
import type {
  CaseStudyCallout,
  CaseStudyCard,
  CaseStudyLesson,
  CaseStudyNumberedPoint,
  CaseStudySection,
  CaseStudySelfTest,
  CaseStudySource,
  CaseStudyTable,
  CaseStudyTimeline,
  CaseStudyTimelineTone,
} from "@/data/case-studies";
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

const SOURCE_HINT =
  'Wrap citations as {{IEA}} or {{House of Commons Library}} — they render italic blue. **bold** still works.';

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
    showSidebar: false,
    stats: [],
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

function emptyTable(): CaseStudyTable {
  return {
    headers: ["MARKET", "BEFORE", "DURING", "SOURCE"],
    rows: [["", "", "", ""]],
  };
}

function emptyTimeline(): CaseStudyTimeline {
  return { kicker: "", events: [{ date: "", body: "", tone: "neutral" }] };
}

function emptySelfTest(): CaseStudySelfTest {
  return { kicker: "", questions: [{ question: "", answer: "" }] };
}

function emptyCallout(): CaseStudyCallout {
  return { kicker: "", items: [""] };
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
          const stats = item.stats ?? [];
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
                  Each section can mix paragraphs, quote, numbered list, table, navy callout, timeline, lesson cards, self-test, and sources. Leave a block empty to hide it. {SOURCE_HINT}
                </p>
                {sections.map((section, si) => (
                  <SectionEditor
                    key={section.id}
                    index={si}
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

      <UploadSection moduleSlug={moduleSlug} requiredTier={requiredTier} />
    </div>
  );
}

function SectionEditor({
  index,
  section,
  onChange,
  onRemove,
}: {
  index: number;
  section: CaseStudySection;
  onChange: (section: CaseStudySection) => void;
  onRemove: () => void;
}) {
  const points = section.numberedPoints ?? [];
  const table = section.table;
  const callout = section.callout;
  const timeline = section.timeline;
  const lessons = section.lessons ?? [];
  const selfTest = section.selfTest;
  const sources = section.sources ?? [];

  return (
    <div className="rounded-md border border-border/70 p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase text-muted-fg">Section {index + 1}</p>
        <button type="button" className="text-xs text-muted-fg hover:text-red-600" onClick={onRemove}>
          Remove
        </button>
      </div>
      <EditorField label="Kicker / label" hint="e.g. 01 · THE SETUP">
        <input className={inputClass} value={section.label} onChange={(e) => onChange({ ...section, label: e.target.value })} />
      </EditorField>
      <EditorField label="Title">
        <input className={inputClass} value={section.title} onChange={(e) => onChange({ ...section, title: e.target.value })} />
      </EditorField>
      <EditorField label="Paragraphs (blank line between paragraphs)" hint={SOURCE_HINT}>
        <textarea
          className={textareaClass}
          rows={6}
          value={section.paragraphs.join("\n\n")}
          onChange={(e) =>
            onChange({
              ...section,
              paragraphs: e.target.value.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean),
            })
          }
        />
      </EditorField>
      <EditorField label="Pull quote" hint="Light-blue boxed italic quote. Leave blank to hide.">
        <textarea
          className={textareaClass}
          rows={2}
          value={section.quote ?? ""}
          onChange={(e) => onChange({ ...section, quote: e.target.value })}
        />
      </EditorField>

      <BlockHeader
        title="Numbered mechanism list"
        hint="Blue number + bold lead-in + body. Empty = hide."
        onAdd={() =>
          onChange({
            ...section,
            numberedPoints: [...points, { lead: "", body: "" } satisfies CaseStudyNumberedPoint],
          })
        }
        addLabel="Add point"
      />
      {points.map((point, pi) => (
        <div key={pi} className="grid gap-2 sm:grid-cols-[minmax(0,0.4fr)_minmax(0,1fr)_auto]">
          <input
            className={inputClass}
            placeholder="Lead — e.g. The crude price"
            value={point.lead}
            onChange={(e) => {
              const next = [...points];
              next[pi] = { ...point, lead: e.target.value };
              onChange({ ...section, numberedPoints: next });
            }}
          />
          <textarea
            className={textareaClass}
            rows={2}
            placeholder="Body"
            value={point.body}
            onChange={(e) => {
              const next = [...points];
              next[pi] = { ...point, body: e.target.value };
              onChange({ ...section, numberedPoints: next });
            }}
          />
          <button
            type="button"
            className="text-xs text-muted-fg hover:text-red-600"
            onClick={() => onChange({ ...section, numberedPoints: points.filter((_, j) => j !== pi) })}
          >
            Remove
          </button>
        </div>
      ))}

      <BlockHeader
        title="Data table"
        hint="Spreadsheet, not JSON. Header row = column titles. Each following row is a market or event. Add or remove as many columns and rows as you need."
        onAdd={() =>
          onChange({
            ...section,
            table: table
              ? {
                  ...table,
                  rows: [
                    ...table.rows,
                    Array.from({ length: Math.max(table.headers.length, 1) }, () => ""),
                  ],
                }
              : emptyTable(),
          })
        }
        addLabel={table ? "Add row" : "Add table"}
      />
      {table ? (
        <TableEditor
          table={table}
          onChange={(next) => onChange({ ...section, table: next })}
          onClear={() => onChange({ ...section, table: undefined })}
        />
      ) : null}

      <BlockHeader
        title="Navy callout checklist"
        hint="Reading-order box. Empty = hide."
        onAdd={() => onChange({ ...section, callout: callout ?? emptyCallout() })}
        addLabel={callout ? "Add bullet" : "Add callout"}
        onAddExtra={
          callout
            ? () => onChange({ ...section, callout: { ...callout, items: [...callout.items, ""] } })
            : undefined
        }
      />
      {callout ? (
        <div className="space-y-2">
          <input
            className={inputClass}
            placeholder="Kicker — e.g. READING ORDER FOR A CHOKEPOINT SHOCK"
            value={callout.kicker}
            onChange={(e) => onChange({ ...section, callout: { ...callout, kicker: e.target.value } })}
          />
          {callout.items.map((item, ii) => (
            <div key={ii} className="flex gap-2">
              <textarea
                className={textareaClass}
                rows={2}
                value={item}
                onChange={(e) => {
                  const items = [...callout.items];
                  items[ii] = e.target.value;
                  onChange({ ...section, callout: { ...callout, items } });
                }}
              />
              <button
                type="button"
                className="text-xs text-muted-fg hover:text-red-600 shrink-0"
                onClick={() =>
                  onChange({
                    ...section,
                    callout: { ...callout, items: callout.items.filter((_, j) => j !== ii) },
                  })
                }
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            className="text-xs text-muted-fg hover:text-red-600"
            onClick={() => onChange({ ...section, callout: undefined })}
          >
            Remove callout
          </button>
        </div>
      ) : null}

      <BlockHeader
        title="Sourced timeline"
        hint="Colored dots: negative (red), positive (green), neutral (blue). Empty = hide."
        onAdd={() =>
          onChange({
            ...section,
            timeline: timeline
              ? {
                  ...timeline,
                  events: [...timeline.events, { date: "", body: "", tone: "neutral" }],
                }
              : emptyTimeline(),
          })
        }
        addLabel={timeline ? "Add event" : "Add timeline"}
      />
      {timeline ? (
        <div className="space-y-2">
          <input
            className={inputClass}
            placeholder="Kicker — e.g. SOURCED TIMELINE — …"
            value={timeline.kicker}
            onChange={(e) => onChange({ ...section, timeline: { ...timeline, kicker: e.target.value } })}
          />
          {timeline.events.map((event, ei) => (
            <div key={ei} className="grid gap-2 sm:grid-cols-[8rem_7rem_minmax(0,1fr)_auto]">
              <input
                className={inputClass}
                placeholder="Date"
                value={event.date}
                onChange={(e) => {
                  const events = [...timeline.events];
                  events[ei] = { ...event, date: e.target.value };
                  onChange({ ...section, timeline: { ...timeline, events } });
                }}
              />
              <select
                className={inputClass}
                value={event.tone ?? "neutral"}
                onChange={(e) => {
                  const events = [...timeline.events];
                  events[ei] = { ...event, tone: e.target.value as CaseStudyTimelineTone };
                  onChange({ ...section, timeline: { ...timeline, events } });
                }}
              >
                <option value="negative">Negative (red)</option>
                <option value="positive">Positive (green)</option>
                <option value="neutral">Neutral (blue)</option>
              </select>
              <textarea
                className={textareaClass}
                rows={2}
                placeholder="Body"
                value={event.body}
                onChange={(e) => {
                  const events = [...timeline.events];
                  events[ei] = { ...event, body: e.target.value };
                  onChange({ ...section, timeline: { ...timeline, events } });
                }}
              />
              <button
                type="button"
                className="text-xs text-muted-fg hover:text-red-600"
                onClick={() =>
                  onChange({
                    ...section,
                    timeline: { ...timeline, events: timeline.events.filter((_, j) => j !== ei) },
                  })
                }
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            className="text-xs text-muted-fg hover:text-red-600"
            onClick={() => onChange({ ...section, timeline: undefined })}
          >
            Remove timeline
          </button>
        </div>
      ) : null}

      <BlockHeader
        title="Key lesson cards"
        hint="2-column grid on desktop. N cards. Empty = hide."
        onAdd={() =>
          onChange({
            ...section,
            lessons: [...lessons, { title: "", body: "" } satisfies CaseStudyLesson],
          })
        }
        addLabel="Add lesson"
      />
      {lessons.map((lesson, li) => (
        <div key={li} className="grid gap-2 sm:grid-cols-[minmax(0,0.4fr)_minmax(0,1fr)_auto]">
          <input
            className={inputClass}
            placeholder="Title"
            value={lesson.title}
            onChange={(e) => {
              const next = [...lessons];
              next[li] = { ...lesson, title: e.target.value };
              onChange({ ...section, lessons: next });
            }}
          />
          <textarea
            className={textareaClass}
            rows={2}
            placeholder="Body"
            value={lesson.body}
            onChange={(e) => {
              const next = [...lessons];
              next[li] = { ...lesson, body: e.target.value };
              onChange({ ...section, lessons: next });
            }}
          />
          <button
            type="button"
            className="text-xs text-muted-fg hover:text-red-600"
            onClick={() => onChange({ ...section, lessons: lessons.filter((_, j) => j !== li) })}
          >
            Remove
          </button>
        </div>
      ))}

      <BlockHeader
        title="Self-test"
        hint="Reveal/hide answers on the member page. Empty = hide."
        onAdd={() =>
          onChange({
            ...section,
            selfTest: selfTest
              ? {
                  ...selfTest,
                  questions: [...selfTest.questions, { question: "", answer: "" }],
                }
              : emptySelfTest(),
          })
        }
        addLabel={selfTest ? "Add question" : "Add self-test"}
      />
      {selfTest ? (
        <div className="space-y-2">
          <input
            className={inputClass}
            placeholder="Kicker — e.g. FOUR QUESTIONS — ANSWER BEFORE REVEALING"
            value={selfTest.kicker}
            onChange={(e) => onChange({ ...section, selfTest: { ...selfTest, kicker: e.target.value } })}
          />
          {selfTest.questions.map((q, qi) => (
            <div key={qi} className="space-y-1 rounded-md border border-border/60 p-2">
              <textarea
                className={textareaClass}
                rows={2}
                placeholder={`Q${qi + 1}`}
                value={q.question}
                onChange={(e) => {
                  const questions = [...selfTest.questions];
                  questions[qi] = { ...q, question: e.target.value };
                  onChange({ ...section, selfTest: { ...selfTest, questions } });
                }}
              />
              <textarea
                className={textareaClass}
                rows={2}
                placeholder={`Q${qi + 1} answer`}
                value={q.answer}
                onChange={(e) => {
                  const questions = [...selfTest.questions];
                  questions[qi] = { ...q, answer: e.target.value };
                  onChange({ ...section, selfTest: { ...selfTest, questions } });
                }}
              />
              <button
                type="button"
                className="text-xs text-muted-fg hover:text-red-600"
                onClick={() =>
                  onChange({
                    ...section,
                    selfTest: {
                      ...selfTest,
                      questions: selfTest.questions.filter((_, j) => j !== qi),
                    },
                  })
                }
              >
                Remove question
              </button>
            </div>
          ))}
          <button
            type="button"
            className="text-xs text-muted-fg hover:text-red-600"
            onClick={() => onChange({ ...section, selfTest: undefined })}
          >
            Remove self-test
          </button>
        </div>
      ) : null}

      <BlockHeader
        title="Sources list"
        hint="Bold name — citation. Empty = hide."
        onAdd={() =>
          onChange({
            ...section,
            sources: [...sources, { name: "", detail: "" } satisfies CaseStudySource],
          })
        }
        addLabel="Add source"
      />
      {sources.map((source, soi) => (
        <div key={soi} className="grid gap-2 sm:grid-cols-[minmax(0,0.35fr)_minmax(0,1fr)_auto]">
          <input
            className={inputClass}
            placeholder="Name — e.g. IEA"
            value={source.name}
            onChange={(e) => {
              const next = [...sources];
              next[soi] = { ...source, name: e.target.value };
              onChange({ ...section, sources: next });
            }}
          />
          <textarea
            className={textareaClass}
            rows={2}
            placeholder="Citation / detail"
            value={source.detail}
            onChange={(e) => {
              const next = [...sources];
              next[soi] = { ...source, detail: e.target.value };
              onChange({ ...section, sources: next });
            }}
          />
          <button
            type="button"
            className="text-xs text-muted-fg hover:text-red-600"
            onClick={() => onChange({ ...section, sources: sources.filter((_, j) => j !== soi) })}
          >
            Remove
          </button>
        </div>
      ))}
      <EditorField label="Sources footnote" hint="Optional paragraph under the sources box.">
        <textarea
          className={textareaClass}
          rows={2}
          value={section.sourcesNote ?? ""}
          onChange={(e) => onChange({ ...section, sourcesNote: e.target.value })}
        />
      </EditorField>
    </div>
  );
}

function BlockHeader({
  title,
  hint,
  onAdd,
  addLabel,
  onAddExtra,
}: {
  title: string;
  hint: string;
  onAdd: () => void;
  addLabel: string;
  onAddExtra?: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-2 pt-2">
      <div>
        <p className="text-xs font-semibold text-gray-900">{title}</p>
        <p className="text-[11px] text-muted-fg">{hint}</p>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onAddExtra ?? onAdd}>
        <Plus className="w-3.5 h-3.5" /> {addLabel}
      </Button>
    </div>
  );
}

function TableEditor({
  table,
  onChange,
  onClear,
}: {
  table: CaseStudyTable;
  onChange: (table: CaseStudyTable) => void;
  onClear: () => void;
}) {
  const colCount = Math.max(table.headers.length, 1);
  const gridCols = `7rem repeat(${colCount}, minmax(7rem, 1fr)) auto`;

  function setHeader(ci: number, value: string) {
    const headers = Array.from({ length: colCount }, (_, i) => table.headers[i] ?? "");
    headers[ci] = value;
    onChange({ ...table, headers });
  }

  function setCell(ri: number, ci: number, value: string) {
    const rows = table.rows.map((row) => Array.from({ length: colCount }, (_, i) => row[i] ?? ""));
    const row = rows[ri] ?? Array.from({ length: colCount }, () => "");
    row[ci] = value;
    rows[ri] = row;
    onChange({ ...table, rows });
  }

  function addColumn() {
    onChange({
      headers: [...Array.from({ length: colCount }, (_, i) => table.headers[i] ?? ""), ""],
      rows: table.rows.map((row) => [...Array.from({ length: colCount }, (_, i) => row[i] ?? ""), ""]),
    });
  }

  function removeColumn(ci: number) {
    if (colCount <= 1) return;
    onChange({
      headers: table.headers.filter((_, i) => i !== ci),
      rows: table.rows.map((row) => row.filter((_, i) => i !== ci)),
    });
  }

  function addRow() {
    onChange({
      ...table,
      rows: [...table.rows, Array.from({ length: colCount }, () => "")],
    });
  }

  return (
    <div className="space-y-2 overflow-x-auto">
      <p className="text-[11px] text-muted-fg">
        First row of headers = column titles (for example MARKET / BEFORE / DURING / SOURCE). Each following row is a market or event. Type in the boxes — you do not edit JSON.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={addColumn}>
          Add column
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          Add row
        </Button>
        <button type="button" className="text-xs text-muted-fg hover:text-red-600" onClick={onClear}>
          Remove table
        </button>
      </div>
      <div className="min-w-[36rem] space-y-1">
        <div className="grid gap-1 items-end" style={{ gridTemplateColumns: gridCols }}>
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-fg pb-2">Titles</p>
          {Array.from({ length: colCount }, (_, ci) => (
            <div key={ci} className="space-y-1">
              <input
                className={inputClass}
                value={table.headers[ci] ?? ""}
                placeholder={`Column ${ci + 1}`}
                onChange={(e) => setHeader(ci, e.target.value)}
              />
              <button
                type="button"
                className="text-[10px] text-muted-fg hover:text-red-600 disabled:opacity-40"
                disabled={colCount <= 1}
                onClick={() => removeColumn(ci)}
              >
                Remove column
              </button>
            </div>
          ))}
          <span />
        </div>
        {table.rows.map((row, ri) => (
          <div
            key={ri}
            className="grid gap-1 items-center"
            style={{ gridTemplateColumns: gridCols }}
          >
            <p className="text-[10px] font-semibold text-muted-fg">Row {ri + 1}</p>
            {Array.from({ length: colCount }, (_, ci) => (
              <input
                key={ci}
                className={inputClass}
                value={row[ci] ?? ""}
                placeholder="Cell"
                onChange={(e) => setCell(ri, ci, e.target.value)}
              />
            ))}
            <button
              type="button"
              className="text-xs text-muted-fg hover:text-red-600"
              onClick={() => onChange({ ...table, rows: table.rows.filter((_, j) => j !== ri) })}
            >
              Remove row
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
