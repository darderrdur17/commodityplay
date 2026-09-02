"use client";

import React, { useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_GLOSSARY_HERO,
  DEFAULT_GLOSSARY_UPGRADE_CTA,
  type GlossaryHero,
  type GlossaryUpgradeCta,
} from "@/data/glossary-content";
import { cn } from "@/lib/utils";
import { EditorField, EditorRow, UploadSection, inputClass, textareaClass } from "./shared";

interface GlossaryTerm {
  id?: string;
  term: string;
  definition: string;
  context?: string;
  category: string;
}

interface GlossaryPayload {
  terms: GlossaryTerm[];
  hero?: Partial<GlossaryHero>;
  upgradeCta?: Partial<GlossaryUpgradeCta>;
}

function newTerm(): GlossaryTerm {
  return { term: "", definition: "", category: "General" };
}

function HeroTab({ data, onChange }: { data: GlossaryPayload; onChange: (d: GlossaryPayload) => void }) {
  const stored = data.hero ?? {};
  const defaults = DEFAULT_GLOSSARY_HERO;

  function fieldValue(key: keyof GlossaryHero): string {
    const value = stored[key];
    if (typeof value === "string") return value;
    return defaults[key] as string;
  }

  function statChips(): string[] {
    if (Array.isArray(stored.statChips)) return stored.statChips;
    return defaults.statChips;
  }

  function patch(updates: Partial<GlossaryHero>) {
    onChange({ ...data, hero: { ...stored, ...updates } });
  }

  function patchChip(i: number, value: string) {
    const next = [...statChips()];
    next[i] = value;
    patch({ statChips: next });
  }

  function addChip() {
    patch({ statChips: [...statChips(), ""] });
  }

  function removeChip(i: number) {
    patch({ statChips: statChips().filter((_, j) => j !== i) });
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-fg">
        Top blue hero strip on <strong>/glossary</strong> — eyebrow pill, headline, description, and stat chips.
      </p>
      <EditorField label="Eyebrow pill">
        <input className={inputClass} value={fieldValue("eyebrow")} onChange={(e) => patch({ eyebrow: e.target.value })} />
      </EditorField>
      <EditorField label="Title">
        <input className={inputClass} value={fieldValue("title")} onChange={(e) => patch({ title: e.target.value })} />
      </EditorField>
      <EditorField label="Description">
        <textarea className={textareaClass} value={fieldValue("description")} onChange={(e) => patch({ description: e.target.value })} />
      </EditorField>
      <EditorField label="Stat chips">
        <div className="space-y-2">
          {statChips().map((chip, i) => (
            <div key={i} className="flex gap-2">
              <input
                className={cn(inputClass, "flex-1")}
                value={chip}
                placeholder={i === 0 ? "Terms (renders as “{count} Terms”)" : "Chip label"}
                onChange={(e) => patchChip(i, e.target.value)}
              />
              <Button type="button" variant="outline" size="sm" onClick={() => removeChip(i)}>
                Remove
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addChip}>
            Add chip
          </Button>
        </div>
      </EditorField>
    </div>
  );
}

function UpgradeCtaTab({ data, onChange }: { data: GlossaryPayload; onChange: (d: GlossaryPayload) => void }) {
  const stored = data.upgradeCta ?? {};
  const defaults = DEFAULT_GLOSSARY_UPGRADE_CTA;

  function fieldValue(key: keyof GlossaryUpgradeCta): string {
    const value = stored[key];
    if (typeof value === "string") return value;
    return defaults[key];
  }

  function patch(updates: Partial<GlossaryUpgradeCta>) {
    onChange({ ...data, upgradeCta: { ...stored, ...updates } });
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-fg">
        Bottom blue CTA strip on <strong>/glossary</strong>. The accent word renders in italic (e.g. &ldquo;deeper&rdquo;).
      </p>
      <EditorField label="Title prefix">
        <input className={inputClass} value={fieldValue("titlePrefix")} onChange={(e) => patch({ titlePrefix: e.target.value })} />
      </EditorField>
      <EditorField label="Title accent (italic)">
        <input className={inputClass} value={fieldValue("titleAccent")} onChange={(e) => patch({ titleAccent: e.target.value })} />
      </EditorField>
      <EditorField label="Title suffix">
        <input className={inputClass} value={fieldValue("titleSuffix")} onChange={(e) => patch({ titleSuffix: e.target.value })} />
      </EditorField>
      <EditorField label="Description">
        <textarea className={textareaClass} value={fieldValue("description")} onChange={(e) => patch({ description: e.target.value })} />
      </EditorField>
      <EditorField label="Button label">
        <input className={inputClass} value={fieldValue("buttonLabel")} onChange={(e) => patch({ buttonLabel: e.target.value })} />
      </EditorField>
      <EditorField label="Button link">
        <input className={inputClass} value={fieldValue("buttonHref")} onChange={(e) => patch({ buttonHref: e.target.value })} />
      </EditorField>
    </div>
  );
}

const TABS = [
  { id: "terms", label: "Terms" },
  { id: "hero", label: "Hero strip" },
  { id: "upgrade", label: "Bottom CTA" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function GlossaryEditor({
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
  const data = payload as GlossaryPayload ?? { terms: [] };
  const terms: GlossaryTerm[] = Array.isArray(payload) ? (payload as GlossaryTerm[]) : (data.terms ?? []);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabId>("terms");

  function patchPayload(next: GlossaryPayload) {
    if (Array.isArray(payload)) onChange({ terms: next.terms, hero: next.hero, upgradeCta: next.upgradeCta });
    else onChange(next);
  }

  function patchTerms(nextTerms: GlossaryTerm[]) {
    patchPayload({ ...data, terms: nextTerms });
  }

  function patchTerm(i: number, t: GlossaryTerm) {
    const next = [...terms];
    next[i] = t;
    patchTerms(next);
  }

  function deleteTerm(i: number) {
    patchTerms(terms.filter((_, j) => j !== i));
  }

  function addTerm() {
    patchTerms([...terms, newTerm()]);
  }

  const filtered = terms
    .map((t, i) => ({ t, i }))
    .filter(({ t }) =>
      !search ||
      t.term.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
              activeTab === tab.id
                ? "bg-primary-400 text-white"
                : "bg-white text-muted-fg border border-border hover:border-primary-line"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "hero" && (
        <HeroTab data={{ ...data, terms }} onChange={patchPayload} />
      )}

      {activeTab === "upgrade" && (
        <UpgradeCtaTab data={{ ...data, terms }} onChange={patchPayload} />
      )}

      {activeTab === "terms" && (
        <>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-fg" />
              <input
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                placeholder="Search terms..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" onClick={addTerm}>
              <Plus className="w-3.5 h-3.5" /> Add term
            </Button>
          </div>

          <p className="text-xs text-muted-fg">{terms.length} terms total · showing {filtered.length}</p>

          <div className="space-y-2">
            {filtered.map(({ t, i }) => (
              <EditorRow
                key={i}
                summary={
                  <span>
                    <span className="font-medium">{t.term || "(untitled)"}</span>
                    {t.category && <span className="ml-2 text-xs text-muted-fg">{t.category}</span>}
                  </span>
                }
                onDelete={() => deleteTerm(i)}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <EditorField label="Term">
                    <input className={inputClass} value={t.term} onChange={(e) => patchTerm(i, { ...t, term: e.target.value })} />
                  </EditorField>
                  <EditorField label="Category">
                    <input className={inputClass} value={t.category} onChange={(e) => patchTerm(i, { ...t, category: e.target.value })} />
                  </EditorField>
                </div>
                <EditorField label="Definition">
                  <textarea className={textareaClass} value={t.definition} onChange={(e) => patchTerm(i, { ...t, definition: e.target.value })} />
                </EditorField>
                <EditorField label="Context (optional)">
                  <textarea className={textareaClass} value={t.context ?? ""} onChange={(e) => patchTerm(i, { ...t, context: e.target.value })} />
                </EditorField>
              </EditorRow>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-sm text-muted-fg py-8">No terms match your search.</p>
            )}
          </div>
        </>
      )}

      <UploadSection moduleSlug={moduleSlug} requiredTier={requiredTier} />
    </div>
  );
}
