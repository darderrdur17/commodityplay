"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  FeatureComparisonTable,
  LandingContent,
  LandingTrackFeature,
  CaseStudyPreviewCard,
} from "@/data/landing-content";

interface Props {
  content: LandingContent;
  onChange: (content: LandingContent) => void;
  trackFilter?: "career" | "sales" | "both";
  /** Rendered immediately under Sales Track Only — Tools (example talking points). */
  afterSalesTrackTools?: React.ReactNode;
  /** Live Case Studies CMS catalog for the Career landing featured picker. */
  caseStudyCatalog?: {
    slug: string;
    title: string;
    category: string;
    catchLine: string;
    excerpt: string;
    readMinutes: number;
    status?: string;
  }[];
}

function Section({
  title,
  description,
  defaultOpen = false,
  children,
}: {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-3 bg-secondary/60 hover:bg-secondary text-left"
      >
        {open ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
        <div>
          <p className="font-semibold text-sm text-gray-900">{title}</p>
          {description && <p className="text-xs text-muted-fg mt-0.5">{description}</p>}
        </div>
      </button>
      {open && <div className="p-4 space-y-4 border-t border-border">{children}</div>}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold text-gray-700">{label}</span>
      {hint && <span className="block text-[11px] text-muted-fg">{hint}</span>}
      {children}
    </label>
  );
}

const inputClass =
  "w-full h-9 px-3 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary-400";
const textareaClass =
  "w-full min-h-[72px] px-3 py-2 rounded-lg border border-border text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary-400 resize-y whitespace-pre-wrap break-words";

function TextInput({
  value,
  onChange,
  multiline,
  rows = 3,
}: {
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  rows?: number;
}) {
  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className={textareaClass}
      />
    );
  }
  return <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />;
}

