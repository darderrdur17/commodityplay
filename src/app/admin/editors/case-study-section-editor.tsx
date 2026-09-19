"use client";

import React from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  CaseStudyBlock,
  CaseStudyBlockKind,
  CaseStudyCallout,
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
  createEmptyCaseStudyBlock,
  normalizeCaseStudySection,
} from "@/lib/content/case-studies-payload";
import { EditorField, inputClass, textareaClass } from "./shared";

const SOURCE_HINT =
  "Wrap citations as {{IEA}} or {{House of Commons Library}} — they render italic blue. **bold** still works.";

const ADD_BLOCK_ACTIONS: { kind: CaseStudyBlockKind; label: string }[] = [
  { kind: "title", label: "Add title" },
  { kind: "paragraph", label: "Add paragraph" },
  { kind: "numberedPoints", label: "Add list" },
  { kind: "quote", label: "Add pull quote" },
  { kind: "table", label: "Add table" },
  { kind: "callout", label: "Add callout" },
  { kind: "timeline", label: "Add timeline" },
  { kind: "lessons", label: "Add lessons" },
  { kind: "selfTest", label: "Add self-test" },
  { kind: "sources", label: "Add sources" },
];

function blockLabel(kind: CaseStudyBlockKind): string {
  switch (kind) {
    case "title":
      return "Title";
    case "paragraph":
      return "Paragraph";
    case "quote":
      return "Pull quote";
    case "numberedPoints":
      return "Numbered mechanism list";
    case "table":
      return "Data table";
    case "callout":
      return "Navy callout checklist";
    case "timeline":
      return "Sourced timeline";
    case "lessons":
      return "Key lesson cards";
    case "selfTest":
      return "Self-test";
    case "sources":
      return "Sources list";
  }
}

