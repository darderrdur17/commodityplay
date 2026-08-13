"use client";

import React, { useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
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
}

function newTerm(): GlossaryTerm {
  return { term: "", definition: "", category: "General" };
}

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
  const terms: GlossaryTerm[] = Array.isArray(data) ? (data as GlossaryTerm[]) : (data.terms ?? []);
  const [search, setSearch] = useState("");

  function patch(terms: GlossaryTerm[]) {
    if (Array.isArray(payload)) onChange(terms);
    else onChange({ ...data, terms });
  }

  function patchTerm(i: number, t: GlossaryTerm) {
    const next = [...terms];
    next[i] = t;
    patch(next);
  }

  function deleteTerm(i: number) {
    patch(terms.filter((_, j) => j !== i));
  }

  function addTerm() {
    patch([...terms, newTerm()]);
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

      <UploadSection moduleSlug={moduleSlug} requiredTier={requiredTier} />
    </div>
  );
}