function normalizeFeatureLines(raw: string): string[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Number stat field — keeps local text while focused so mobile typing is not overwritten. */
function StatValueInput({
  value,
  onChange,
  placeholder = "Value",
}: {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
}) {
  const [text, setText] = useState(() => String(value ?? ""));
  const focusedRef = useRef(false);

  useEffect(() => {
    if (!focusedRef.current) {
      setText(String(value ?? ""));
    }
  }, [value]);

  return (
    <input
      type="text"
      inputMode="numeric"
      value={text}
      placeholder={placeholder}
      onFocus={() => {
        focusedRef.current = true;
      }}
      onChange={(e) => {
        const next = e.target.value;
        setText(next);
        // Commit immediately so Save works without blurring first (matters on touch devices).
        const parsed = Number(next);
        if (next.trim() !== "" && Number.isFinite(parsed)) onChange(parsed);
      }}
      onBlur={() => {
        focusedRef.current = false;
        const parsed = Number(text);
        const resolved = Number.isFinite(parsed) ? parsed : 0;
        setText(String(resolved));
        onChange(resolved);
      }}
      className={inputClass}
    />
  );
}

function HeroStatRow({
  stat,
  onChange,
}: {
  stat: { value: number; suffix: string; label: string };
  onChange: (next: { value: number; suffix: string; label: string }) => void;
}) {
  return (
    <div className="grid gap-3 p-3 rounded-lg bg-secondary/40 sm:grid-cols-3">
      <Field label="Value">
        <StatValueInput value={stat.value} onChange={(value) => onChange({ ...stat, value })} />
      </Field>
      <Field label="Suffix" hint='e.g. "+" or " min"'>
        <TextInput value={stat.suffix} onChange={(suffix) => onChange({ ...stat, suffix })} />
      </Field>
      <Field label="Label">
        <TextInput value={stat.label} onChange={(label) => onChange({ ...stat, label })} />
      </Field>
    </div>
  );
}

function FeaturesList({
  value,
  onChange,
}: {
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const [text, setText] = useState(() => value.join("\n"));
  const focusedRef = useRef(false);

  useEffect(() => {
    if (!focusedRef.current) {
      setText(value.join("\n"));
    }
  }, [value]);

  return (
    <textarea
      value={text}
      onFocus={() => {
        focusedRef.current = true;
      }}
      onChange={(e) => {
        const next = e.target.value;
        setText(next);
        // Keep parent in sync for Save without blur. Blank lines are dropped here because
        // an in-progress trailing newline would otherwise fail validation for the whole page.
        onChange(normalizeFeatureLines(next));
      }}
      onBlur={(e) => {
        focusedRef.current = false;
        const normalized = normalizeFeatureLines(e.target.value);
        const joined = normalized.join("\n");
        setText(joined);
        onChange(normalized);
      }}
      rows={6}
      className={textareaClass}
      placeholder="One feature per line"
    />
  );
}

export type ComparisonColumn = { key: "starter" | "pro" | "elite"; label: string };

const smallButtonClass =
  "inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-border hover:bg-secondary/60 transition-colors";

/**
 * Editable Feature Comparison / pricing comparison table — same table rendered on the live
 * landing page. Admins can edit group titles, colors, row (feature) names, and which plans
 * check the feature off, without touching code.
 *
 * EXPORTED because the focused "Pricing plans" card (`editors/pricing-plans-editor.tsx`)
 * renders this exact component for its own track. Sharing the one implementation is what
 * keeps the two entry points from drifting apart — there is only ever one editor for
 * these rows.
 */
export function ComparisonTableEditor({
  table,
  onChange,
  columns,
}: {
  table: FeatureComparisonTable;
  onChange: (table: FeatureComparisonTable) => void;
  columns: ComparisonColumn[];
}) {
  function updateGroup(i: number, patch: Partial<FeatureComparisonTable["groups"][number]>) {
    const groups = [...table.groups];
    groups[i] = { ...groups[i], ...patch };
    onChange({ groups });
  }

  function addGroup() {
    const groups = [
      ...table.groups,
      {
        category: "New plan",
        color: "#3280ff",
        items: [{ name: "New feature", starter: false, pro: true, elite: true }],
      },
    ];
    onChange({ groups });
  }

  function removeGroup(i: number) {
    onChange({ groups: table.groups.filter((_, idx) => idx !== i) });
  }

  function addItem(groupIndex: number) {
    const groups = [...table.groups];
    groups[groupIndex] = {
      ...groups[groupIndex],
      items: [...groups[groupIndex].items, { name: "New feature", starter: false, pro: true, elite: true }],
    };
    onChange({ groups });
  }

  function updateItem(groupIndex: number, itemIndex: number, patch: Partial<FeatureComparisonTable["groups"][number]["items"][number]>) {
    const groups = [...table.groups];
    const items = [...groups[groupIndex].items];
    items[itemIndex] = { ...items[itemIndex], ...patch };
    groups[groupIndex] = { ...groups[groupIndex], items };
    onChange({ groups });
  }

  function removeItem(groupIndex: number, itemIndex: number) {
    const groups = [...table.groups];
    groups[groupIndex] = {
      ...groups[groupIndex],
      items: groups[groupIndex].items.filter((_, idx) => idx !== itemIndex),
    };
    onChange({ groups });
  }

  return (
    <div className="space-y-4">
      {table.groups.map((group, gi) => (
        <div key={gi} className="rounded-lg border border-border overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 p-3 bg-secondary/40">
            <input
              type="text"
              value={group.category}
              onChange={(e) => updateGroup(gi, { category: e.target.value })}
              className={cn(inputClass, "flex-1 min-w-[160px]")}
              placeholder="Group / plan label (e.g. Pro — S$19/month)"
            />
            <input
              type="color"
              value={/^#[0-9a-fA-F]{6}$/.test(group.color) ? group.color : "#3280ff"}
              onChange={(e) => updateGroup(gi, { color: e.target.value })}
              className="h-9 w-9 rounded-lg border border-border cursor-pointer"
              title="Accent color"
            />
            <button
              type="button"
              onClick={() => removeGroup(gi)}
              className="text-red-500 hover:text-red-600 p-1.5 shrink-0"
              title="Delete group"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y divide-border">
            {group.items.map((item, ii) => (
              <div key={ii} className="flex flex-wrap items-center gap-2 p-2.5">
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => updateItem(gi, ii, { name: e.target.value })}
                  className={cn(inputClass, "flex-1 min-w-[180px]")}
                  placeholder="Feature name"
                />
                {columns.map((col) => (
                  <label key={col.key} className="flex items-center gap-1 text-xs font-medium text-gray-600 shrink-0">
                    <input
                      type="checkbox"
                      checked={Boolean(item[col.key])}
                      onChange={(e) => updateItem(gi, ii, { [col.key]: e.target.checked })}
                    />
                    {col.label}
                  </label>
                ))}
                <button
                  type="button"
                  onClick={() => removeItem(gi, ii)}
                  className="text-red-400 hover:text-red-600 p-1 shrink-0"
                  title="Delete row"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="p-2.5 bg-secondary/20">
            <button type="button" onClick={() => addItem(gi)} className={smallButtonClass}>
              <Plus className="w-3.5 h-3.5" /> Add feature row
            </button>
          </div>
        </div>
      ))}
      <button type="button" onClick={addGroup} className={smallButtonClass}>
        <Plus className="w-3.5 h-3.5" /> Add plan group
      </button>
    </div>
  );
}

/**
 * Eyebrow / headline / lede / three labelled points — the shape shared by the
 * three Sales feature sections (Market Nudges, Prep Library, Account
 * Intelligence). The product mock panel beside the copy is illustrative sample
 * content and deliberately NOT editable here.
 */
function TrackFeatureFields({
  feature,
  onChange,
}: {
  feature: LandingTrackFeature;
  onChange: (next: LandingTrackFeature) => void;
}) {
  return (
    <>
      <div className="grid gap-2 sm:grid-cols-2">
        <Field label="Eyebrow">
          <TextInput
            value={feature.eyebrow}
            onChange={(v) => onChange({ ...feature, eyebrow: v })}
          />
        </Field>
        <Field label="Headline">
          <TextInput
            value={feature.headline}
            onChange={(v) => onChange({ ...feature, headline: v })}
          />
        </Field>
      </div>
      <Field label="Lede">
        <TextInput
          multiline
          value={feature.lede}
          onChange={(v) => onChange({ ...feature, lede: v })}
        />
      </Field>
      <div className="space-y-2">
        {feature.points.map((point, i) => (
          <div key={`point-${i}`} className="grid gap-2 sm:grid-cols-[130px_1fr]">
            <Field label={`Point ${i + 1} label`}>
              <TextInput
                value={point.label}
                onChange={(v) => {
                  const points = [...feature.points];
                  points[i] = { ...point, label: v };
                  onChange({ ...feature, points });
                }}
              />
            </Field>
            <Field label="Text">
              <TextInput
                value={point.text}
                onChange={(v) => {
                  const points = [...feature.points];
                  points[i] = { ...point, text: v };
                  onChange({ ...feature, points });
                }}
              />
            </Field>
          </div>
        ))}
      </div>
    </>
  );
}

export function AdminLandingEditor({
  content,
  onChange,
  trackFilter = "both",
  afterSalesTrackTools,
  caseStudyCatalog = [],
}: Props) {
  function patch<K extends keyof LandingContent>(key: K, value: LandingContent[K]) {
    onChange({ ...content, [key]: value });
  }

  const showCareer = trackFilter === "both" || trackFilter === "career";
  const showSales = trackFilter === "both" || trackFilter === "sales";

  return (
    <div className="p-4 space-y-4 max-h-[calc(100vh-220px)] overflow-y-auto">
      <p className="text-xs text-muted-fg bg-secondary/50 rounded-lg px-3 py-2">
        Edit landing page wording only. Layout and structure stay in code. With Published checked, Save updates the live site immediately (refresh to see changes).
      </p>

      {showCareer && (
      <>
      <Section title="Career Track — Hero" description="Track 1 hero section" defaultOpen>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Eyebrow">
            <TextInput value={content.career.eyebrow} onChange={(v) => patch("career", { ...content.career, eyebrow: v })} />
          </Field>
          <Field label="Headline (line 1)">
            <TextInput value={content.career.headline} onChange={(v) => patch("career", { ...content.career, headline: v })} />
          </Field>
          <Field label="Headline accent (italic)">
            <TextInput
              value={content.career.headlineAccent}
              onChange={(v) => patch("career", { ...content.career, headlineAccent: v })}
            />
          </Field>
          <Field label="Primary CTA">
            <TextInput
              value={content.career.ctaPrimary}
              onChange={(v) => patch("career", { ...content.career, ctaPrimary: v })}
            />
          </Field>
          <Field label="Secondary CTA">
            <TextInput
              value={content.career.ctaSecondary}
              onChange={(v) => patch("career", { ...content.career, ctaSecondary: v })}
            />
          </Field>
          <Field label="Bottom CTA title">
            <TextInput
              value={content.career.finalCtaTitle}
              onChange={(v) => patch("career", { ...content.career, finalCtaTitle: v })}
              multiline
              rows={2}
            />
          </Field>
          <Field label="Bottom CTA accent (italic, light blue)">
            <TextInput
              value={content.career.finalCtaAccent}
              onChange={(v) => patch("career", { ...content.career, finalCtaAccent: v })}
            />
          </Field>
        </div>
        <Field label="Description">
          <TextInput
            value={content.career.description}
            onChange={(v) => patch("career", { ...content.career, description: v })}
            multiline
            rows={4}
          />
        </Field>
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-700">Hero stats</p>
          {content.career.heroStats.map((stat, i) => (
            <HeroStatRow
              key={`career-stat-${stat.label}-${i}`}
              stat={stat}
              onChange={(next) => {
                const heroStats = [...content.career.heroStats];
                heroStats[i] = next;
                patch("career", { ...content.career, heroStats });
              }}
            />
          ))}
        </div>
      </Section>

      <Section title="What's Inside" description="Career track resource grid">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title line 1">
            <TextInput
              value={content.whatsInside.titleLine1}
              onChange={(v) => patch("whatsInside", { ...content.whatsInside, titleLine1: v })}
            />
          </Field>
          <Field label="Title line 2 (italic)">
            <TextInput
              value={content.whatsInside.titleLine2}
              onChange={(v) => patch("whatsInside", { ...content.whatsInside, titleLine2: v })}
            />
          </Field>
        </div>
        <Field label="Description">
          <TextInput
            value={content.whatsInside.description}
            onChange={(v) => patch("whatsInside", { ...content.whatsInside, description: v })}
            multiline
          />
        </Field>
        <div className="space-y-4">
          {content.whatsInside.features.map((feature, i) => (
            <div key={feature.icon} className="p-3 rounded-lg border border-border space-y-2">
              <p className="text-xs font-bold text-muted-fg uppercase">{feature.icon}</p>
              <Field label="Card title">
                <TextInput
                  value={feature.title}
                  onChange={(v) => {
                    const features = [...content.whatsInside.features];
                    features[i] = { ...feature, title: v };
                    patch("whatsInside", { ...content.whatsInside, features });
                  }}
                />
              </Field>
              <Field label="Description">
                <TextInput
                  value={feature.desc}
                  onChange={(v) => {
                    const features = [...content.whatsInside.features];
                    features[i] = { ...feature, desc: v };
                    patch("whatsInside", { ...content.whatsInside, features });
                  }}
                  multiline
                />
              </Field>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Chapter Coverage" description="Career landing accordion. Add, remove, or reorder rows as the playbook grows — the public page renders every chapter saved here.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Section eyebrow">
            <TextInput
              value={content.chapterCoverage.eyebrow}
              onChange={(v) => patch("chapterCoverage", { ...content.chapterCoverage, eyebrow: v })}
            />
          </Field>
          <Field label="Section title">
            <TextInput
              value={content.chapterCoverage.title}
              onChange={(v) => patch("chapterCoverage", { ...content.chapterCoverage, title: v })}
            />
          </Field>
          <Field label="Title accent (italic)" hint='e.g. "Entire Market Spectrum." — matches Case Studies heading style'>
            <TextInput
              value={content.chapterCoverage.titleAccent}
              onChange={(v) => patch("chapterCoverage", { ...content.chapterCoverage, titleAccent: v })}
            />
          </Field>
        </div>
        <Field label="Section description">
          <TextInput
            value={content.chapterCoverage.description}
            onChange={(v) => patch("chapterCoverage", { ...content.chapterCoverage, description: v })}
            multiline
          />
        </Field>
        <Field label="Footer note" hint="Small line under the chapter accordion on the career landing.">
          <TextInput
            value={content.chapterCoverage.footerNote}
            onChange={(v) => patch("chapterCoverage", { ...content.chapterCoverage, footerNote: v })}
          />
        </Field>
        <div className="space-y-4">
          {content.chapterCoverage.chapters.map((chapter, i) => (
            <div key={`coverage-${i}`} className="p-3 rounded-lg border border-border space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-primary-400">Chapter {chapter.letter || i + 1}</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (i === 0) return;
                      const chapters = [...content.chapterCoverage.chapters];
                      const prev = chapters[i - 1];
                      chapters[i - 1] = chapters[i];
                      chapters[i] = prev;
                      patch("chapterCoverage", { ...content.chapterCoverage, chapters });
                    }}
                    disabled={i === 0}
                    className="text-xs text-muted-fg hover:text-primary-400 disabled:opacity-40"
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const chapters = [...content.chapterCoverage.chapters];
                      if (i >= chapters.length - 1) return;
                      const next = chapters[i + 1];
                      chapters[i + 1] = chapters[i];
                      chapters[i] = next;
                      patch("chapterCoverage", { ...content.chapterCoverage, chapters });
                    }}
                    disabled={i >= content.chapterCoverage.chapters.length - 1}
                    className="text-xs text-muted-fg hover:text-primary-400 disabled:opacity-40"
                  >
                    Down
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (content.chapterCoverage.chapters.length <= 1) return;
                      patch("chapterCoverage", {
                        ...content.chapterCoverage,
                        chapters: content.chapterCoverage.chapters.filter((_, idx) => idx !== i),
                      });
                    }}
                    disabled={content.chapterCoverage.chapters.length <= 1}
                    className="text-xs text-muted-fg hover:text-red-600 disabled:opacity-40"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <Field label="Letter">
                <TextInput
                  value={chapter.letter}
                  onChange={(v) => {
                    const chapters = [...content.chapterCoverage.chapters];
                    chapters[i] = { ...chapter, letter: v };
                    patch("chapterCoverage", { ...content.chapterCoverage, chapters });
                  }}
                />
              </Field>
              <Field label="Title">
                <TextInput
                  value={chapter.title}
                  onChange={(v) => {
                    const chapters = [...content.chapterCoverage.chapters];
                    chapters[i] = { ...chapter, title: v };
                    patch("chapterCoverage", { ...content.chapterCoverage, chapters });
                  }}
                />
              </Field>
              <Field label="Description">
                <TextInput
                  value={chapter.desc}
                  onChange={(v) => {
                    const chapters = [...content.chapterCoverage.chapters];
                    chapters[i] = { ...chapter, desc: v };
                    patch("chapterCoverage", { ...content.chapterCoverage, chapters });
                  }}
                  multiline
                  rows={4}
                />
              </Field>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            const used = new Set(content.chapterCoverage.chapters.map((c) => c.letter));
            let letter = String(content.chapterCoverage.chapters.length + 1);
            for (let n = 0; n < 26; n++) {
              const candidate = String.fromCharCode(65 + n);
              if (!used.has(candidate)) {
                letter = candidate;
                break;
              }
            }
            patch("chapterCoverage", {
              ...content.chapterCoverage,
              chapters: [
                ...content.chapterCoverage.chapters,
                { letter, title: "New Chapter", desc: "Describe what this chapter covers." },
              ],
            });
          }}
          className={smallButtonClass}
        >
          <Plus className="w-3.5 h-3.5" /> Add chapter
        </button>
      </Section>

      <Section
        title="Case Studies"
        description="Preview cards below What We Cover on the Career Track landing page (links to full case studies)"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Section eyebrow">
            <TextInput
              value={content.caseStudySample.eyebrow}
              onChange={(v) => patch("caseStudySample", { ...content.caseStudySample, eyebrow: v })}
            />
          </Field>
          <Field label="Title accent (italic)">
            <TextInput
              value={content.caseStudySample.titleAccent}
              onChange={(v) => patch("caseStudySample", { ...content.caseStudySample, titleAccent: v })}
            />
          </Field>
          <Field label="Section title">
            <TextInput
              value={content.caseStudySample.title}
              onChange={(v) => patch("caseStudySample", { ...content.caseStudySample, title: v })}
            />
          </Field>
          <Field label="View more link" hint="Defaults to /case-studies">
            <TextInput
              value={content.caseStudySample.viewMoreHref ?? ""}
              onChange={(v) =>
                patch("caseStudySample", {
                  ...content.caseStudySample,
                  viewMoreHref: v.trim() ? v : undefined,
                })
              }
            />
          </Field>
        </div>
        <Field label="Section description">
          <TextInput
            value={content.caseStudySample.description}
            onChange={(v) => patch("caseStudySample", { ...content.caseStudySample, description: v })}
            multiline
            rows={4}
          />
        </Field>
        <Field label="Category tags" hint="One per line — shown below the View more button">
          <FeaturesList
            value={content.caseStudySample.categoryTags}
            onChange={(categoryTags) =>
              patch("caseStudySample", { ...content.caseStudySample, categoryTags })
            }
          />
        </Field>
        <Field label="Disclaimer">
          <TextInput
            value={content.caseStudySample.disclaimer}
            onChange={(v) => patch("caseStudySample", { ...content.caseStudySample, disclaimer: v })}
            multiline
            rows={3}
          />
        </Field>
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-700">Featured on Career landing</p>
          <p className="text-[11px] text-muted-fg">
            Pick which case studies appear in this section, in order. Title, excerpt, catch line, and read time come
            from Elite Pack → Case Studies. Add as many as you need — not limited to three.
          </p>
          {content.caseStudySample.cards.map((card, i) => {
            const catalogHit = caseStudyCatalog.find((item) => item.slug === card.slug);
            return (
              <div key={`${card.slug}-${i}`} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{card.title}</p>
                  <p className="text-[11px] text-muted-fg mt-0.5">
                    {card.category}
                    {catalogHit?.status === "coming-soon" ? " · coming soon" : ""}
                    <span className="ml-2 font-mono">{card.slug}</span>
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    className={smallButtonClass}
                    disabled={i === 0}
                    onClick={() => {
                      const cards = [...content.caseStudySample.cards];
                      [cards[i - 1], cards[i]] = [cards[i], cards[i - 1]];
                      patch("caseStudySample", {
                        ...content.caseStudySample,
                        cards,
                        featuredSlugs: cards.map((c) => c.slug),
                      });
                    }}
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    className={smallButtonClass}
                    disabled={i === content.caseStudySample.cards.length - 1}
                    onClick={() => {
                      const cards = [...content.caseStudySample.cards];
                      [cards[i + 1], cards[i]] = [cards[i], cards[i + 1]];
                      patch("caseStudySample", {
                        ...content.caseStudySample,
                        cards,
                        featuredSlugs: cards.map((c) => c.slug),
                      });
                    }}
                  >
                    Down
                  </button>
                  <button
                    type="button"
                    className="text-red-400 hover:text-red-600 p-1"
                    disabled={content.caseStudySample.cards.length <= 1}
                    onClick={() => {
                      if (content.caseStudySample.cards.length <= 1) return;
                      const cards = content.caseStudySample.cards.filter((_, j) => j !== i);
                      patch("caseStudySample", {
                        ...content.caseStudySample,
                        cards,
                        featuredSlugs: cards.map((c) => c.slug),
                      });
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
          <Field label="Add a case study">
            <select
              className={inputClass}
              value=""
              onChange={(e) => {
                const slug = e.target.value;
                if (!slug) return;
                if (content.caseStudySample.cards.some((card) => card.slug === slug)) return;
                const item = caseStudyCatalog.find((entry) => entry.slug === slug);
                    const nextCard: CaseStudyPreviewCard = item
                  ? {
                      slug: item.slug,
                      category: item.category || "Case study",
                      title: item.title || item.slug,
                      catchLine: item.catchLine.trim() || item.title || item.slug,
                      excerpt: item.excerpt.trim() || item.title || item.slug,
                      readMinutes: item.readMinutes || 10,
                    }
                  : {
                      slug,
                      category: "Case study",
                      title: slug,
                      catchLine: slug,
                      excerpt: slug,
                      readMinutes: 10,
                    };
                const cards = [...content.caseStudySample.cards, nextCard];
                patch("caseStudySample", {
                  ...content.caseStudySample,
                  cards,
                  featuredSlugs: cards.map((c) => c.slug),
                });
              }}
            >
              <option value="">Select from Case Studies CMS…</option>
              {caseStudyCatalog
                .filter((item) => !content.caseStudySample.cards.some((card) => card.slug === item.slug))
                .map((item) => (
                  <option key={item.slug} value={item.slug}>
                    {item.title}
                    {item.status === "coming-soon" ? " (coming soon)" : ""}
                  </option>
                ))}
            </select>
          </Field>
        </div>
      </Section>

      <Section title="Career Pricing" description="Track 1 pricing band">
        <Field label="Section title">
          <TextInput
            value={content.pricing.title}
            onChange={(v) => patch("pricing", { ...content.pricing, title: v })}
          />
        </Field>
        <Field label="Subtitle">
          <TextInput
            value={content.pricing.subtitle}
            onChange={(v) => patch("pricing", { ...content.pricing, subtitle: v })}
            multiline
          />
        </Field>
        <div className="space-y-4">
          {content.pricing.tiers.map((tier, i) => (
            <div key={`career-pricing-${i}`} className="p-3 rounded-lg border border-border space-y-2">
              <p className="text-xs font-bold text-muted-fg uppercase">{tier.name} tier</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <Field label="Price label">
                  <TextInput
                    value={tier.price}
                    onChange={(v) => {
                      const tiers = [...content.pricing.tiers];
                      tiers[i] = { ...tier, price: v };
                      patch("pricing", { ...content.pricing, tiers });
                    }}
                  />
                </Field>
                <Field label="Billing">
                  <TextInput
                    value={tier.billing}
                    onChange={(v) => {
                      const tiers = [...content.pricing.tiers];
                      tiers[i] = { ...tier, billing: v };
                      patch("pricing", { ...content.pricing, tiers });
                    }}
                  />
                </Field>
                <Field label="Tooltip / tagline">
                  <TextInput
                    value={tier.tooltip}
                    onChange={(v) => {
                      const tiers = [...content.pricing.tiers];
                      tiers[i] = { ...tier, tooltip: v };
                      patch("pricing", { ...content.pricing, tiers });
                    }}
                  />
                </Field>
                <Field label="CTA button">
                  <TextInput
                    value={tier.cta}
                    onChange={(v) => {
                      const tiers = [...content.pricing.tiers];
                      tiers[i] = { ...tier, cta: v };
                      patch("pricing", { ...content.pricing, tiers });
                    }}
                  />
                </Field>
              </div>
              {/* `highlight` drives the "Most Popular" badge on /pricing
                  (`pricing-tier-grid.tsx` renders it when `tier.highlight`).
                  It was previously WRITABLE BY NOTHING — no admin control
                  touched it — so the badge could only be moved by a code change
                  or a direct payload write. Exactly one tier should be checked;
                  nothing enforces that, so two checks would render two badges. */}
              <label className="flex items-center gap-2 text-xs font-medium text-gray-600">
                <input
                  type="checkbox"
                  checked={Boolean(tier.highlight)}
                  onChange={(e) => {
                    const tiers = [...content.pricing.tiers];
                    tiers[i] = { ...tier, highlight: e.target.checked };
                    patch("pricing", { ...content.pricing, tiers });
                  }}
                />
                Most Popular — show the badge on this tier
              </label>
              <Field label="Tier description">
                <TextInput
                  value={tier.description}
                  onChange={(v) => {
                    const tiers = [...content.pricing.tiers];
                    tiers[i] = { ...tier, description: v };
                    patch("pricing", { ...content.pricing, tiers });
                  }}
                  multiline
                />
              </Field>
              <Field label="Features" hint="One per line">
                <FeaturesList
                  value={tier.features}
                  onChange={(features) => {
                    const tiers = [...content.pricing.tiers];
                    tiers[i] = { ...tier, features };
                    patch("pricing", { ...content.pricing, tiers });
                  }}
                />
              </Field>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Career Feature Comparison"
        description="Pricing comparison table shown on the Career Track landing page (Starter / Pro / Elite)"
      >
        <ComparisonTableEditor
          table={content.pricing.comparison}
          onChange={(comparison) => patch("pricing", { ...content.pricing, comparison })}
          columns={[
            { key: "starter", label: "Starter" },
            { key: "pro", label: "Pro" },
            { key: "elite", label: "Elite" },
          ]}
        />
      </Section>

      <Section title="Testimonials" description="Social proof cards below pricing on the Career Track landing page">
        <Field label="Section eyebrow" hint="Optional — leave blank to show stars only">
          <TextInput
            value={content.testimonials.eyebrow ?? ""}
            onChange={(v) =>
              patch("testimonials", {
                ...content.testimonials,
                eyebrow: v.trim() ? v : undefined,
              })
            }
          />
        </Field>
        <Field label="Section title">
          <TextInput
            value={content.testimonials.title}
            onChange={(v) => patch("testimonials", { ...content.testimonials, title: v })}
          />
        </Field>
        <div className="space-y-4">
          {content.testimonials.items.map((item, i) => (
            <div key={item.id} className="p-3 rounded-lg border border-border space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-muted-fg uppercase">Testimonial {i + 1}</p>
                <button
                  type="button"
                  onClick={() => {
                    if (content.testimonials.items.length <= 1) return;
                    patch("testimonials", {
                      ...content.testimonials,
                      items: content.testimonials.items.filter((_, idx) => idx !== i),
                    });
                  }}
                  className="text-red-400 hover:text-red-600 p-1 shrink-0"
                  title="Remove testimonial"
                  disabled={content.testimonials.items.length <= 1}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <Field label="Quote">
                <TextInput
                  value={item.quote}
                  onChange={(v) => {
                    const items = [...content.testimonials.items];
                    items[i] = { ...item, quote: v };
                    patch("testimonials", { ...content.testimonials, items });
                  }}
                  multiline
                  rows={3}
                />
              </Field>
              <div className="grid gap-2 sm:grid-cols-2">
                <Field label="Name">
                  <TextInput
                    value={item.name}
                    onChange={(v) => {
                      const items = [...content.testimonials.items];
                      items[i] = { ...item, name: v };
                      patch("testimonials", { ...content.testimonials, items });
                    }}
                  />
                </Field>
                <Field label="Role / location">
                  <TextInput
                    value={item.role}
                    onChange={(v) => {
                      const items = [...content.testimonials.items];
                      items[i] = { ...item, role: v };
                      patch("testimonials", { ...content.testimonials, items });
                    }}
                  />
                </Field>
                <Field label="Avatar letter" hint="Defaults to first letter of name">
                  <TextInput
                    value={item.avatarLetter ?? ""}
                    onChange={(v) => {
                      const items = [...content.testimonials.items];
                      items[i] = { ...item, avatarLetter: v.trim() ? v : undefined };
                      patch("testimonials", { ...content.testimonials, items });
                    }}
                  />
                </Field>
                <Field label="Avatar color">
                  <input
                    type="color"
                    value={/^#[0-9a-fA-F]{6}$/.test(item.avatarColor ?? "") ? item.avatarColor! : "#3280ff"}
                    onChange={(e) => {
                      const items = [...content.testimonials.items];
                      items[i] = { ...item, avatarColor: e.target.value };
                      patch("testimonials", { ...content.testimonials, items });
                    }}
                    className="h-9 w-9 rounded-lg border border-border cursor-pointer"
                    title="Avatar color"
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            patch("testimonials", {
              ...content.testimonials,
              items: [
                ...content.testimonials.items,
                {
                  id: `testimonial-${Date.now()}`,
                  quote: "",
                  name: "",
                  role: "",
                },
              ],
            })
          }
          className={smallButtonClass}
        >
          <Plus className="w-3.5 h-3.5" /> Add testimonial
        </button>
      </Section>

      <Section title="Mentor Connect" description="Hero eyebrow/title also editable under Content → Mentor Connect (includes subtitle)">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Eyebrow">
            <TextInput
              value={content.mentorConnect.eyebrow}
              onChange={(v) => patch("mentorConnect", { ...content.mentorConnect, eyebrow: v })}
            />
          </Field>
          <Field label="Title">
            <TextInput
              value={content.mentorConnect.title}
              onChange={(v) => patch("mentorConnect", { ...content.mentorConnect, title: v })}
            />
          </Field>
        </div>
      </Section>
      </>
      )}

      {showSales && (
      <>
      <Section title="Sales Track — Hero" description="Track 2 hero section">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Eyebrow">
            <TextInput
              value={content.sales.eyebrow}
              onChange={(v) => patch("sales", { ...content.sales, eyebrow: v })}
            />
          </Field>
          <Field label="Headline (line 1)">
            <TextInput
              value={content.sales.headline}
              onChange={(v) => patch("sales", { ...content.sales, headline: v })}
            />
          </Field>
          <Field label="Headline accent">
            <TextInput
              value={content.sales.headlineAccent}
              onChange={(v) => patch("sales", { ...content.sales, headlineAccent: v })}
            />
          </Field>
          <Field label="Primary CTA">
            <TextInput
              value={content.sales.ctaPrimary}
              onChange={(v) => patch("sales", { ...content.sales, ctaPrimary: v })}
            />
          </Field>
          <Field label="Secondary CTA">
            <TextInput
              value={content.sales.ctaSecondary}
              onChange={(v) => patch("sales", { ...content.sales, ctaSecondary: v })}
            />
          </Field>
        </div>
        <Field label="Description">
          <TextInput
            value={content.sales.description}
            onChange={(v) => patch("sales", { ...content.sales, description: v })}
            multiline
            rows={4}
          />
        </Field>
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-700">Hero stats</p>
          {content.sales.stats.map((stat, i) => (
            <HeroStatRow
              key={`sales-stat-${stat.label}-${i}`}
              stat={stat}
              onChange={(next) => {
                const stats = [...content.sales.stats];
                stats[i] = { ...stat, ...next };
                patch("sales", { ...content.sales, stats });
              }}
            />
          ))}
        </div>
      </Section>

      <Section
        title="Sales Track — The Problem"
        description="Three-card section under the trusted-by strip on the sales landing. Add or remove cards as needed."
        defaultOpen
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Section label">
            <TextInput
              value={content.sales.problem.eyebrow}
              onChange={(v) =>
                patch("sales", { ...content.sales, problem: { ...content.sales.problem, eyebrow: v } })
              }
            />
          </Field>
          <Field label="Headline">
            <TextInput
              value={content.sales.problem.headline}
              onChange={(v) =>
                patch("sales", { ...content.sales, problem: { ...content.sales.problem, headline: v } })
              }
            />
          </Field>
        </div>
        <Field label="Description">
          <TextInput
            value={content.sales.problem.description}
            onChange={(v) =>
              patch("sales", { ...content.sales, problem: { ...content.sales.problem, description: v } })
            }
            multiline
            rows={2}
          />
        </Field>
        <div className="space-y-4">
          {content.sales.problem.cards.map((card, i) => (
            <div key={`problem-${i}`} className="p-3 rounded-lg border border-border space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-muted-fg uppercase">Card {i + 1}</p>
                <button
                  type="button"
                  onClick={() => {
                    if (content.sales.problem.cards.length <= 1) return;
                    patch("sales", {
                      ...content.sales,
                      problem: {
                        ...content.sales.problem,
                        cards: content.sales.problem.cards.filter((_, idx) => idx !== i),
                      },
                    });
                  }}
                  disabled={content.sales.problem.cards.length <= 1}
                  className="text-xs text-muted-fg hover:text-red-600 disabled:opacity-40"
                >
                  Remove
                </button>
              </div>
              <Field label="Title">
                <TextInput
                  value={card.title}
                  onChange={(v) => {
                    const cards = [...content.sales.problem.cards];
                    cards[i] = { ...card, title: v };
                    patch("sales", { ...content.sales, problem: { ...content.sales.problem, cards } });
                  }}
                />
              </Field>
              <Field label="Body">
                <TextInput
                  value={card.desc}
                  onChange={(v) => {
                    const cards = [...content.sales.problem.cards];
                    cards[i] = { ...card, desc: v };
                    patch("sales", { ...content.sales, problem: { ...content.sales.problem, cards } });
                  }}
                  multiline
                  rows={4}
                />
              </Field>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            patch("sales", {
              ...content.sales,
              problem: {
                ...content.sales.problem,
                cards: [...content.sales.problem.cards, { title: "", desc: "" }],
              },
            })
          }
          className={smallButtonClass}
        >
          <Plus className="w-3.5 h-3.5" /> Add card
        </button>
      </Section>

      <Section
        title="Sales Track — What You'll Learn"
        description="Accordion on the Sales landing page — eyebrow, headline, description, and the six topic cards"
        defaultOpen
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Section label">
            <TextInput
              value={content.sales.learn.eyebrow}
              onChange={(v) =>
                patch("sales", { ...content.sales, learn: { ...content.sales.learn, eyebrow: v } })
              }
            />
          </Field>
          <Field label="Headline">
            <TextInput
              value={content.sales.learn.headline}
              onChange={(v) =>
                patch("sales", { ...content.sales, learn: { ...content.sales.learn, headline: v } })
              }
            />
          </Field>
        </div>
        <Field label="Description">
          <TextInput
            value={content.sales.learn.description}
            onChange={(v) =>
              patch("sales", { ...content.sales, learn: { ...content.sales.learn, description: v } })
            }
            multiline
            rows={3}
          />
        </Field>
        <div className="space-y-4">
          {content.sales.learn.items.map((item, i) => (
            <div key={`learn-${i}`} className="p-3 rounded-lg border border-border space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-muted-fg uppercase">Topic {i + 1}</p>
                <button
                  type="button"
                  onClick={() => {
                    if (content.sales.learn.items.length <= 1) return;
                    patch("sales", {
                      ...content.sales,
                      learn: {
                        ...content.sales.learn,
                        items: content.sales.learn.items.filter((_, idx) => idx !== i),
                      },
                    });
                  }}
                  disabled={content.sales.learn.items.length <= 1}
                  className="text-xs text-muted-fg hover:text-red-600 disabled:opacity-40"
                >
                  Remove
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-[80px_1fr]">
                <Field label="Number">
                  <TextInput
                    value={item.num}
                    onChange={(v) => {
                      const items = [...content.sales.learn.items];
                      items[i] = { ...item, num: v };
                      patch("sales", { ...content.sales, learn: { ...content.sales.learn, items } });
                    }}
                  />
                </Field>
                <Field label="Title">
                  <TextInput
                    value={item.title}
                    onChange={(v) => {
                      const items = [...content.sales.learn.items];
                      items[i] = { ...item, title: v };
                      patch("sales", { ...content.sales, learn: { ...content.sales.learn, items } });
                    }}
                  />
                </Field>
              </div>
              <Field label="Body">
                <TextInput
                  value={item.desc}
                  onChange={(v) => {
                    const items = [...content.sales.learn.items];
                    items[i] = { ...item, desc: v };
                    patch("sales", { ...content.sales, learn: { ...content.sales.learn, items } });
                  }}
                  multiline
                  rows={4}
                />
              </Field>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            patch("sales", {
              ...content.sales,
              learn: {
                ...content.sales.learn,
                items: [
                  ...content.sales.learn.items,
                  {
                    num: String(content.sales.learn.items.length + 1).padStart(2, "0"),
                    title: "",
                    desc: "",
                  },
                ],
              },
            })
          }
          className={smallButtonClass}
        >
          <Plus className="w-3.5 h-3.5" /> Add topic
        </button>
      </Section>

      <Section
        title="Sales Track Only — Tools"
        description="Accordion on the sales landing tools strip. Headline, intro, titles, and expandable captions are CMS-owned. Example talking points are edited under Sales Talking Points, directly below. Add, remove, or reorder rows below."
        defaultOpen
      >
        <Field label="Section kicker">
          <TextInput
            value={content.sales.trackTools.eyebrow}
            onChange={(v) =>
              patch("sales", {
                ...content.sales,
                trackTools: { ...content.sales.trackTools, eyebrow: v },
              })
            }
          />
        </Field>
        <Field label="Headline">
          <TextInput
            value={content.sales.trackTools.headline}
            onChange={(v) =>
              patch("sales", {
                ...content.sales,
                trackTools: { ...content.sales.trackTools, headline: v },
              })
            }
          />
        </Field>
        <Field label="Intro">
          <TextInput
            value={content.sales.trackTools.description}
            onChange={(v) =>
              patch("sales", {
                ...content.sales,
                trackTools: { ...content.sales.trackTools, description: v },
              })
            }
            multiline
            rows={2}
          />
        </Field>
        <div className="space-y-4">
          {content.sales.trackTools.features.map((feature, i) => (
            <div key={`track-tool-${i}`} className="p-3 rounded-lg border border-border space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-muted-fg uppercase">Feature {i + 1}</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (i === 0) return;
                      const features = [...content.sales.trackTools.features];
                      const prev = features[i - 1];
                      features[i - 1] = features[i];
                      features[i] = prev;
                      patch("sales", {
                        ...content.sales,
                        trackTools: { ...content.sales.trackTools, features },
                      });
                    }}
                    disabled={i === 0}
                    className="text-xs text-muted-fg hover:text-primary-400 disabled:opacity-40"
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const features = [...content.sales.trackTools.features];
                      if (i >= features.length - 1) return;
                      const next = features[i + 1];
                      features[i + 1] = features[i];
                      features[i] = next;
                      patch("sales", {
                        ...content.sales,
                        trackTools: { ...content.sales.trackTools, features },
                      });
                    }}
                    disabled={i >= content.sales.trackTools.features.length - 1}
                    className="text-xs text-muted-fg hover:text-primary-400 disabled:opacity-40"
                  >
                    Down
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (content.sales.trackTools.features.length <= 1) return;
                      patch("sales", {
                        ...content.sales,
                        trackTools: {
                          ...content.sales.trackTools,
                          features: content.sales.trackTools.features.filter((_, idx) => idx !== i),
                        },
                      });
                    }}
                    disabled={content.sales.trackTools.features.length <= 1}
                    className="text-xs text-muted-fg hover:text-red-600 disabled:opacity-40"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <Field label="Title">
                <TextInput
                  value={feature.title}
                  onChange={(v) => {
                    const features = [...content.sales.trackTools.features];
                    features[i] = { ...feature, title: v };
                    patch("sales", {
                      ...content.sales,
                      trackTools: { ...content.sales.trackTools, features },
                    });
                  }}
                />
              </Field>
              <Field label="Expandable caption">
                <TextInput
                  value={feature.desc}
                  onChange={(v) => {
                    const features = [...content.sales.trackTools.features];
                    features[i] = { ...feature, desc: v };
                    patch("sales", {
                      ...content.sales,
                      trackTools: { ...content.sales.trackTools, features },
                    });
                  }}
                  multiline
                  rows={2}
                />
              </Field>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            patch("sales", {
              ...content.sales,
              trackTools: {
                ...content.sales.trackTools,
                features: [
                  ...content.sales.trackTools.features,
                  { title: "", desc: "" },
                ],
              },
            })
          }
          className={smallButtonClass}
        >
          <Plus className="w-3.5 h-3.5" /> Add feature
        </button>
      </Section>

      {afterSalesTrackTools}

      <Section
        title="Sales — Starter Pack card"
        description="Dark-green signup card on the sales landing. Item names on the public page follow the Starter Pack CMS when that list is non-empty."
      >
        <Field label="Title" hint="Use a line break for the second heading line.">
          <TextInput
            value={content.sales.starterCard.title}
            onChange={(v) =>
              patch("sales", { ...content.sales, starterCard: { ...content.sales.starterCard, title: v } })
            }
            multiline
            rows={2}
          />
        </Field>
        <Field label="Description">
          <TextInput
            value={content.sales.starterCard.description}
            onChange={(v) =>
              patch("sales", {
                ...content.sales,
                starterCard: { ...content.sales.starterCard, description: v },
              })
            }
            multiline
          />
        </Field>
        <Field label="Fallback items" hint="One per line. Only used when the Starter Pack is empty — the public landing always prefers the live Starter Pack titles, so edits here usually have no visible effect.">
          <TextInput
            value={content.sales.starterCard.items.join("\n")}
            onChange={(v) =>
              patch("sales", {
                ...content.sales,
                starterCard: {
                  ...content.sales.starterCard,
                  items: v
                    .split("\n")
                    .map((s) => s.trim())
                    .filter(Boolean),
                },
              })
            }
            multiline
            rows={6}
          />
        </Field>
      </Section>

      <Section title="Sales — Team Licences" description="Light-green strip below testimonials on the sales landing">
        <Field label="Eyebrow">
          <TextInput
            value={content.sales.teamLicences.label}
            onChange={(v) =>
              patch("sales", { ...content.sales, teamLicences: { ...content.sales.teamLicences, label: v } })
            }
          />
        </Field>
        <Field label="Heading">
          <TextInput
            value={content.sales.teamLicences.heading}
            onChange={(v) =>
              patch("sales", {
                ...content.sales,
                teamLicences: { ...content.sales.teamLicences, heading: v },
              })
            }
          />
        </Field>
        <Field label="Body">
          <TextInput
            value={content.sales.teamLicences.body}
            onChange={(v) =>
              patch("sales", { ...content.sales, teamLicences: { ...content.sales.teamLicences, body: v } })
            }
            multiline
          />
        </Field>
      </Section>

      <Section title="Sales — Commercial Case (ROI)" description="Dark ROI section on sales track">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Eyebrow">
            <TextInput
              value={content.sales.roi.eyebrow}
              onChange={(v) => patch("sales", { ...content.sales, roi: { ...content.sales.roi, eyebrow: v } })}
            />
          </Field>
          <Field label="Title line 1">
            <TextInput
              value={content.sales.roi.title}
              onChange={(v) => patch("sales", { ...content.sales, roi: { ...content.sales.roi, title: v } })}
            />
          </Field>
          <Field label="Title accent">
            <TextInput
              value={content.sales.roi.titleAccent}
              onChange={(v) => patch("sales", { ...content.sales, roi: { ...content.sales.roi, titleAccent: v } })}
            />
          </Field>
        </div>
        <Field label="Description">
          <TextInput
            value={content.sales.roi.description}
            onChange={(v) => patch("sales", { ...content.sales, roi: { ...content.sales.roi, description: v } })}
            multiline
          />
        </Field>
        <Field label="Testimonial quote">
          <TextInput
            value={content.sales.roi.quote}
            onChange={(v) => patch("sales", { ...content.sales, roi: { ...content.sales.roi, quote: v } })}
            multiline
            rows={3}
          />
        </Field>
        <Field label="Quote author">
          <TextInput
            value={content.sales.roi.quoteAuthor}
            onChange={(v) => patch("sales", { ...content.sales, roi: { ...content.sales.roi, quoteAuthor: v } })}
          />
        </Field>
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-700">ROI stats</p>
          {content.sales.roi.stats.map((stat, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-2 p-3 rounded-lg bg-secondary/40">
              <TextInput
                value={stat.value}
                onChange={(v) => {
                  const stats = [...content.sales.roi.stats];
                  stats[i] = { ...stat, value: v };
                  patch("sales", { ...content.sales, roi: { ...content.sales.roi, stats } });
                }}
              />
              <TextInput
                value={stat.label}
                onChange={(v) => {
                  const stats = [...content.sales.roi.stats];
                  stats[i] = { ...stat, label: v };
                  patch("sales", { ...content.sales, roi: { ...content.sales.roi, stats } });
                }}
              />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Sales Pricing" description="Pro and Elite tiers on sales track">
        <div className="space-y-4">
          {content.sales.pricing.map((tier, i) => (
            <div key={`sales-pricing-${i}`} className="p-3 rounded-lg border border-border space-y-2">
              <p className="text-xs font-bold text-muted-fg uppercase">{tier.name}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <Field label="Price">
                  <TextInput
                    value={tier.price}
                    onChange={(v) => {
                      const pricing = [...content.sales.pricing];
                      pricing[i] = { ...tier, price: v };
                      patch("sales", { ...content.sales, pricing });
                    }}
                  />
                </Field>
                <Field label="Billing">
                  <TextInput
                    value={tier.billing}
                    onChange={(v) => {
                      const pricing = [...content.sales.pricing];
                      pricing[i] = { ...tier, billing: v };
                      patch("sales", { ...content.sales, pricing });
                    }}
                  />
                </Field>
                <Field label="CTA">
                  <TextInput
                    value={tier.cta}
                    onChange={(v) => {
                      const pricing = [...content.sales.pricing];
                      pricing[i] = { ...tier, cta: v };
                      patch("sales", { ...content.sales, pricing });
                    }}
                  />
                </Field>
              </div>
              {/* Sales spells the same flag `featured` — `pricing-page-client.tsx`
                  maps it to `highlight` when it adapts these tiers for the grid.
                  Two different field names for one badge; keep them in step. */}
              <label className="flex items-center gap-2 text-xs font-medium text-gray-600">
                <input
                  type="checkbox"
                  checked={Boolean(tier.featured)}
                  onChange={(e) => {
                    const pricing = [...content.sales.pricing];
                    pricing[i] = { ...tier, featured: e.target.checked };
                    patch("sales", { ...content.sales, pricing });
                  }}
                />
                Most Popular — show the badge on this tier
              </label>
              <Field label="Description">
                <TextInput
                  value={tier.description}
                  onChange={(v) => {
                    const pricing = [...content.sales.pricing];
                    pricing[i] = { ...tier, description: v };
                    patch("sales", { ...content.sales, pricing });
                  }}
                  multiline
                />
              </Field>
              <Field label="Features" hint="One per line">
                <FeaturesList
                  value={tier.features}
                  onChange={(features) => {
                    const pricing = [...content.sales.pricing];
                    pricing[i] = { ...tier, features };
                    patch("sales", { ...content.sales, pricing });
                  }}
                />
              </Field>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Who This Is For"
        description="Persona cards on the Sales Track landing page — category, title, description, and quote"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Section label">
            <TextInput
              value={content.sales.whoSection.label}
              onChange={(v) =>
                patch("sales", {
                  ...content.sales,
                  whoSection: { ...content.sales.whoSection, label: v },
                })
              }
            />
          </Field>
          <Field label="Section headline">
            <TextInput
              value={content.sales.whoSection.headline}
              onChange={(v) =>
                patch("sales", {
                  ...content.sales,
                  whoSection: { ...content.sales.whoSection, headline: v },
                })
              }
            />
          </Field>
        </div>
        <div className="space-y-4">
          {content.sales.whoCards.map((card, i) => (
            <div key={`${card.title}-${i}`} className="p-3 rounded-lg border border-border space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-muted-fg uppercase">Role card {i + 1}</p>
                <button
                  type="button"
                  onClick={() => {
                    if (content.sales.whoCards.length <= 1) return;
                    patch("sales", {
                      ...content.sales,
                      whoCards: content.sales.whoCards.filter((_, idx) => idx !== i),
                    });
                  }}
                  className="text-red-400 hover:text-red-600 p-1 shrink-0"
                  title="Remove card"
                  disabled={content.sales.whoCards.length <= 1}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Field label="Category label">
                  <TextInput
                    value={card.role}
                    onChange={(v) => {
                      const whoCards = [...content.sales.whoCards];
                      whoCards[i] = { ...card, role: v };
                      patch("sales", { ...content.sales, whoCards });
                    }}
                  />
                </Field>
                <Field label="Title">
                  <TextInput
                    value={card.title}
                    onChange={(v) => {
                      const whoCards = [...content.sales.whoCards];
                      whoCards[i] = { ...card, title: v };
                      patch("sales", { ...content.sales, whoCards });
                    }}
                  />
                </Field>
              </div>
              <Field label="Description">
                <TextInput
                  value={card.desc}
                  onChange={(v) => {
                    const whoCards = [...content.sales.whoCards];
                    whoCards[i] = { ...card, desc: v };
                    patch("sales", { ...content.sales, whoCards });
                  }}
                  multiline
                  rows={3}
                />
              </Field>
              <Field label="Testimonial quote">
                <TextInput
                  value={card.outcome}
                  onChange={(v) => {
                    const whoCards = [...content.sales.whoCards];
                    whoCards[i] = { ...card, outcome: v };
                    patch("sales", { ...content.sales, whoCards });
                  }}
                  multiline
                  rows={3}
                />
              </Field>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            patch("sales", {
              ...content.sales,
              whoCards: [
                ...content.sales.whoCards,
                { role: "", title: "", desc: "", outcome: "" },
              ],
            })
          }
          className={smallButtonClass}
        >
          <Plus className="w-3.5 h-3.5" /> Add role card
        </button>
      </Section>

      <Section
        title="Sales Feature Comparison"
        description="Pricing comparison table shown on the Sales Track landing page (Pro / Elite)"
      >
        <ComparisonTableEditor
          table={content.sales.comparison}
          onChange={(comparison) => patch("sales", { ...content.sales, comparison })}
          columns={[
            { key: "pro", label: "Pro" },
            { key: "elite", label: "Elite" },
          ]}
        />
      </Section>

      <Section title="Testimonials" description="Social proof cards on the Sales Track landing page">
        <Field label="Section eyebrow" hint="Optional — leave blank to show stars only">
          <TextInput
            value={content.salesTestimonials.eyebrow ?? ""}
            onChange={(v) =>
              patch("salesTestimonials", {
                ...content.salesTestimonials,
                eyebrow: v.trim() ? v : undefined,
              })
            }
          />
        </Field>
        <Field label="Section title">
          <TextInput
            value={content.salesTestimonials.title}
            onChange={(v) => patch("salesTestimonials", { ...content.salesTestimonials, title: v })}
          />
        </Field>
        <div className="space-y-4">
          {content.salesTestimonials.items.map((item, i) => (
            <div key={item.id} className="p-3 rounded-lg border border-border space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-muted-fg uppercase">Testimonial {i + 1}</p>
                <button
                  type="button"
                  onClick={() => {
                    if (content.salesTestimonials.items.length <= 1) return;
                    patch("salesTestimonials", {
                      ...content.salesTestimonials,
                      items: content.salesTestimonials.items.filter((_, idx) => idx !== i),
                    });
                  }}
                  className="text-red-400 hover:text-red-600 p-1 shrink-0"
                  title="Remove testimonial"
                  disabled={content.salesTestimonials.items.length <= 1}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <Field label="Quote">
                <TextInput
                  value={item.quote}
                  onChange={(v) => {
                    const items = [...content.salesTestimonials.items];
                    items[i] = { ...item, quote: v };
                    patch("salesTestimonials", { ...content.salesTestimonials, items });
                  }}
                  multiline
                  rows={3}
                />
              </Field>
              <div className="grid gap-2 sm:grid-cols-2">
                <Field label="Name">
                  <TextInput
                    value={item.name}
                    onChange={(v) => {
                      const items = [...content.salesTestimonials.items];
                      items[i] = { ...item, name: v };
                      patch("salesTestimonials", { ...content.salesTestimonials, items });
                    }}
                  />
                </Field>
                <Field label="Role / location">
                  <TextInput
                    value={item.role}
                    onChange={(v) => {
                      const items = [...content.salesTestimonials.items];
                      items[i] = { ...item, role: v };
                      patch("salesTestimonials", { ...content.salesTestimonials, items });
                    }}
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            patch("salesTestimonials", {
              ...content.salesTestimonials,
              items: [
                ...content.salesTestimonials.items,
                {
                  id: `sales-testimonial-${Date.now()}`,
                  quote: "",
                  name: "",
                  role: "",
                },
              ],
            })
          }
          className={smallButtonClass}
        >
          <Plus className="w-3.5 h-3.5" /> Add testimonial
        </button>
      </Section>
      </>
      )}

      <Section
        title={showCareer && showSales ? "Members Strip (shared)" : showCareer ? "Career Members Strip" : "Sales Members Strip"}
        description="Trusted-by company names in hero"
      >
        {showCareer && (
          <>
            {showSales && <p className="text-xs font-semibold text-gray-700 mb-2">Career track</p>}
            <Field label="Label">
              <TextInput
                value={content.careerMembersStrip.label}
                onChange={(v) =>
                  patch("careerMembersStrip", { ...content.careerMembersStrip, label: v })
                }
              />
            </Field>
            <Field label="Companies" hint="One company name per line">
              <FeaturesList
                value={content.careerMembersStrip.companies}
                onChange={(companies) =>
                  patch("careerMembersStrip", { ...content.careerMembersStrip, companies })
                }
              />
            </Field>
          </>
        )}
        {showSales && (
          <>
            {showCareer && <p className="text-xs font-semibold text-gray-700 mt-4 mb-2">Sales track</p>}
            <Field label="Label">
              <TextInput
                value={content.salesMembersStrip.label}
                onChange={(v) =>
                  patch("salesMembersStrip", { ...content.salesMembersStrip, label: v })
                }
              />
            </Field>
            <Field label="Companies" hint="One company name per line">
              <FeaturesList
                value={content.salesMembersStrip.companies}
                onChange={(companies) =>
                  patch("salesMembersStrip", { ...content.salesMembersStrip, companies })
                }
              />
            </Field>
          </>
        )}
      </Section>

      {showSales && (
        <Section
          title="Sales Track — Feature Sections"
          description="The three two-column sections on the sales landing: Market Nudges, Prep Library and Account Intelligence. The product panel beside each is a sample preview and is not editable here."
        >
          <div className="space-y-6">
            <div className="p-3 rounded-lg border border-border space-y-3">
              <p className="text-xs font-bold text-muted-fg uppercase">Sales Market Nudges</p>
              <TrackFeatureFields
                feature={content.salesFeatures.marketNudges}
                onChange={(next) =>
                  patch("salesFeatures", { ...content.salesFeatures, marketNudges: next })
                }
              />
            </div>
            <div className="p-3 rounded-lg border border-border space-y-3">
              <p className="text-xs font-bold text-muted-fg uppercase">Prep Library</p>
              <TrackFeatureFields
                feature={content.salesFeatures.prepLibrary}
                onChange={(next) =>
                  patch("salesFeatures", { ...content.salesFeatures, prepLibrary: next })
                }
              />
            </div>
            <div className="p-3 rounded-lg border border-border space-y-3">
              <p className="text-xs font-bold text-muted-fg uppercase">Account Intelligence</p>
              <TrackFeatureFields
                feature={content.salesFeatures.accountIntelligence}
                onChange={(next) =>
                  patch("salesFeatures", {
                    ...content.salesFeatures,
                    accountIntelligence: next,
                  })
                }
              />
            </div>
          </div>
        </Section>
      )}

      <Section
        title="Mentor Connect (both landing pages)"
        description="The “Ask the desk. Stay anonymous.” section and its interactive demo card. The same words appear on both tracks — only the accent colour differs."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Eyebrow">
            <TextInput
              value={content.mentorSection.eyebrow}
              onChange={(v) =>
                patch("mentorSection", { ...content.mentorSection, eyebrow: v })
              }
            />
          </Field>
          <Field label="Headline">
            <TextInput
              value={content.mentorSection.headline}
              onChange={(v) =>
                patch("mentorSection", { ...content.mentorSection, headline: v })
              }
            />
          </Field>
        </div>
        <Field label="Lede">
          <TextInput
            multiline
            value={content.mentorSection.lede}
            onChange={(v) => patch("mentorSection", { ...content.mentorSection, lede: v })}
          />
        </Field>

        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-700">Steps</p>
          {content.mentorSection.steps.map((step, i) => (
            <div key={`mentor-step-${i}`} className="p-3 rounded-lg border border-border space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-muted-fg uppercase">Step {i + 1}</p>
                <button
                  type="button"
                  onClick={() => {
                    if (content.mentorSection.steps.length <= 1) return;
                    patch("mentorSection", {
                      ...content.mentorSection,
                      steps: content.mentorSection.steps.filter((_, idx) => idx !== i),
                    });
                  }}
                  disabled={content.mentorSection.steps.length <= 1}
                  className="text-xs text-muted-fg hover:text-red-600 disabled:opacity-40"
                >
                  Remove
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-[80px_1fr]">
                <Field label="Number">
                  <TextInput
                    value={step.num}
                    onChange={(v) => {
                      const steps = [...content.mentorSection.steps];
                      steps[i] = { ...step, num: v };
                      patch("mentorSection", { ...content.mentorSection, steps });
                    }}
                  />
                </Field>
                <Field label="Title">
                  <TextInput
                    value={step.title}
                    onChange={(v) => {
                      const steps = [...content.mentorSection.steps];
                      steps[i] = { ...step, title: v };
                      patch("mentorSection", { ...content.mentorSection, steps });
                    }}
                  />
                </Field>
              </div>
              <Field label="Body">
                <TextInput
                  multiline
                  value={step.body}
                  onChange={(v) => {
                    const steps = [...content.mentorSection.steps];
                    steps[i] = { ...step, body: v };
                    patch("mentorSection", { ...content.mentorSection, steps });
                  }}
                />
              </Field>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              patch("mentorSection", {
                ...content.mentorSection,
                steps: [
                  ...content.mentorSection.steps,
                  {
                    num: String(content.mentorSection.steps.length + 1).padStart(2, "0"),
                    title: "",
                    body: "",
                  },
                ],
              })
            }
            className={smallButtonClass}
          >
            <Plus className="w-3.5 h-3.5" /> Add step
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Primary button" hint="Scrolls to the demo card">
            <TextInput
              value={content.mentorSection.primaryCta}
              onChange={(v) =>
                patch("mentorSection", { ...content.mentorSection, primaryCta: v })
              }
            />
          </Field>
          <Field label="Secondary link" hint="Goes to /pricing for this track">
            <TextInput
              value={content.mentorSection.secondaryCta}
              onChange={(v) =>
                patch("mentorSection", { ...content.mentorSection, secondaryCta: v })
              }
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Demo label">
            <TextInput
              value={content.mentorSection.demoHint}
              onChange={(v) => patch("mentorSection", { ...content.mentorSection, demoHint: v })}
            />
          </Field>
          <Field label="Demo footnote">
            <TextInput
              value={content.mentorSection.demoFoot}
              onChange={(v) => patch("mentorSection", { ...content.mentorSection, demoFoot: v })}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Roster title">
            <TextInput
              value={content.mentorSection.rosterTitle}
              onChange={(v) =>
                patch("mentorSection", { ...content.mentorSection, rosterTitle: v })
              }
            />
          </Field>
          <Field label="Roster subtitle">
            <TextInput
              value={content.mentorSection.rosterSub}
              onChange={(v) => patch("mentorSection", { ...content.mentorSection, rosterSub: v })}
            />
          </Field>
        </div>
        <Field label="Roster footnote">
          <TextInput
            multiline
            value={content.mentorSection.rosterNote}
            onChange={(v) => patch("mentorSection", { ...content.mentorSection, rosterNote: v })}
          />
        </Field>
        <Field label="Credit pill">
          <TextInput
            value={content.mentorSection.creditPill}
            onChange={(v) => patch("mentorSection", { ...content.mentorSection, creditPill: v })}
          />
        </Field>

        <Field label="Sample question" hint="Used by “Use a sample question” in the demo">
          <TextInput
            multiline
            value={content.mentorSection.sampleQuestion}
            onChange={(v) =>
              patch("mentorSection", { ...content.mentorSection, sampleQuestion: v })
            }
          />
        </Field>
        <Field label="Sample reply" hint="Shown as “What a reply looks like”">
          <TextInput
            multiline
            rows={5}
            value={content.mentorSection.sampleAnswer}
            onChange={(v) =>
              patch("mentorSection", { ...content.mentorSection, sampleAnswer: v })
            }
          />
        </Field>

        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-700">Mentors</p>
          {content.mentorSection.mentors.map((mentor, i) => (
            <div key={`mentor-${i}`} className="p-3 rounded-lg border border-border space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-muted-fg uppercase">Mentor {i + 1}</p>
                <button
                  type="button"
                  onClick={() => {
                    if (content.mentorSection.mentors.length <= 1) return;
                    patch("mentorSection", {
                      ...content.mentorSection,
                      mentors: content.mentorSection.mentors.filter((_, idx) => idx !== i),
                    });
                  }}
                  disabled={content.mentorSection.mentors.length <= 1}
                  className="text-xs text-muted-fg hover:text-red-600 disabled:opacity-40"
                >
                  Remove
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-[110px_100px_1fr]">
                <Field label="Ref">
                  <TextInput
                    value={mentor.id}
                    onChange={(v) => {
                      const mentors = [...content.mentorSection.mentors];
                      mentors[i] = { ...mentor, id: v };
                      patch("mentorSection", { ...content.mentorSection, mentors });
                    }}
                  />
                </Field>
                <Field label="Years">
                  <StatValueInput
                    value={mentor.years}
                    placeholder="Years"
                    onChange={(years) => {
                      const mentors = [...content.mentorSection.mentors];
                      mentors[i] = { ...mentor, years };
                      patch("mentorSection", { ...content.mentorSection, mentors });
                    }}
                  />
                </Field>
                <Field label="Title">
                  <TextInput
                    value={mentor.title}
                    onChange={(v) => {
                      const mentors = [...content.mentorSection.mentors];
                      mentors[i] = { ...mentor, title: v };
                      patch("mentorSection", { ...content.mentorSection, mentors });
                    }}
                  />
                </Field>
              </div>
              <Field label="Category">
                <TextInput
                  value={mentor.category}
                  onChange={(v) => {
                    const mentors = [...content.mentorSection.mentors];
                    mentors[i] = { ...mentor, category: v };
                    patch("mentorSection", { ...content.mentorSection, mentors });
                  }}
                />
              </Field>
              <Field label="Bio">
                <TextInput
                  multiline
                  value={mentor.bio}
                  onChange={(v) => {
                    const mentors = [...content.mentorSection.mentors];
                    mentors[i] = { ...mentor, bio: v };
                    patch("mentorSection", { ...content.mentorSection, mentors });
                  }}
                />
              </Field>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              patch("mentorSection", {
                ...content.mentorSection,
                mentors: [
                  ...content.mentorSection.mentors,
                  { id: "", years: 0, title: "", category: "", bio: "" },
                ],
              })
            }
            className={smallButtonClass}
          >
            <Plus className="w-3.5 h-3.5" /> Add mentor
          </button>
        </div>
      </Section>

      <Section
        title="Plans & Pricing Band (both landing pages)"
        description="The centered band that invites visitors to /pricing. One set of words for both tracks."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Eyebrow">
            <TextInput
              value={content.pricingCtaBand.eyebrow}
              onChange={(v) =>
                patch("pricingCtaBand", { ...content.pricingCtaBand, eyebrow: v })
              }
            />
          </Field>
          <Field label="Button">
            <TextInput
              value={content.pricingCtaBand.button}
              onChange={(v) =>
                patch("pricingCtaBand", { ...content.pricingCtaBand, button: v })
              }
            />
          </Field>
        </div>
        <Field label="Headline">
          <TextInput
            value={content.pricingCtaBand.title}
            onChange={(v) => patch("pricingCtaBand", { ...content.pricingCtaBand, title: v })}
          />
        </Field>
        <Field label="Description">
          <TextInput
            multiline
            value={content.pricingCtaBand.description}
            onChange={(v) =>
              patch("pricingCtaBand", { ...content.pricingCtaBand, description: v })
            }
          />
        </Field>
      </Section>
    </div>
  );
}
