"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BookOpen, ArrowRight } from "lucide-react";
import { BrandedSearchInput } from "@/components/brand/logo";
import {
  GLOSSARY_TERMS,
  GLOSSARY_CATEGORIES,
  GLOSSARY_CATEGORY_BADGES,
  type GlossaryTerm,
} from "@/data/glossary";
import { getPersonaGlossaryGuide } from "@/data/glossary-persona";
import { PERSONA_LABELS } from "@/lib/utils";
import { Reveal } from "@/components/animations";
import { Button } from "@/components/ui/button";

const CATEGORY_COLORS: Record<string, string> = {
  "Physical markets": "#3280ff",
  "Pricing & Derivatives": "#0040f5",
  "Risk & P&L": "#B45309",
  "Operations & Scheduling": "#0F766E",
  "Shipping": "#115cff",
  "Gas & LNG": "#0131cc",
  "Oil & Products": "#0830a0",
  "Metals & Mining": "#5B21B6",
  "Market Intelligence & Analytics": "#9A3412",
};

const CATEGORY_BADGE_BG: Record<string, string> = {
  "Physical markets": "#e1f5ee",
  "Pricing & Derivatives": "#eeedfe",
  "Risk & P&L": "#faeeda",
  "Operations & Scheduling": "#faece7",
  "Shipping": "#e2e8f0",
  "Gas & LNG": "#e6f1fb",
  "Oil & Products": "#fcebe5",
  "Metals & Mining": "#eef0f2",
  "Market Intelligence & Analytics": "#eaf3de",
};

