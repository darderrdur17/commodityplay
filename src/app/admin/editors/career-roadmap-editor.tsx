"use client";

import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EditorField, EditorRow, UploadSection, inputClass, textareaClass } from "./shared";
import { SingleGuideUpload, type GuideAttachment } from "./single-guide-upload";
import {
  DEFAULT_FUNCTION_MATRIX_SECTION,
  DEFAULT_TIMELINE_SECTION,
  mergeCareerRoadmapHero,
  mergeCareerRoadmapBottomStrip,
  mergeCompBenchmarks,
  type CareerRoadmapBottomStrip,
  type CareerRoadmapPageHero,
  type CareerRoadmapSectionCopy,
} from "@/lib/content/career-roadmap-payload";
import {
  FUNCTION_MATRIX,
  TIMELINE_12_MONTH,
  type CompBenchmarks,
  type FunctionMatrixRow,
  type TimelineQuarter,
} from "@/data/career-roadmap-extras";

type RoleCategory = "front" | "ops" | "middle" | "adjacent";

interface CareerRole {
  id: number;
  slug: string;
  cat: RoleCategory;
  categoryLabel: string;
  title: string;
  tags: { label: string; variant: string }[];
  summary: string;
  difficulty: "low" | "med" | "high";
  timeline: string;
  firms: string;
  what: string;
  backgrounds: string[];
  redFlags: string[];
  comp: { label: string; range: string }[];
  upgrade: string;
}

function newRole(id: number): CareerRole {
  return {
    id,
    slug: "",
    cat: "front",
    categoryLabel: "Front Office",
    title: "New Role",
    tags: [],
    summary: "",
    difficulty: "med",
    timeline: "",
    firms: "",
    what: "",
    backgrounds: [],
    redFlags: [],
    comp: [
      { label: "Junior (0–3 yrs)", range: "" },
      { label: "Associate / AVP (3–6 yrs)", range: "" },
      { label: "VP / Director (6+ yrs)", range: "" },
    ],
    upgrade: "",
  };
}

type RoadmapPayload = {
  roles?: CareerRole[];
  careerNavigationGuide?: GuideAttachment | null;
  navigationGuides?: { id: string; label: string; fileName: string; assetId: string; track: "career" | "sales" | "both"; updatedAt: string }[];
  pageHero?: Partial<CareerRoadmapPageHero>;
  bottomStrip?: Partial<CareerRoadmapBottomStrip>;
  functionMatrix?: FunctionMatrixRow[];
  functionMatrixSection?: Partial<CareerRoadmapSectionCopy>;
  timeline12Month?: TimelineQuarter[];
  timelineSection?: Partial<CareerRoadmapSectionCopy>;
  compBenchmarks?: Partial<CompBenchmarks>;
  [key: string]: unknown;
};

type RoadmapTab = "roles" | "hero" | "bottom" | "matrix" | "plan" | "comp" | "navguide";

const ROADMAP_TABS: { id: RoadmapTab; label: string }[] = [
  { id: "roles", label: "Roles" },
  { id: "hero", label: "Top blue strip" },
  { id: "bottom", label: "Bottom blue strip" },
  { id: "matrix", label: "Function matrix" },
  { id: "plan", label: "12-month plan" },
  { id: "comp", label: "Comp benchmarks" },
  { id: "navguide", label: "Navigation PDF" },
];