export function SectionEditor({
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
  const normalized = normalizeCaseStudySection(section);
  const blocks = normalized.blocks ?? [];

  function emitBlocks(nextBlocks: CaseStudyBlock[]) {
    onChange(normalizeCaseStudySection({ ...normalized, blocks: nextBlocks }));
  }

  function patchBlock(i: number, block: CaseStudyBlock) {
    const next = [...blocks];
    next[i] = block;
    emitBlocks(next);
  }

  function addBlock(kind: CaseStudyBlockKind) {
    emitBlocks([...blocks, createEmptyCaseStudyBlock(kind)]);
  }

  function moveBlock(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    const tmp = next[i]!;
    next[i] = next[j]!;
    next[j] = tmp;
    emitBlocks(next);
  }

  return (
    <div className="rounded-md border border-border/70 p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase text-muted-fg">Section {index + 1}</p>
        <button type="button" className="text-xs text-muted-fg hover:text-red-600" onClick={onRemove}>
          Remove
        </button>
      </div>
      <EditorField label="Kicker / label" hint="e.g. 01 · THE SETUP — stays at the top of the section.">
        <input
          className={inputClass}
          value={normalized.label}
          onChange={(e) => onChange({ ...normalized, label: e.target.value })}
        />
      </EditorField>
      <p className="text-[11px] text-muted-fg">
        Blocks render in this order on the member page. Add paragraph after a numbered list to continue in prose.
        Empty blocks still hide. {SOURCE_HINT}
      </p>
      {blocks.map((block, bi) => (
        <div key={block.id} className="rounded-md border border-border/60 p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-gray-900">{blockLabel(block.kind)}</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="text-muted-fg hover:text-gray-900 disabled:opacity-30"
                disabled={bi === 0}
                title="Move up"
                onClick={() => moveBlock(bi, -1)}
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                className="text-muted-fg hover:text-gray-900 disabled:opacity-30"
                disabled={bi === blocks.length - 1}
                title="Move down"
                onClick={() => moveBlock(bi, 1)}
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                className="text-xs text-muted-fg hover:text-red-600"
                onClick={() => emitBlocks(blocks.filter((_, j) => j !== bi))}
              >
                Remove
              </button>
            </div>
          </div>
          <BlockFields block={block} onChange={(next) => patchBlock(bi, next)} />
        </div>
      ))}
      <div className="flex flex-wrap gap-2 pt-1">
        {ADD_BLOCK_ACTIONS.map((action) => (
          <Button key={action.kind} type="button" variant="outline" size="sm" onClick={() => addBlock(action.kind)}>
            <Plus className="w-3.5 h-3.5" /> {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

function BlockFields({
  block,
  onChange,
}: {
  block: CaseStudyBlock;
  onChange: (block: CaseStudyBlock) => void;
}) {
  switch (block.kind) {
    case "title":
      return (
        <input
          className={inputClass}
          value={block.text}
          placeholder="Section heading"
          onChange={(e) => onChange({ ...block, text: e.target.value })}
        />
      );
    case "paragraph":
      return (
        <textarea
          className={textareaClass}
          rows={5}
          value={block.text}
          placeholder="Paragraph"
          onChange={(e) => onChange({ ...block, text: e.target.value })}
        />
      );
    case "quote":
      return (
        <textarea
          className={textareaClass}
          rows={2}
          value={block.text}
          placeholder="Light-blue boxed italic quote"
          onChange={(e) => onChange({ ...block, text: e.target.value })}
        />
      );
    case "numberedPoints":
      return <NumberedPointsFields points={block.points} onChange={(points) => onChange({ ...block, points })} />;
    case "table":
      return (
        <TableEditor
          table={block.table}
          onChange={(table) => onChange({ ...block, table })}
          onClear={() => onChange({ ...block, table: { headers: [""], rows: [[""]] } })}
        />
      );
    case "callout":
      return <CalloutFields callout={block.callout} onChange={(callout) => onChange({ ...block, callout })} />;
    case "timeline":
      return <TimelineFields timeline={block.timeline} onChange={(timeline) => onChange({ ...block, timeline })} />;
    case "lessons":
      return <LessonsFields lessons={block.lessons} onChange={(lessons) => onChange({ ...block, lessons })} />;
    case "selfTest":
      return <SelfTestFields selfTest={block.selfTest} onChange={(selfTest) => onChange({ ...block, selfTest })} />;
    case "sources":
      return (
        <SourcesFields
          sources={block.sources}
          note={block.note ?? ""}
          onChange={(sources, note) => onChange({ ...block, sources, note: note || undefined })}
        />
      );
  }
}

function NumberedPointsFields({
  points,
  onChange,
}: {
  points: CaseStudyNumberedPoint[];
  onChange: (points: CaseStudyNumberedPoint[]) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] text-muted-fg">Blue number + bold lead-in + body. Empty = hide.</p>
      {points.map((point, pi) => (
        <div key={pi} className="grid gap-2 sm:grid-cols-[minmax(0,0.4fr)_minmax(0,1fr)_auto]">
          <input
            className={inputClass}
            placeholder="Lead — e.g. The crude price"
            value={point.lead}
            onChange={(e) => {
              const next = [...points];
              next[pi] = { ...point, lead: e.target.value };
              onChange(next);
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
              onChange(next);
            }}
          />
          <button
            type="button"
            className="text-xs text-muted-fg hover:text-red-600"
            onClick={() => onChange(points.filter((_, j) => j !== pi))}
          >
            Remove
          </button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...points, { lead: "", body: "" }])}
      >
        <Plus className="w-3.5 h-3.5" /> Add point
      </Button>
    </div>
  );
}

function CalloutFields({
  callout,
  onChange,
}: {
  callout: CaseStudyCallout;
  onChange: (callout: CaseStudyCallout) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] text-muted-fg">Reading-order box. Empty = hide.</p>
      <input
        className={inputClass}
        placeholder="Kicker — e.g. READING ORDER FOR A CHOKEPOINT SHOCK"
        value={callout.kicker}
        onChange={(e) => onChange({ ...callout, kicker: e.target.value })}
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
              onChange({ ...callout, items });
            }}
          />
          <button
            type="button"
            className="text-xs text-muted-fg hover:text-red-600 shrink-0"
            onClick={() => onChange({ ...callout, items: callout.items.filter((_, j) => j !== ii) })}
          >
            Remove
          </button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange({ ...callout, items: [...callout.items, ""] })}
      >
        <Plus className="w-3.5 h-3.5" /> Add bullet
      </Button>
    </div>
  );
}

function TimelineFields({
  timeline,
  onChange,
}: {
  timeline: CaseStudyTimeline;
  onChange: (timeline: CaseStudyTimeline) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] text-muted-fg">Colored dots: negative (red), positive (green), neutral (blue). Empty = hide.</p>
      <input
        className={inputClass}
        placeholder="Kicker — e.g. SOURCED TIMELINE — …"
        value={timeline.kicker}
        onChange={(e) => onChange({ ...timeline, kicker: e.target.value })}
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
              onChange({ ...timeline, events });
            }}
          />
          <select
            className={inputClass}
            value={event.tone ?? "neutral"}
            onChange={(e) => {
              const events = [...timeline.events];
              events[ei] = { ...event, tone: e.target.value as CaseStudyTimelineTone };
              onChange({ ...timeline, events });
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
              onChange({ ...timeline, events });
            }}
          />
          <button
            type="button"
            className="text-xs text-muted-fg hover:text-red-600"
            onClick={() => onChange({ ...timeline, events: timeline.events.filter((_, j) => j !== ei) })}
          >
            Remove
          </button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          onChange({
            ...timeline,
            events: [...timeline.events, { date: "", body: "", tone: "neutral" }],
          })
        }
      >
        <Plus className="w-3.5 h-3.5" /> Add event
      </Button>
    </div>
  );
}