export function GlossaryClient({
  terms = GLOSSARY_TERMS,
  persona = null,
}: {
  terms?: GlossaryTerm[];
  persona?: string | null;
}) {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const [search, setSearch] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState<string>("All");

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) setSearch(q);
  }, [searchParams]);
  const personaGuide = getPersonaGlossaryGuide(persona);
  const personaLabel = persona ? PERSONA_LABELS[persona]?.label : null;

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cat of GLOSSARY_CATEGORIES) counts[cat] = 0;
    terms.forEach((t) => {
      counts[t.category] = (counts[t.category] ?? 0) + 1;
    });
    return counts;
  }, [terms]);

  const filtered = useMemo(() => {
    return terms.filter((t) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        t.term.toLowerCase().includes(q) ||
        t.definition.toLowerCase().includes(q) ||
        (t.context?.toLowerCase().includes(q) ?? false);
      const matchesCategory = activeCategory === "All" || t.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategory, terms]);

  const groupedByCategory = useMemo(() => {
    const order =
      activeCategory === "All"
        ? [...GLOSSARY_CATEGORIES]
        : [activeCategory as (typeof GLOSSARY_CATEGORIES)[number]];

    return order
      .map((category) => ({
        category,
        items: filtered.filter((t) => t.category === category),
      }))
      .filter((g) => g.items.length > 0);
  }, [filtered, activeCategory]);

  return (
    <div className="page-container py-8 sm:py-10">
      <section className="rounded-2xl bg-primary-800 px-6 sm:px-8 py-10 sm:py-12 mb-8 relative overflow-hidden">
        <div
          className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #3280ff 0%, transparent 70%)" }}
        />
        <Reveal className="relative z-10">
          <div className="pill pill-dark mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            Free Resource — Starter Pack
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-3">The Desk Glossary</h1>
          <p className="text-white/65 text-base sm:text-lg max-w-xl">
            Commodity trading terms, explained the way a senior trader would actually explain them to a new hire on day
            one — not Wikipedia definitions.
          </p>
          <div className="flex items-center gap-3 mt-6 flex-wrap">
            {[
              "Terms",
              `${GLOSSARY_CATEGORIES.length} Categories`,
              "Trader explanations throughout",
              "Always updated",
            ].map((label) => (
              <div key={label} className="glass-card px-4 py-2.5 text-white text-sm font-semibold">
                {label}
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {personaGuide && personaLabel ? (
        <Reveal className="mb-8 rounded-xl border border-primary-line bg-primary-soft/40 px-5 py-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-primary-800 mb-1">
            Recommended for {personaLabel}
          </p>
          <p className="font-semibold text-gray-900 text-sm mb-1">{personaGuide.headline}</p>
          <p className="text-sm text-muted-fg leading-relaxed mb-3">{personaGuide.tip}</p>
          <div className="flex flex-wrap gap-2">
            {personaGuide.priorityCategories.map((cat) => {
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                    active
                      ? "bg-primary-800 text-white border-primary-800"
                      : "bg-white text-primary-800 border-primary-line hover:border-primary-800"
                  }`}
                >
                  {GLOSSARY_CATEGORY_BADGES[cat] ?? cat}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setActiveCategory("All")}
              className="px-3 py-1 rounded-full text-xs font-semibold border border-border text-muted-fg hover:text-gray-900"
            >
              Browse all terms
            </button>
          </div>
        </Reveal>
      ) : null}

      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-sm border-y border-border py-4 mb-10 -mx-4 px-4 sm:-mx-6 sm:px-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
            {(["All", ...GLOSSARY_CATEGORIES] as const).map((cat) => {
              const count = cat === "All" ? terms.length : categoryCounts[cat] ?? 0;
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                    active
                      ? "bg-primary-800 text-white border-primary-800"
                      : "bg-white text-muted-fg border-border hover:border-primary-line hover:text-primary-800"
                  }`}
                >
                  {cat === "All" ? "All" : GLOSSARY_CATEGORY_BADGES[cat] ?? cat}
                  <span className={active ? "opacity-80 ml-1" : "opacity-60 ml-1"}>{count}</span>
                </button>
              );
            })}
          </div>
          <BrandedSearchInput
            variant="light"
            placeholder="Search terms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            wrapperClassName="w-full lg:w-52 lg:shrink-0"
          />
        </div>
        <p className="text-xs text-muted-fg mt-3">
          {filtered.length === terms.length
            ? `Showing all ${terms.length} terms across ${GLOSSARY_CATEGORIES.length} categories`
            : `${filtered.length} of ${terms.length} terms`}
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-8 h-8 text-muted-fg mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No terms found</p>
          <p className="text-sm text-muted-fg mt-1">Try a different search term or category.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {groupedByCategory.map(({ category, items }) => (
            <section key={category}>
              <div className="flex items-baseline gap-3 pb-3 mb-1 border-b border-border">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary-400">
                  {category}
                </h2>
                <span className="text-xs text-muted-fg">
                  {items.length} term{items.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="divide-y divide-border">
                {items.map((term) => (
                  <TermRow key={term.term} term={term} search={search} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <section className="mt-16 rounded-2xl bg-primary-800 px-6 sm:px-8 py-10 sm:py-12 relative overflow-hidden">
        <div
          className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #3280ff 0%, transparent 70%)" }}
        />
        <Reveal className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-xl">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-3">
              Ready to go <span className="text-accent italic">deeper</span>?
            </h2>
            <p className="text-white/65 text-base leading-relaxed">
              The Desk Glossary is just the start. The full Playbook covers commodity market mechanics, desk structure,
              career roadmaps, and deal teardowns — with the same practitioner voice throughout.
            </p>
          </div>
          <Link href="/signup?plan=pro" className="flex-shrink-0">
            <Button size="lg" variant="primary-dark" className="whitespace-nowrap">
              Get the Playbook <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </Reveal>
      </section>
    </div>
  );
}

function highlightText(text: string, query: string) {
  if (!query.trim()) return text;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="bg-primary-soft rounded-sm px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

function TermRow({ term, search }: { term: GlossaryTerm; search: string }) {
  const color = CATEGORY_COLORS[term.category] || "#677184";
  const badgeBg = CATEGORY_BADGE_BG[term.category] || "#f2f4f7";
  const badgeLabel = GLOSSARY_CATEGORY_BADGES[term.category] ?? term.category;

  return (
    <article className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-3 md:gap-6 py-4 sm:py-[13px] hover:bg-muted/60 md:hover:-mx-4 md:hover:px-4 rounded-lg transition-colors">
      <div>
        <p className="font-semibold text-gray-900 text-[13.5px] leading-snug mb-2">
          {highlightText(term.term, search)}
        </p>
        <span
          className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide"
          style={{ background: badgeBg, color }}
        >
          {badgeLabel}
        </span>
      </div>
      <div className="min-w-0">
        <p className="text-[13.5px] text-gray-800 leading-relaxed mb-2">
          {highlightText(term.definition, search)}
        </p>
        {term.context ? (
          <p className="text-[12.5px] text-muted-fg italic leading-relaxed pl-3 border-l-2 border-primary-line">
            <span className="block text-[10px] font-bold uppercase tracking-widest not-italic text-primary-800 mb-1">
              Trader explanation
            </span>
            {highlightText(term.context, search)}
          </p>
        ) : null}
      </div>
    </article>
  );
}