export function CareerRoadmapEditor({
  payload,
  onChange,
  moduleSlug,
  requiredTier,
  initialTab = "roles",
}: {
  payload: unknown;
  onChange: (p: unknown) => void;
  moduleSlug: string;
  requiredTier: string;
  initialTab?: RoadmapTab;
}) {
  const [activeTab, setActiveTab] = useState<RoadmapTab>(initialTab);

  // Support both legacy array payload and object payload
  const isLegacyArray = Array.isArray(payload);
  const raw: RoadmapPayload = isLegacyArray
    ? { roles: payload as CareerRole[] }
    : ((payload as RoadmapPayload) ?? {});

  const items: CareerRole[] = raw.roles ?? [];

  function updateRaw(updates: Partial<RoadmapPayload>) {
    onChange({ ...raw, ...updates });
  }

  function patchItem(i: number, item: CareerRole) {
    const next = [...items];
    next[i] = item;
    updateRaw({ roles: next });
  }

  function deleteItem(i: number) {
    if (!confirm("Delete this role?")) return;
    updateRaw({ roles: items.filter((_, j) => j !== i) });
  }

  function addItem() {
    updateRaw({ roles: [...items, newRole(items.length + 1)] });
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-border pb-2 flex-wrap">
        {ROADMAP_TABS.map((tab) => (
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

      {activeTab === "navguide" && (
        <div className="space-y-4">
          <p className="text-xs text-muted-fg">
            PDF download on the Career Roadmap page and the member dashboard for <strong>Career track</strong> Pro
            and Elite members — not the same as the free footer Career Guide.
          </p>
          <SingleGuideUpload
            guide={raw.careerNavigationGuide ?? null}
            onChange={(g) => updateRaw({ careerNavigationGuide: g })}
            moduleSlug={moduleSlug}
            requiredTier={requiredTier}
            assetKey="career-roadmap/career-navigation-guide"
            defaultLabel="Career Navigation Guide"
          />
        </div>
      )}

      {activeTab === "hero" && (() => {
        const hero = mergeCareerRoadmapHero(raw.pageHero);
        return (
          <div className="space-y-4">
            <p className="text-xs font-semibold text-gray-900">Page hero strip</p>
            <p className="text-xs text-muted-fg">
              Navy banner at the top of <strong>/career-roadmap</strong>. Use <code>{"{roleCount}"}</code> in the
              description or a stat number to insert the live role count.
            </p>
            <EditorField label="Eyebrow">
              <input className={inputClass} value={hero.eyebrow} onChange={(e) => updateRaw({ pageHero: { ...hero, eyebrow: e.target.value } })} />
            </EditorField>
            <div className="grid gap-3 sm:grid-cols-2">
              <EditorField label="Title">
                <input className={inputClass} value={hero.title} onChange={(e) => updateRaw({ pageHero: { ...hero, title: e.target.value } })} />
              </EditorField>
              <EditorField label="Title accent (italic)">
                <input className={inputClass} value={hero.titleAccent} onChange={(e) => updateRaw({ pageHero: { ...hero, titleAccent: e.target.value } })} />
              </EditorField>
            </div>
            <EditorField label="Description">
              <textarea className={textareaClass} value={hero.description} onChange={(e) => updateRaw({ pageHero: { ...hero, description: e.target.value } })} />
            </EditorField>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-700">Stat cards</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateRaw({ pageHero: { ...hero, stats: [...hero.stats, { num: "", label: "" }] } })}
                >
                  <Plus className="w-3.5 h-3.5" /> Add stat
                </Button>
              </div>
              {hero.stats.map((stat, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    className={cn(inputClass, "w-28")}
                    value={stat.num}
                    placeholder="Value"
                    onChange={(e) => {
                      const stats = [...hero.stats];
                      stats[i] = { ...stat, num: e.target.value };
                      updateRaw({ pageHero: { ...hero, stats } });
                    }}
                  />
                  <input
                    className={inputClass}
                    value={stat.label}
                    placeholder="Label"
                    onChange={(e) => {
                      const stats = [...hero.stats];
                      stats[i] = { ...stat, label: e.target.value };
                      updateRaw({ pageHero: { ...hero, stats } });
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => updateRaw({ pageHero: { ...hero, stats: hero.stats.filter((_, j) => j !== i) } })}
                    className="text-red-400 hover:text-red-600 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {activeTab === "bottom" && (() => {
        const strip = mergeCareerRoadmapBottomStrip(raw.bottomStrip);
        return (
          <div className="space-y-4">
            <p className="text-xs font-semibold text-gray-900">Page hero strip</p>
            <p className="text-xs text-muted-fg">
              Navy rounded card at the bottom of <strong>/career-roadmap</strong> — kicker, title, description, and CTA
              buttons (not the top stats hero). Optional hrefs default to /interview-questions and /resume-templates.
            </p>
            <EditorField label="Kicker / eyebrow">
              <input
                className={inputClass}
                value={strip.eyebrow}
                onChange={(e) => updateRaw({ bottomStrip: { ...strip, eyebrow: e.target.value } })}
              />
            </EditorField>
            <EditorField label="Title">
              <input
                className={inputClass}
                value={strip.title}
                onChange={(e) => updateRaw({ bottomStrip: { ...strip, title: e.target.value } })}
              />
            </EditorField>
            <EditorField label="Description">
              <textarea
                className={textareaClass}
                value={strip.description}
                onChange={(e) => updateRaw({ bottomStrip: { ...strip, description: e.target.value } })}
              />
            </EditorField>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-700">Buttons</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    updateRaw({
                      bottomStrip: { ...strip, buttons: [...strip.buttons, { label: "", href: "/" }] },
                    })
                  }
                >
                  <Plus className="w-3.5 h-3.5" /> Add button
                </Button>
              </div>
              {strip.buttons.map((btn, i) => (
                <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] items-center">
                  <input
                    className={inputClass}
                    value={btn.label}
                    placeholder="Label"
                    onChange={(e) => {
                      const buttons = [...strip.buttons];
                      buttons[i] = { ...btn, label: e.target.value };
                      updateRaw({ bottomStrip: { ...strip, buttons } });
                    }}
                  />
                  <input
                    className={inputClass}
                    value={btn.href}
                    placeholder="/interview-questions"
                    onChange={(e) => {
                      const buttons = [...strip.buttons];
                      buttons[i] = { ...btn, href: e.target.value };
                      updateRaw({ bottomStrip: { ...strip, buttons } });
                    }}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      updateRaw({
                        bottomStrip: { ...strip, buttons: strip.buttons.filter((_, j) => j !== i) },
                      })
                    }
                    className="text-red-400 hover:text-red-600 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {activeTab === "matrix" && (() => {
        const section = { ...DEFAULT_FUNCTION_MATRIX_SECTION, ...raw.functionMatrixSection };
        const rows = raw.functionMatrix?.length ? raw.functionMatrix : FUNCTION_MATRIX;
        return (
          <div className="space-y-4">
            <EditorField label="Eyebrow">
              <input className={inputClass} value={section.eyebrow ?? ""} onChange={(e) => updateRaw({ functionMatrixSection: { ...section, eyebrow: e.target.value } })} />
            </EditorField>
            <EditorField label="Title">
              <input className={inputClass} value={section.title ?? ""} onChange={(e) => updateRaw({ functionMatrixSection: { ...section, title: e.target.value } })} />
            </EditorField>
            <EditorField label="Description">
              <textarea className={textareaClass} value={section.description ?? ""} onChange={(e) => updateRaw({ functionMatrixSection: { ...section, description: e.target.value } })} />
            </EditorField>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-fg">{rows.length} rows</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  updateRaw({
                    functionMatrix: [...rows, { role: "", difficulty: "", category: "", pathToDesk: "", keySkills: "" }],
                  })
                }
              >
                <Plus className="w-3.5 h-3.5" /> Add row
              </Button>
            </div>
            {rows.map((row, i) => (
              <EditorRow
                key={`${row.role}-${i}`}
                summary={<span className="font-medium">{row.role || "(untitled role)"}</span>}
                onDelete={() => updateRaw({ functionMatrix: rows.filter((_, j) => j !== i) })}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  {(["role", "difficulty", "category", "pathToDesk", "keySkills"] as const).map((field) => (
                    <EditorField key={field} label={field === "pathToDesk" ? "Path to desk" : field === "keySkills" ? "Key skills" : field}>
                      <input
                        className={inputClass}
                        value={row[field]}
                        onChange={(e) => {
                          const next = [...rows];
                          next[i] = { ...row, [field]: e.target.value };
                          updateRaw({ functionMatrix: next });
                        }}
                      />
                    </EditorField>
                  ))}
                </div>
              </EditorRow>
            ))}
          </div>
        );
      })()}

      {activeTab === "plan" && (() => {
        const section = { ...DEFAULT_TIMELINE_SECTION, ...raw.timelineSection };
        const quarters = raw.timeline12Month?.length ? raw.timeline12Month : TIMELINE_12_MONTH;
        return (
          <div className="space-y-4">
            <EditorField label="Eyebrow">
              <input className={inputClass} value={section.eyebrow ?? ""} onChange={(e) => updateRaw({ timelineSection: { ...section, eyebrow: e.target.value } })} />
            </EditorField>
            <EditorField label="Title">
              <input className={inputClass} value={section.title ?? ""} onChange={(e) => updateRaw({ timelineSection: { ...section, title: e.target.value } })} />
            </EditorField>
            <EditorField label="Description">
              <textarea className={textareaClass} value={section.description ?? ""} onChange={(e) => updateRaw({ timelineSection: { ...section, description: e.target.value } })} />
            </EditorField>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-fg">{quarters.length} quarters</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateRaw({ timeline12Month: [...quarters, { quarter: "", title: "", items: [] }] })}
              >
                <Plus className="w-3.5 h-3.5" /> Add quarter
              </Button>
            </div>
            {quarters.map((q, i) => (
              <EditorRow
                key={`${q.quarter}-${i}`}
                summary={<span className="font-medium">{q.quarter || q.title || "(untitled quarter)"}</span>}
                onDelete={() => updateRaw({ timeline12Month: quarters.filter((_, j) => j !== i) })}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <EditorField label="Quarter">
                    <input className={inputClass} value={q.quarter} onChange={(e) => {
                      const next = [...quarters];
                      next[i] = { ...q, quarter: e.target.value };
                      updateRaw({ timeline12Month: next });
                    }} />
                  </EditorField>
                  <EditorField label="Title">
                    <input className={inputClass} value={q.title} onChange={(e) => {
                      const next = [...quarters];
                      next[i] = { ...q, title: e.target.value };
                      updateRaw({ timeline12Month: next });
                    }} />
                  </EditorField>
                </div>
                <EditorField label="Items" hint="One action per line">
                  <textarea
                    className={textareaClass}
                    value={(q.items ?? []).join("\n")}
                    onChange={(e) => {
                      const next = [...quarters];
                      next[i] = { ...q, items: e.target.value.split("\n").filter(Boolean) };
                      updateRaw({ timeline12Month: next });
                    }}
                  />
                </EditorField>
              </EditorRow>
            ))}
          </div>
        );
      })()}

      {activeTab === "comp" && (() => {
        const comp = mergeCompBenchmarks(raw.compBenchmarks);
        return (
          <div className="space-y-4">
            <EditorField label="Eyebrow">
              <input className={inputClass} value={comp.eyebrow} onChange={(e) => updateRaw({ compBenchmarks: { ...comp, eyebrow: e.target.value } })} />
            </EditorField>
            <EditorField label="Title">
              <input className={inputClass} value={comp.title} onChange={(e) => updateRaw({ compBenchmarks: { ...comp, title: e.target.value } })} />
            </EditorField>
            <EditorField label="Description">
              <textarea className={textareaClass} value={comp.description} onChange={(e) => updateRaw({ compBenchmarks: { ...comp, description: e.target.value } })} />
            </EditorField>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-fg">{comp.cards.length} cards</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateRaw({ compBenchmarks: { ...comp, cards: [...comp.cards, { role: "", range: "", note: "" }] } })}
              >
                <Plus className="w-3.5 h-3.5" /> Add card
              </Button>
            </div>
            {comp.cards.map((card, i) => (
              <EditorRow
                key={`${card.role}-${i}`}
                summary={<span className="font-medium">{card.role || "(untitled)"}</span>}
                onDelete={() => updateRaw({ compBenchmarks: { ...comp, cards: comp.cards.filter((_, j) => j !== i) } })}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <EditorField label="Role">
                    <input className={inputClass} value={card.role} onChange={(e) => {
                      const cards = [...comp.cards];
                      cards[i] = { ...card, role: e.target.value };
                      updateRaw({ compBenchmarks: { ...comp, cards } });
                    }} />
                  </EditorField>
                  <EditorField label="Range">
                    <input className={inputClass} value={card.range} onChange={(e) => {
                      const cards = [...comp.cards];
                      cards[i] = { ...card, range: e.target.value };
                      updateRaw({ compBenchmarks: { ...comp, cards } });
                    }} />
                  </EditorField>
                </div>
                <EditorField label="Note">
                  <input className={inputClass} value={card.note} onChange={(e) => {
                    const cards = [...comp.cards];
                    cards[i] = { ...card, note: e.target.value };
                    updateRaw({ compBenchmarks: { ...comp, cards } });
                  }} />
                </EditorField>
              </EditorRow>
            ))}
            <EditorField label="Footnote">
              <textarea className={textareaClass} value={comp.footnote} onChange={(e) => updateRaw({ compBenchmarks: { ...comp, footnote: e.target.value } })} />
            </EditorField>
          </div>
        );
      })()}


      {activeTab === "roles" && <>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-fg">{items.length} roles</p>
        <Button variant="outline" size="sm" onClick={addItem}>
          <Plus className="w-3.5 h-3.5" /> Add role
        </Button>
      </div>

      <div className="space-y-2">
        {items.map((item, i) => (
          <EditorRow
            key={item.id}
            summary={
              <span>
                <span className="font-medium">{item.title}</span>
                <span className="ml-2 text-xs text-muted-fg">{item.categoryLabel}</span>
              </span>
            }
            onDelete={() => deleteItem(i)}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <EditorField label="Title">
                <input className={inputClass} value={item.title} onChange={(e) => patchItem(i, { ...item, title: e.target.value })} />
              </EditorField>
              <EditorField label="Category">
                <select className={inputClass} value={item.cat} onChange={(e) => {
                  const cat = e.target.value as RoleCategory;
                  const labels: Record<RoleCategory, string> = { front: "Front Office", ops: "Operations", middle: "Middle Office", adjacent: "Adjacent" };
                  patchItem(i, { ...item, cat, categoryLabel: labels[cat] });
                }}>
                  <option value="front">Front Office</option>
                  <option value="ops">Operations</option>
                  <option value="middle">Middle Office</option>
                  <option value="adjacent">Adjacent</option>
                </select>
              </EditorField>
              <EditorField label="Difficulty">
                <select className={inputClass} value={item.difficulty} onChange={(e) => patchItem(i, { ...item, difficulty: e.target.value as CareerRole["difficulty"] })}>
                  <option value="low">Low</option>
                  <option value="med">Medium</option>
                  <option value="high">High</option>
                </select>
              </EditorField>
              <EditorField label="Timeline">
                <input className={inputClass} value={item.timeline} onChange={(e) => patchItem(i, { ...item, timeline: e.target.value })} />
              </EditorField>
            </div>
            <EditorField label="Summary">
              <textarea className={textareaClass} value={item.summary} onChange={(e) => patchItem(i, { ...item, summary: e.target.value })} />
            </EditorField>
            <EditorField label="What you do">
              <textarea className={textareaClass} value={item.what} onChange={(e) => patchItem(i, { ...item, what: e.target.value })} />
            </EditorField>
            <EditorField label="Firms">
              <input className={inputClass} value={item.firms} onChange={(e) => patchItem(i, { ...item, firms: e.target.value })} />
            </EditorField>
            <EditorField label="Backgrounds" hint="One per line">
              <textarea className={textareaClass} value={(item.backgrounds ?? []).join("\n")} onChange={(e) => patchItem(i, { ...item, backgrounds: e.target.value.split("\n").filter(Boolean) })} />
            </EditorField>
            <EditorField label="Red flags" hint="One per line">
              <textarea className={textareaClass} value={(item.redFlags ?? []).join("\n")} onChange={(e) => patchItem(i, { ...item, redFlags: e.target.value.split("\n").filter(Boolean) })} />
            </EditorField>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-700">Compensation benchmarks (SGD)</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    patchItem(i, {
                      ...item,
                      comp: [...(item.comp ?? []), { label: "", range: "" }],
                    })
                  }
                >
                  <Plus className="w-3.5 h-3.5" /> Add tier
                </Button>
              </div>
              {(item.comp ?? []).map((tier, ti) => (
                <div key={ti} className="flex items-center gap-2">
                  <input
                    className={inputClass}
                    value={tier.label}
                    placeholder="Tier label (e.g. Junior analyst)"
                    onChange={(e) => {
                      const comp = [...(item.comp ?? [])];
                      comp[ti] = { ...tier, label: e.target.value };
                      patchItem(i, { ...item, comp });
                    }}
                  />
                  <input
                    className={inputClass}
                    value={tier.range}
                    placeholder="Range (e.g. SGD 75–120k)"
                    onChange={(e) => {
                      const comp = [...(item.comp ?? [])];
                      comp[ti] = { ...tier, range: e.target.value };
                      patchItem(i, { ...item, comp });
                    }}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      patchItem(i, {
                        ...item,
                        comp: (item.comp ?? []).filter((_, j) => j !== ti),
                      })
                    }
                    className="text-red-400 hover:text-red-600 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <EditorField label="Upgrade path">
              <textarea className={textareaClass} value={item.upgrade} onChange={(e) => patchItem(i, { ...item, upgrade: e.target.value })} />
            </EditorField>
          </EditorRow>
        ))}
        {items.length === 0 && (
          <p className="text-center text-sm text-muted-fg py-8">No roles yet.</p>
        )}
      </div>

      <UploadSection moduleSlug={moduleSlug} requiredTier={requiredTier} />
      </>}
    </div>
  );
}