function LessonsFields({
  lessons,
  onChange,
}: {
  lessons: CaseStudyLesson[];
  onChange: (lessons: CaseStudyLesson[]) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] text-muted-fg">2-column grid on desktop. N cards. Empty = hide.</p>
      {lessons.map((lesson, li) => (
        <div key={li} className="grid gap-2 sm:grid-cols-[minmax(0,0.4fr)_minmax(0,1fr)_auto]">
          <input
            className={inputClass}
            placeholder="Title"
            value={lesson.title}
            onChange={(e) => {
              const next = [...lessons];
              next[li] = { ...lesson, title: e.target.value };
              onChange(next);
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
              onChange(next);
            }}
          />
          <button
            type="button"
            className="text-xs text-muted-fg hover:text-red-600"
            onClick={() => onChange(lessons.filter((_, j) => j !== li))}
          >
            Remove
          </button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...lessons, { title: "", body: "" }])}>
        <Plus className="w-3.5 h-3.5" /> Add lesson
      </Button>
    </div>
  );
}

function SelfTestFields({
  selfTest,
  onChange,
}: {
  selfTest: CaseStudySelfTest;
  onChange: (selfTest: CaseStudySelfTest) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] text-muted-fg">Reveal/hide answers on the member page. Empty = hide.</p>
      <input
        className={inputClass}
        placeholder="Kicker — e.g. FOUR QUESTIONS — ANSWER BEFORE REVEALING"
        value={selfTest.kicker}
        onChange={(e) => onChange({ ...selfTest, kicker: e.target.value })}
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
              onChange({ ...selfTest, questions });
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
              onChange({ ...selfTest, questions });
            }}
          />
          <button
            type="button"
            className="text-xs text-muted-fg hover:text-red-600"
            onClick={() =>
              onChange({
                ...selfTest,
                questions: selfTest.questions.filter((_, j) => j !== qi),
              })
            }
          >
            Remove question
          </button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          onChange({
            ...selfTest,
            questions: [...selfTest.questions, { question: "", answer: "" }],
          })
        }
      >
        <Plus className="w-3.5 h-3.5" /> Add question
      </Button>
    </div>
  );
}

function SourcesFields({
  sources,
  note,
  onChange,
}: {
  sources: CaseStudySource[];
  note: string;
  onChange: (sources: CaseStudySource[], note: string) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] text-muted-fg">Bold name — citation. Empty = hide.</p>
      {sources.map((source, soi) => (
        <div key={soi} className="grid gap-2 sm:grid-cols-[minmax(0,0.35fr)_minmax(0,1fr)_auto]">
          <input
            className={inputClass}
            placeholder="Name — e.g. IEA"
            value={source.name}
            onChange={(e) => {
              const next = [...sources];
              next[soi] = { ...source, name: e.target.value };
              onChange(next, note);
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
              onChange(next, note);
            }}
          />
          <button
            type="button"
            className="text-xs text-muted-fg hover:text-red-600"
            onClick={() => onChange(sources.filter((_, j) => j !== soi), note)}
          >
            Remove
          </button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...sources, { name: "", detail: "" }], note)}
      >
        <Plus className="w-3.5 h-3.5" /> Add source
      </Button>
      <EditorField label="Sources footnote" hint="Optional paragraph under the sources box.">
        <textarea
          className={textareaClass}
          rows={2}
          value={note}
          onChange={(e) => onChange(sources, e.target.value)}
        />
      </EditorField>
    </div>
  );
}

