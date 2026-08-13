"use client";

import React from "react";
import { EditorField, inputClass, textareaClass } from "./shared";

export interface SalesEdgeNote {
  eyebrow: string;
  title: string;
  description: string;
  frequencyNote: string;
  ctaLabel: string;
  ctaLink: string;
}

function defaultNote(): SalesEdgeNote {
  return {
    eyebrow: "Sales Track Only",
    title: "Weekly Sales Edge Note",
    description: "",
    frequencyNote: "Delivered every Monday",
    ctaLabel: "Subscribe",
    ctaLink: "",
  };
}

export function SalesEdgeNoteEditor({
  note,
  onChange,
}: {
  note: SalesEdgeNote | null | undefined;
  onChange: (n: SalesEdgeNote) => void;
}) {
  const data = note ?? defaultNote();

  function patch(updates: Partial<SalesEdgeNote>) {
    onChange({ ...data, ...updates });
  }

  return (
    <div className="space-y-4">
      <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-semibold">
        Sales Track Only
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
