"use client";

import React, { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  mergeResumeVettingSection,
  type ResumeVettingSection,
} from "@/data/resume-templates";
import {
  DEFAULT_RESUME_INDUSTRY_MAP_SECTION,
  DEFAULT_RESUME_PAGE_HERO,
  DEFAULT_RESUME_QUIZ_SECTION,
  DEFAULT_RESUME_TEMPLATES_SECTION,
  resolveEditorResumePayload,
  type ResumePageHero,
  type ResumeQuizSectionCopy,
  type ResumeSectionCopy,
} from "@/lib/content/resume-payload";
import { POSITIONING_PRINCIPLE, TEMPLATE_CARD_DETAILS, INDUSTRY_MAP, type IndustryMapZone, type TemplateCardDetails } from "@/data/resume-templates";
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
  sub?: string;
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
  pageHero?: Partial<ResumePageHero>;
  quizSection?: Partial<ResumeQuizSectionCopy>;
  industryMapSection?: Partial<ResumeSectionCopy>;
  templatesSection?: Partial<ResumeSectionCopy>;
  positioningPrinciple?: Partial<{ title: string; body: string }>;
  templateCardDetails?: Record<string, Partial<TemplateCardDetails>>;
  industryMap?: IndustryMapZone[];
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
    onChange({
      ...data,
      quiz: [...questions, { id: `qq-${Date.now()}`, question: "", sub: "", options: [] }],
    });
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
          <EditorField label="Subtext">
            <textarea className={textareaClass} rows={2} value={q.sub ?? ""} onChange={(e) => patchQ(qi, { ...q, sub: e.target.value })} />
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