const smallButtonClass =
  "inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-border hover:bg-secondary/60 transition-colors";

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
  const gridTemplateColumns = `repeat(${colCount}, minmax(8rem, 1fr)) 2.25rem`;

  function paddedHeaders() {
    return Array.from({ length: colCount }, (_, i) => table.headers[i] ?? "");
  }

  function paddedRow(row: string[] | undefined) {
    return Array.from({ length: colCount }, (_, i) => row?.[i] ?? "");
  }

  function setHeader(ci: number, value: string) {
    const headers = paddedHeaders();
    headers[ci] = value;
    onChange({ ...table, headers });
  }

  function setCell(ri: number, ci: number, value: string) {
    const rows = table.rows.map((row) => paddedRow(row));
    const row = rows[ri] ?? paddedRow([]);
    row[ci] = value;
    rows[ri] = row;
    onChange({ ...table, rows });
  }

  function addColumn() {
    onChange({
      headers: [...paddedHeaders(), ""],
      rows: table.rows.map((row) => [...paddedRow(row), ""]),
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
      rows: [...table.rows, paddedRow([])],
    });
  }

  function removeItem(itemIndex: number) {
    onChange({ ...table, rows: table.rows.filter((_, j) => j !== itemIndex) });
  }

  return (
    <div className="space-y-4">
      <p className="text-[11px] text-muted-fg">
        Optional — skip if this section is text only. Same controls as Career Feature Comparison (landing Pricing →
        pricing comparison): a visual grid of cells. Type in each cell. Use Add row / Add column at the bottom of the
        grid — the same pattern as Add feature row.
      </p>
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[36rem]">
            <div className="grid gap-0 bg-secondary/40" style={{ gridTemplateColumns }}>
              {Array.from({ length: colCount }, (_, ci) => (
                <div key={ci} className="p-2.5 border-l border-border first:border-l-0 min-w-[8rem]">
                  <input
                    type="text"
                    className={`${inputClass} min-w-[160px]`}
                    value={table.headers[ci] ?? ""}
                    placeholder={`Column ${ci + 1}`}
                    onChange={(e) => setHeader(ci, e.target.value)}
                  />
                  <button
                    type="button"
                    className="mt-1 text-red-400 hover:text-red-600 p-1.5 shrink-0 disabled:opacity-40"
                    disabled={colCount <= 1}
                    title="Delete column"
                    onClick={() => removeColumn(ci)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="p-2.5 border-l border-border" />
            </div>
            <div className="divide-y divide-border">
              {table.rows.map((row, ri) => (
                <div key={ri} className="grid gap-0" style={{ gridTemplateColumns }}>
                  {Array.from({ length: colCount }, (_, ci) => (
                    <div key={ci} className="p-2.5 border-l border-border first:border-l-0">
                      <input
                        type="text"
                        className={`${inputClass} min-w-[180px]`}
                        value={row[ci] ?? ""}
                        placeholder="Cell"
                        onChange={(e) => setCell(ri, ci, e.target.value)}
                      />
                    </div>
                  ))}
                  <div className="p-2.5 border-l border-border">
                    <button
                      type="button"
                      className="text-red-400 hover:text-red-600 p-1 shrink-0"
                      title="Delete row"
                      onClick={() => removeItem(ri)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="p-2.5 bg-secondary/20 flex flex-wrap items-center gap-2">
          <button type="button" onClick={addColumn} className={smallButtonClass}>
            <Plus className="w-3.5 h-3.5" /> Add column
          </button>
          <button type="button" onClick={addRow} className={smallButtonClass}>
            <Plus className="w-3.5 h-3.5" /> Add row
          </button>
          <button type="button" className="text-xs text-muted-fg hover:text-red-600 ml-auto" onClick={onClear}>
            Clear table
          </button>
        </div>
      </div>
    </div>
  );
}
