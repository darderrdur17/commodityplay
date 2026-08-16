"use client";

import React from "react";
import { EditorField, inputClass, textareaClass } from "./shared";
import type { WeeklyEdgeNote } from "@/lib/content/edge-notes";

/** @deprecated Use WeeklyEdgeNote from @/lib/content/edge-notes */
export type SalesEdgeNote = WeeklyEdgeNote;

export function WeeklyEdgeNoteEditor({
  note,
  onChange,
  trackLabel,
  defaultNote,
}: {
  note: WeeklyEdgeNote | null | undefined;
  onChange: (n: WeeklyEdgeNote) => void;
  trackLabel: string;
  defaultNote: () => WeeklyEdgeNote;
}) {
  const data = note ?? defaultNote();

  function patch(updates: Partial<WeeklyEdgeNote>) {
    onChange({ ...data, ...updates });
  }

  return (
    <div className="space-y-4">
      <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-semibold">
        {trackLabel}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <EditorField label="Eyebrow">
          <input className={inputClass} value={data.eyebrow} onChange={(e) => patch({ eyebrow: e.target.value })} />
        </EditorField>
        <EditorField label="Frequency note">
          <input className={inputClass} value={data.frequencyNote} onChange={(e) => patch({ frequencyNote: e.target.value })} />
        </EditorField>
      </div>
      <EditorField label="Title">
        <input className={inputClass} value={data.title} onChange={(e) => patch({ title: e.target.value })} />
      </EditorField>
      <EditorField label="Description">
        <textarea className={textareaClass} value={data.description} onChange={(e) => patch({ description: e.target.value })} />
      </EditorField>
      <div className="grid gap-3 sm:grid-cols-2">
        <EditorField label="CTA Label">
          <input className={inputClass} value={data.ctaLabel} onChange={(e) => patch({ ctaLabel: e.target.value })} />
        </EditorField>
        <EditorField label="CTA Link">
          <input className={inputClass} value={data.ctaLink} onChange={(e) => patch({ ctaLink: e.target.value })} placeholder="https://" />
        </EditorField>
      </div>
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
    />
  );
}
