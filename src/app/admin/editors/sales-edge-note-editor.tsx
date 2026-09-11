"use client";

import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { EditorField, inputClass, textareaClass } from "./shared";
import type { WeeklyEdgeNote } from "@/lib/content/edge-notes";
import type { MarketNoteTopic } from "@/data/market-notes";

/** @deprecated Use WeeklyEdgeNote from @/lib/content/edge-notes */
export type SalesEdgeNote = WeeklyEdgeNote;

function TopicRow({
  topic,
  onChange,
  onRemove,
}: {
  topic: MarketNoteTopic;
  onChange: (next: MarketNoteTopic) => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid gap-3 p-3 rounded-lg border border-border bg-secondary/30 sm:grid-cols-2">
      <EditorField label="Tag label">
        <input
          className={inputClass}
          value={topic.tag ?? ""}
          onChange={(e) => onChange({ ...topic, tag: e.target.value })}
          placeholder="e.g. Crude Oil"
        />
      </EditorField>
      <EditorField label="Topic title">
        <input
          className={inputClass}
          value={topic.title}
          onChange={(e) => onChange({ ...topic, title: e.target.value })}
        />
      </EditorField>
      <EditorField label="Tag text color" hint="Hex, e.g. #2563eb">
        <input
          className={inputClass}
          value={topic.tagColor ?? ""}
          onChange={(e) => onChange({ ...topic, tagColor: e.target.value })}
        />
      </EditorField>
      <EditorField label="Tag background" hint="Hex, e.g. #dbeafe">
        <input
          className={inputClass}
          value={topic.tagBg ?? ""}
          onChange={(e) => onChange({ ...topic, tagBg: e.target.value })}
        />
      </EditorField>
      <div className="sm:col-span-2 flex justify-end">
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700"
        >
          <Trash2 className="w-3.5 h-3.5" /> Remove topic
        </button>
      </div>
    </div>
  );
}

export function WeeklyEdgeNoteEditor({
  note,
  onChange,
  trackLabel,
  defaultNote,
  showDemoButton = false,
  showTopics = false,
}: {
  note: WeeklyEdgeNote | null | undefined;
  onChange: (n: WeeklyEdgeNote) => void;
  trackLabel: string;
  defaultNote: () => WeeklyEdgeNote;
  /** Sales market strip — show See demo button fields */
  showDemoButton?: boolean;
  /** Sales market strip — show Recent Topics card editor */
  showTopics?: boolean;
}) {
  const data = note ?? defaultNote();

  function patch(updates: Partial<WeeklyEdgeNote>) {
    onChange({ ...data, ...updates });
  }

  const topics = data.topics ?? [];

  return (
    <div className="space-y-4">
      <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-semibold">
        {trackLabel}
      </div>
      {!showDemoButton && (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <EditorField label="Badge / Eyebrow">
              <input className={inputClass} value={data.eyebrow} onChange={(e) => patch({ eyebrow: e.target.value })} />
            </EditorField>
            <EditorField label="Frequency note">
              <input
                className={inputClass}
                value={data.frequencyNote}
                onChange={(e) => patch({ frequencyNote: e.target.value })}
              />
            </EditorField>
          </div>
          <EditorField label="Headline">
            <input className={inputClass} value={data.title} onChange={(e) => patch({ title: e.target.value })} />
          </EditorField>
          <EditorField label="Body copy">
            <textarea
              className={textareaClass}
              rows={4}
              value={data.description}
              onChange={(e) => patch({ description: e.target.value })}
            />
          </EditorField>
        </>
      )}
      {showDemoButton && (
        <div className="grid gap-3 sm:grid-cols-2">
          <EditorField
            label="See demo — button label"
            hint="Opens the Contact Us popup on the public Sales landing."
          >
            <input
              className={inputClass}
              value={data.demoButtonLabel ?? "See demo"}
              onChange={(e) => patch({ demoButtonLabel: e.target.value })}
            />
          </EditorField>
        </div>
      )}
      {!showDemoButton && (
        <div className="grid gap-3 sm:grid-cols-2">
          <EditorField label="CTA Label">
            <input className={inputClass} value={data.ctaLabel} onChange={(e) => patch({ ctaLabel: e.target.value })} />
          </EditorField>
          <EditorField label="CTA Link">
            <input
              className={inputClass}
              value={data.ctaLink}
              onChange={(e) => patch({ ctaLink: e.target.value })}
              placeholder="https://"
            />
          </EditorField>
        </div>
      )}
      {showTopics && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-700">Recent Topics (right card)</p>
          {topics.map((topic, i) => (
            <TopicRow
              key={`${topic.title}-${i}`}
              topic={topic}
              onChange={(next) => {
                const nextTopics = [...topics];
                nextTopics[i] = next;
                patch({ topics: nextTopics });
              }}
              onRemove={() => patch({ topics: topics.filter((_, j) => j !== i) })}
            />
          ))}
          <button
            type="button"
            onClick={() =>
              patch({
                topics: [
                  ...topics,
                  { tag: "Topic", tagColor: "#2563eb", tagBg: "#dbeafe", title: "New topic title" },
                ],
              })
            }
            className="inline-flex items-center gap-1 text-xs font-medium text-primary-400 hover:text-primary-500"
          >
            <Plus className="w-3.5 h-3.5" /> Add topic
          </button>
        </div>
      )}
    </div>
  );
}

/** @deprecated Use WeeklyEdgeNoteEditor */
export function SalesEdgeNoteEditor({
  note,
  onChange,
}: {
  note: WeeklyEdgeNote | null | undefined;
  onChange: (n: WeeklyEdgeNote) => void;
}) {
  return (
    <WeeklyEdgeNoteEditor
      note={note}
      onChange={onChange}
      trackLabel="Sales Track Only"
      defaultNote={() => ({
        eyebrow: "Sales Track Only",
        title: "Weekly Sales Edge Note",
        description: "",
        frequencyNote: "Delivered every Tuesday",
        ctaLabel: "Subscribe",
        ctaLink: "",
      })}
      showDemoButton
      showTopics
    />
  );
}
