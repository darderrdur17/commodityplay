"use client";

import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  mergeResumeVettingSection,
  type ResumeVettingSection,
} from "@/data/resume-templates";
import { EditorField, EditorRow, UploadSection, inputClass, textareaClass } from "./shared";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PersonaType {
  id: string;
  name: string;
  label: string;
  desc: string;
}

interface QuizOption {
  id: string;
  label: string;
  value: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
}

interface ResumeTemplate {
  id: string;
  personaId: string;
  title: string;
  description: string;
  fileKey: string;
}

interface ResumePayload {
  personas?: PersonaType[];
  quiz?: QuizQuestion[];
  templates?: ResumeTemplate[];
  vettingSection?: Partial<ResumeVettingSection>;
  /** @deprecated Legacy vetting config — merged into vettingSection on read */
  vetting?: Partial<ResumeVettingSection>;
}

// ─── Sub-editors ─────────────────────────────────────────────────────────────

function PersonaTypesTab({ data, onChange }: { data: ResumePayload; onChange: (d: ResumePayload) => void }) {
  const personas = data.personas ?? [];

  function patch(i: number, p: PersonaType) {
    const next = [...personas];
    next[i] = p;
    onChange({ ...data, personas: next });
  }

  function add() {
    onChange({ ...data, personas: [...personas, { id: `p-${Date.now()}`, name: "", label: "", desc: "" }] });
  }

  function del(i: number) {
    if (!confirm("Delete persona type?")) return;
    onChange({ ...data, personas: personas.filter((_, j) => j !== i) });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-fg">{personas.length} persona types</p>
        <Button variant="outline" size="sm" onClick={add}><Plus className="w-3.5 h-3.5" /> Add persona</Button>
      </div>
      {personas.map((p, i) => (
        <EditorRow key={p.id} summary={<span className="font-medium">{p.name || "(unnamed)"}</span>} onDelete={() => del(i)}>
          <div className="grid gap-3 sm:grid-cols-2">
            <EditorField label="Name"><input className={inputClass} value={p.name} onChange={(e) => patch(i, { ...p, name: e.target.value })} /></EditorField>
            <EditorField label="Label"><input className={inputClass} value={p.label} onChange={(e) => patch(i, { ...p, label: e.target.value })} /></EditorField>
          </div>
          <EditorField label="Description"><textarea className={textareaClass} value={p.desc} onChange={(e) => patch(i, { ...p, desc: e.target.value })} /></EditorField>
        </EditorRow>
      ))}
      {personas.length === 0 && <p className="text-center text-sm text-muted-fg py-8">No persona types yet.</p>}
    </div>
  );
}