function ResumeHeroTab({ data, onChange }: { data: ResumePayload; onChange: (d: ResumePayload) => void }) {
  const hero: ResumePageHero = {
    ...DEFAULT_RESUME_PAGE_HERO,
    ...(data.pageHero ?? {}),
    stats: data.pageHero?.stats?.length ? data.pageHero.stats : DEFAULT_RESUME_PAGE_HERO.stats,
  };

  function patch(updates: Partial<ResumePageHero>) {
    onChange({ ...data, pageHero: { ...hero, ...updates } });
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-fg">Blue strip at the top of <strong>/resume-templates</strong>.</p>
      <EditorField label="Eyebrow">
        <input className={inputClass} value={hero.eyebrow} onChange={(e) => patch({ eyebrow: e.target.value })} />
      </EditorField>
      <div className="grid gap-3 sm:grid-cols-2">
        <EditorField label="Title">
          <input className={inputClass} value={hero.title} onChange={(e) => patch({ title: e.target.value })} />
        </EditorField>
        <EditorField label="Title accent (italic)">
          <input className={inputClass} value={hero.titleAccent} onChange={(e) => patch({ titleAccent: e.target.value })} />
        </EditorField>
      </div>
      <EditorField label="Description">
        <textarea className={textareaClass} value={hero.description} onChange={(e) => patch({ description: e.target.value })} />
      </EditorField>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-700">Stat cards</p>
          <Button variant="outline" size="sm" onClick={() => patch({ stats: [...hero.stats, { num: "", label: "" }] })}>
            <Plus className="w-3.5 h-3.5" /> Add stat
          </Button>
        </div>
        {hero.stats.map((stat, i) => (
          <div key={i} className="flex items-center gap-2">
            <input className={cn(inputClass, "w-28")} value={stat.num} onChange={(e) => {
              const stats = [...hero.stats];
              stats[i] = { ...stat, num: e.target.value };
              patch({ stats });
            }} />
            <input className={inputClass} value={stat.label} onChange={(e) => {
              const stats = [...hero.stats];
              stats[i] = { ...stat, label: e.target.value };
              patch({ stats });
            }} />
            <button type="button" onClick={() => patch({ stats: hero.stats.filter((_, j) => j !== i) })} className="text-red-400 hover:text-red-600 p-1">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResumeSectionsTab({ data, onChange }: { data: ResumePayload; onChange: (d: ResumePayload) => void }) {
  const quiz: ResumeQuizSectionCopy = { ...DEFAULT_RESUME_QUIZ_SECTION, ...data.quizSection };
  const map: ResumeSectionCopy = { ...DEFAULT_RESUME_INDUSTRY_MAP_SECTION, ...data.industryMapSection };
  const templates: ResumeSectionCopy = { ...DEFAULT_RESUME_TEMPLATES_SECTION, ...data.templatesSection };
  const principle = { ...POSITIONING_PRINCIPLE, ...data.positioningPrinciple };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-xs font-semibold text-gray-700">Quiz section</p>
        <EditorField label="Eyebrow"><input className={inputClass} value={quiz.eyebrow} onChange={(e) => onChange({ ...data, quizSection: { ...quiz, eyebrow: e.target.value } })} /></EditorField>
        <EditorField label="Title"><input className={inputClass} value={quiz.title} onChange={(e) => onChange({ ...data, quizSection: { ...quiz, title: e.target.value } })} /></EditorField>
        <EditorField label="Description"><textarea className={textareaClass} value={quiz.description} onChange={(e) => onChange({ ...data, quizSection: { ...quiz, description: e.target.value } })} /></EditorField>
        <div className="grid gap-3 sm:grid-cols-2">
          <EditorField label="Finder title"><input className={inputClass} value={quiz.finderTitle} onChange={(e) => onChange({ ...data, quizSection: { ...quiz, finderTitle: e.target.value } })} /></EditorField>
          <EditorField label="Finder subtitle"><input className={inputClass} value={quiz.finderSub} onChange={(e) => onChange({ ...data, quizSection: { ...quiz, finderSub: e.target.value } })} /></EditorField>
        </div>
      </div>
      <div className="space-y-3">
        <p className="text-xs font-semibold text-gray-700">Industry map section</p>
        <EditorField label="Eyebrow"><input className={inputClass} value={map.eyebrow} onChange={(e) => onChange({ ...data, industryMapSection: { ...map, eyebrow: e.target.value } })} /></EditorField>
        <EditorField label="Title"><input className={inputClass} value={map.title} onChange={(e) => onChange({ ...data, industryMapSection: { ...map, title: e.target.value } })} /></EditorField>
        <EditorField label="Description"><textarea className={textareaClass} value={map.description} onChange={(e) => onChange({ ...data, industryMapSection: { ...map, description: e.target.value } })} /></EditorField>
      </div>
      <div className="space-y-3">
        <p className="text-xs font-semibold text-gray-700">Templates section</p>
        <EditorField label="Eyebrow"><input className={inputClass} value={templates.eyebrow} onChange={(e) => onChange({ ...data, templatesSection: { ...templates, eyebrow: e.target.value } })} /></EditorField>
        <EditorField label="Title"><input className={inputClass} value={templates.title} onChange={(e) => onChange({ ...data, templatesSection: { ...templates, title: e.target.value } })} /></EditorField>
        <EditorField label="Description"><textarea className={textareaClass} value={templates.description} onChange={(e) => onChange({ ...data, templatesSection: { ...templates, description: e.target.value } })} /></EditorField>
      </div>
      <div className="space-y-3">
        <p className="text-xs font-semibold text-gray-700">Positioning principle</p>
        <EditorField label="Title"><input className={inputClass} value={principle.title} onChange={(e) => onChange({ ...data, positioningPrinciple: { ...principle, title: e.target.value } })} /></EditorField>
        <EditorField label="Body"><textarea className={textareaClass} value={principle.body} onChange={(e) => onChange({ ...data, positioningPrinciple: { ...principle, body: e.target.value } })} /></EditorField>
      </div>
    </div>
  );
}

function ResumeIndustryMapTab({ data, onChange }: { data: ResumePayload; onChange: (d: ResumePayload) => void }) {
  const zones: IndustryMapZone[] = data.industryMap?.length ? data.industryMap : INDUSTRY_MAP;

  function patch(i: number, zone: IndustryMapZone) {
    const next = [...zones];
    next[i] = zone;
    onChange({ ...data, industryMap: next });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-fg">{zones.length} zones</p>
        <Button variant="outline" size="sm" onClick={() => onChange({ ...data, industryMap: [...zones, { zone: "", title: "", color: "#0830a0", roles: [] }] })}>
          <Plus className="w-3.5 h-3.5" /> Add zone
        </Button>
      </div>
      {zones.map((zone, i) => (
        <EditorRow key={`${zone.zone}-${i}`} summary={<span className="font-medium">{zone.title || zone.zone || "(untitled zone)"}</span>} onDelete={() => onChange({ ...data, industryMap: zones.filter((_, j) => j !== i) })}>
          <div className="grid gap-3 sm:grid-cols-2">
            <EditorField label="Zone id"><input className={inputClass} value={zone.zone} onChange={(e) => patch(i, { ...zone, zone: e.target.value })} /></EditorField>
            <EditorField label="Title"><input className={inputClass} value={zone.title} onChange={(e) => patch(i, { ...zone, title: e.target.value })} /></EditorField>
            <EditorField label="Color"><input className={inputClass} value={zone.color} onChange={(e) => patch(i, { ...zone, color: e.target.value })} /></EditorField>
          </div>
          <EditorField label="Roles" hint="One per line. Optional tag after | e.g. Scheduler | Ops">
            <textarea
              className={textareaClass}
              value={zone.roles.map((r) => (r.tag ? `${r.name} | ${r.tag}` : r.name)).join("\n")}
              onChange={(e) =>
                patch(i, {
                  ...zone,
                  roles: e.target.value.split("\n").filter(Boolean).map((line) => {
                    const [name, tag] = line.split("|").map((s) => s.trim());
                    return { name, ...(tag ? { tag } : {}) };
                  }),
                })
              }
            />
          </EditorField>
        </EditorRow>
      ))}
    </div>
  );
}

function ResumeTemplateCardsTab({ data, onChange }: { data: ResumePayload; onChange: (d: ResumePayload) => void }) {
  const cards = { ...TEMPLATE_CARD_DETAILS, ...data.templateCardDetails };
  const ids = Object.keys(cards);

  function patch(id: string, updates: Partial<TemplateCardDetails>) {
    onChange({
      ...data,
      templateCardDetails: {
        ...cards,
        [id]: { ...cards[id], ...updates },
      },
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-fg">Card copy on the public resume page — who it is for, highlights, and preview tagline.</p>
      {ids.map((id) => {
        const card = cards[id];
        return (
          <EditorRow key={id} summary={<span className="font-medium">{card.title || id}</span>}>
            <EditorField label="Title"><input className={inputClass} value={card.title} onChange={(e) => patch(id, { title: e.target.value })} /></EditorField>
            <EditorField label="Who this is for"><textarea className={textareaClass} value={card.whoThisIsFor} onChange={(e) => patch(id, { whoThisIsFor: e.target.value })} /></EditorField>
            <EditorField label="Highlights" hint="One per line">
              <textarea className={textareaClass} value={(card.highlights ?? []).join("\n")} onChange={(e) => patch(id, { highlights: e.target.value.split("\n").filter(Boolean) })} />
            </EditorField>
            <EditorField label="Preview tagline"><input className={inputClass} value={card.previewTagline} onChange={(e) => patch(id, { previewTagline: e.target.value })} /></EditorField>
          </EditorRow>
        );
      })}
    </div>
  );
}

// ─── Main editor ─────────────────────────────────────────────────────────────

const TABS = [
  { id: "hero", label: "Top blue strip" },
  { id: "personas", label: "Persona Types" },
  { id: "quiz", label: "Persona Quiz" },
  { id: "sections", label: "Page sections" },
  { id: "industry", label: "Industry map" },
  { id: "templates", label: "Resume Templates" },
  { id: "cards", label: "Template cards" },
  { id: "vetting", label: "Resume Vetting" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function ResumeEditor({
  payload,
  onChange,
  moduleSlug,
  requiredTier,
  contentVersion = 0,
}: {
  payload: unknown;
  onChange: (p: unknown) => void;
  moduleSlug: string;
  requiredTier: string;
  /** Bumps after load / save / revert so editor re-syncs from server payload. */
  contentVersion?: number;
}) {
  const [activeTab, setActiveTab] = useState<TabId>("personas");
  const [data, setData] = useState<ResumePayload>(() => resolveEditorResumePayload(payload) as ResumePayload);

  useEffect(() => {
    if (payload == null) return;
    setData(resolveEditorResumePayload(payload) as ResumePayload);
    // Re-sync only after load / save / revert — not on every local edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- payload read when contentVersion bumps
  }, [contentVersion]);

  function handleChange(next: ResumePayload) {
    setData(next);
    onChange(next);
  }

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

      {activeTab === "hero" && <ResumeHeroTab data={data} onChange={handleChange} />}
      {activeTab === "personas" && <PersonaTypesTab data={data} onChange={handleChange} />}
      {activeTab === "quiz" && <PersonaQuizTab data={data} onChange={handleChange} />}
      {activeTab === "sections" && <ResumeSectionsTab data={data} onChange={handleChange} />}
      {activeTab === "industry" && <ResumeIndustryMapTab data={data} onChange={handleChange} />}
      {activeTab === "templates" && <ResumeTemplatesTab data={data} onChange={handleChange} moduleSlug={moduleSlug} requiredTier={requiredTier} />}
      {activeTab === "cards" && <ResumeTemplateCardsTab data={data} onChange={handleChange} />}
      {activeTab === "vetting" && <ResumeVettingTab data={data} onChange={handleChange} />}
    </div>
  );
}