function PersonaQuizTab({ data, onChange }: { data: ResumePayload; onChange: (d: ResumePayload) => void }) {
  const questions = data.quiz ?? [];

  function patchQ(i: number, q: QuizQuestion) {
    const next = [...questions];
    next[i] = q;
    onChange({ ...data, quiz: next });
  }

  function addQ() {
    onChange({ ...data, quiz: [...questions, { id: `qq-${Date.now()}`, question: "", options: [] }] });
  }

  function delQ(i: number) {
    onChange({ ...data, quiz: questions.filter((_, j) => j !== i) });
  }

  function patchOption(qi: number, oi: number, opt: QuizOption) {
    const q = { ...questions[qi], options: [...questions[qi].options] };
    q.options[oi] = opt;
    patchQ(qi, q);
  }

  function addOption(qi: number) {
    const q = questions[qi];
    patchQ(qi, { ...q, options: [...q.options, { id: `o-${Date.now()}`, label: "", value: "" }] });
  }

  function delOption(qi: number, oi: number) {
    const q = questions[qi];
    patchQ(qi, { ...q, options: q.options.filter((_, j) => j !== oi) });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-fg">{questions.length} questions</p>
        <Button variant="outline" size="sm" onClick={addQ}><Plus className="w-3.5 h-3.5" /> Add question</Button>
      </div>
      {questions.map((q, qi) => (
        <EditorRow key={q.id} summary={<span className="font-medium">{q.question || "(no question)"}</span>} onDelete={() => delQ(qi)}>
          <EditorField label="Question">
            <textarea className={textareaClass} value={q.question} onChange={(e) => patchQ(qi, { ...q, question: e.target.value })} />
          </EditorField>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-700">Options</p>
            {q.options.map((opt, oi) => (
              <div key={opt.id} className="flex items-center gap-2">
                <input className={inputClass} value={opt.label} onChange={(e) => patchOption(qi, oi, { ...opt, label: e.target.value })} placeholder="Label" />
                <input className={cn(inputClass, "w-32")} value={opt.value} onChange={(e) => patchOption(qi, oi, { ...opt, value: e.target.value })} placeholder="Value" />
                <button type="button" onClick={() => delOption(qi, oi)} className="text-red-400 hover:text-red-600 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => addOption(qi)}><Plus className="w-3.5 h-3.5" /> Add option</Button>
          </div>
        </EditorRow>
      ))}
      {questions.length === 0 && <p className="text-center text-sm text-muted-fg py-8">No quiz questions yet.</p>}
    </div>
  );
}

function ResumeTemplatesTab({
  data,
  onChange,
  moduleSlug,
  requiredTier,
}: {
  data: ResumePayload;
  onChange: (d: ResumePayload) => void;
  moduleSlug: string;
  requiredTier: string;
}) {
  const templates = data.templates ?? [];

  function patch(i: number, t: ResumeTemplate) {
    const next = [...templates];
    next[i] = t;
    onChange({ ...data, templates: next });
  }

  function add() {
    onChange({ ...data, templates: [...templates, { id: `rt-${Date.now()}`, personaId: "", title: "", description: "", fileKey: "" }] });
  }

  function del(i: number) {
    if (!confirm("Delete template?")) return;
    onChange({ ...data, templates: templates.filter((_, j) => j !== i) });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-fg">{templates.length} templates</p>
        <Button variant="outline" size="sm" onClick={add}><Plus className="w-3.5 h-3.5" /> Add template</Button>
      </div>
      {templates.map((t, i) => (
        <EditorRow key={t.id} summary={<span className="font-medium">{t.title || "(untitled)"}</span>} onDelete={() => del(i)}>
          <div className="grid gap-3 sm:grid-cols-2">
            <EditorField label="Title"><input className={inputClass} value={t.title} onChange={(e) => patch(i, { ...t, title: e.target.value })} /></EditorField>
            <EditorField label="Persona ID"><input className={inputClass} value={t.personaId} onChange={(e) => patch(i, { ...t, personaId: e.target.value })} placeholder="e.g. switcher" /></EditorField>
            <EditorField label="File key" hint="e.g. resume-templates/switcher.docx">
              <input className={inputClass} value={t.fileKey} onChange={(e) => patch(i, { ...t, fileKey: e.target.value })} />
            </EditorField>
          </div>
          <EditorField label="Description"><textarea className={textareaClass} value={t.description} onChange={(e) => patch(i, { ...t, description: e.target.value })} /></EditorField>
        </EditorRow>
      ))}
      {templates.length === 0 && <p className="text-center text-sm text-muted-fg py-8">No templates yet.</p>}
      <UploadSection moduleSlug={moduleSlug} requiredTier={requiredTier} />
    </div>
  );
}

function ResumeVettingTab({ data, onChange }: { data: ResumePayload; onChange: (d: ResumePayload) => void }) {
  const section = mergeResumeVettingSection(data.vettingSection ?? data.vetting);

  function patch(updates: Partial<ResumeVettingSection>) {
    onChange({ ...data, vettingSection: { ...section, ...updates } });
  }

  function patchLabel(field: keyof ResumeVettingSection["labels"], value: string) {
    patch({ labels: { ...section.labels, [field]: value } });
  }

  function patchBenefit(i: number, value: string) {
    const benefits = [...section.benefits];
    benefits[i] = value;
    patch({ benefits });
  }

  function addBenefit() {
    patch({ benefits: [...section.benefits, ""] });
  }

  function delBenefit(i: number) {
    patch({ benefits: section.benefits.filter((_, j) => j !== i) });
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-fg">
        Blue strip at the bottom of <strong>/resume-templates</strong> — headline, benefits, footer note, and form labels.
        Archetype dropdown options are fixed in code.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <EditorField label="Eyebrow">
          <input className={inputClass} value={section.eyebrow} onChange={(e) => patch({ eyebrow: e.target.value })} />
        </EditorField>
        <EditorField label="Form subtitle">
          <input className={inputClass} value={section.formSubtitle} onChange={(e) => patch({ formSubtitle: e.target.value })} />
        </EditorField>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <EditorField label="Headline">
          <input className={inputClass} value={section.headline} onChange={(e) => patch({ headline: e.target.value })} />
        </EditorField>
        <EditorField label="Headline accent (italic)">
          <input className={inputClass} value={section.headlineAccent} onChange={(e) => patch({ headlineAccent: e.target.value })} />
        </EditorField>
      </div>
      <EditorField label="Intro paragraph">
        <textarea className={textareaClass} rows={3} value={section.intro} onChange={(e) => patch({ intro: e.target.value })} />
      </EditorField>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-700">Benefit bullets</p>
          <Button variant="outline" size="sm" onClick={addBenefit}><Plus className="w-3.5 h-3.5" /> Add bullet</Button>
        </div>
        {section.benefits.map((item, i) => (
          <div key={i} className="flex items-start gap-2">
            <textarea className={textareaClass} value={item} onChange={(e) => patchBenefit(i, e.target.value)} />
            <button type="button" onClick={() => delBenefit(i)} className="text-red-400 hover:text-red-600 p-1 mt-2">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <EditorField label="Included box label">
          <input className={inputClass} value={section.includedLabel} onChange={(e) => patch({ includedLabel: e.target.value })} />
        </EditorField>
        <EditorField label="Form title">
          <input className={inputClass} value={section.formTitle} onChange={(e) => patch({ formTitle: e.target.value })} />
        </EditorField>
      </div>
      <EditorField label="Included box note">
        <textarea className={textareaClass} rows={3} value={section.includedNote} onChange={(e) => patch({ includedNote: e.target.value })} />
      </EditorField>

      <p className="text-xs font-semibold text-gray-700 pt-2">Form labels</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {(Object.keys(section.labels) as (keyof ResumeVettingSection["labels"])[]).map((key) => (
          <EditorField key={key} label={key}>
            <input className={inputClass} value={section.labels[key]} onChange={(e) => patchLabel(key, e.target.value)} />
          </EditorField>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <EditorField label="Success title">
          <input className={inputClass} value={section.successTitle} onChange={(e) => patch({ successTitle: e.target.value })} />
        </EditorField>
      </div>
      <EditorField label="Success message">
        <textarea className={textareaClass} rows={3} value={section.successMessage} onChange={(e) => patch({ successMessage: e.target.value })} />
      </EditorField>
    </div>
  );
}

// ─── Main editor ─────────────────────────────────────────────────────────────

const TABS = [
  { id: "personas", label: "Persona Types" },
  { id: "quiz", label: "Persona Quiz" },
  { id: "templates", label: "Resume Templates" },
  { id: "vetting", label: "Resume Vetting" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function ResumeEditor({
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
  const [activeTab, setActiveTab] = useState<TabId>("personas");
  const data = (payload as ResumePayload) ?? {};

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-border pb-2 flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              activeTab === tab.id ? "bg-primary-soft text-primary-400" : "text-muted-fg hover:bg-secondary/60"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "personas" && <PersonaTypesTab data={data} onChange={onChange} />}
      {activeTab === "quiz" && <PersonaQuizTab data={data} onChange={onChange} />}
      {activeTab === "templates" && <ResumeTemplatesTab data={data} onChange={onChange} moduleSlug={moduleSlug} requiredTier={requiredTier} />}
      {activeTab === "vetting" && <ResumeVettingTab data={data} onChange={onChange} />}
    </div>
  );
}
