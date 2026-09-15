"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, ThumbsUp, Check, ArrowRight } from "lucide-react";
import { BrandedSearchInput } from "@/components/brand/logo";
import { LibraryFreshnessStrip } from "@/components/library-freshness-strip";
import { DESK_CATEGORIES, DESK_QA, type DeskCategory, type DeskQA } from "@/data/desk-channel";
import { getDeskLibraryFreshness } from "@/lib/content/desk-channel-freshness";
import {
  DEFAULT_DESK_CHANNEL_PAGE_COPY,
  type DeskChannelPageCopy,
} from "@/data/desk-channel-content";
import { TierGate } from "@/components/tier-gate";
import { Reveal } from "@/components/animations";
import { Button } from "@/components/ui/button";
import { ContactModal } from "@/components/landing/contact-modal";

interface Props {
  userTier: string;
  categories?: typeof DESK_CATEGORIES;
  questions?: DeskQA[];
  pageCopy?: DeskChannelPageCopy;
  requiredTier?: "PRO" | "ELITE";
  lastRefreshed?: string;
}

export function DeskChannelClient({
  userTier,
  categories = DESK_CATEGORIES,
  questions = DESK_QA,
  pageCopy = DEFAULT_DESK_CHANNEL_PAGE_COPY,
  requiredTier = "ELITE",
  lastRefreshed,
}: Props) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<DeskCategory | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const freshness = useMemo(
    () => getDeskLibraryFreshness(questions, lastRefreshed),
    [questions, lastRefreshed]
  );

  const filtered = useMemo(() => {
    return questions.filter((q) => {
      const matchCat = category === "all" || q.category === category;
      const matchSearch =
        !search ||
        q.question.toLowerCase().includes(search.toLowerCase()) ||
        q.answer.toLowerCase().includes(search.toLowerCase()) ||
        q.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [search, category, questions]);

  return (
    <div className="page-container py-8 sm:py-10">
      {/* Hero — always visible (Mentor Connect pattern) */}
      <section className="rounded-2xl bg-primary-800 px-6 sm:px-8 py-10 mb-8 relative overflow-hidden">
        <div
          className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #3280ff 0%, transparent 70%)" }}
        />
        <Reveal className="relative z-10">
          <div className="pill pill-dark mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            {pageCopy.hero.badge}
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-3">
            {pageCopy.hero.headline}{" "}
            {pageCopy.hero.headlineAccent ? (
              <span className="text-accent italic">{pageCopy.hero.headlineAccent}</span>
            ) : null}
          </h1>
          <p className="text-white/65 text-base sm:text-lg max-w-xl mb-6">{pageCopy.hero.description}</p>
          <BrandedSearchInput
            variant="dark"
            placeholder={pageCopy.hero.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Reveal>
      </section>

      <TierGate requiredTier={requiredTier} userTier={userTier}>
      <LibraryFreshnessStrip
        lastRefreshedLabel={freshness.lastRefreshedLabel}
        newThisMonth={freshness.newThisMonth}
        total={freshness.total}
        className="mb-8"
      />
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar categories */}
        <aside className="lg:w-56 flex-shrink-0">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-fg mb-3 hidden lg:block">
            Categories
          </p>
          <div className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id as DeskCategory | "all")}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  category === cat.id
                    ? "bg-primary-soft text-primary-800 border border-primary-line"
                    : "bg-white text-muted-fg border border-border hover:border-primary-line"
                }`}
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                {cat.label}
                <span className="ml-auto text-xs font-mono opacity-60 hidden lg:inline">{cat.count}</span>
              </button>
            ))}
          </div>
          <div className="mt-6 p-4 rounded-xl bg-primary-800 text-white">
            <p className="font-serif font-bold text-sm mb-1">Can&apos;t find your question?</p>
            <p className="text-xs text-white/60 mb-3">
              Feel free to submit the question/s over for our review.
            </p>
            <Button
              size="sm"
              variant="primary-dark"
              className="w-full"
              type="button"
              onClick={() => setContactOpen(true)}
            >
              Ask a Question →
            </Button>
          </div>
        </aside>

        {/* Q&A list */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-fg mb-4">
            Showing <span className="font-semibold text-primary-400">{filtered.length}</span> questions
          </p>

          {filtered.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-dashed border-border">
              <p className="text-gray-600 font-medium">No questions match your search</p>
              <button
                onClick={() => {
                  setSearch("");
                  setCategory("all");
                }}
                className="text-sm text-primary-400 mt-2"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {filtered.map((q) => (
                  <motion.div
                    key={q.id}
                    layout
                    className="bg-white rounded-xl border border-border overflow-hidden hover:border-primary-line transition-colors"
                  >
                    <button
                      className="w-full text-left p-4 sm:p-5 flex items-start gap-3"
                      onClick={() => setOpenId(openId === q.id ? null : q.id)}
                    >
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono flex-shrink-0 mt-0.5"
                        style={{ background: `${q.categoryColor}15`, color: q.categoryColor }}
                      >
                        Q
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span
                            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                            style={{ background: `${q.categoryColor}12`, color: q.categoryColor }}
                          >
                            {q.categoryLabel.split(" & ")[0]}
                          </span>
                        </div>
                        <p className="font-serif font-semibold text-gray-900 text-sm sm:text-base leading-snug">
                          {q.question}
                        </p>
                      </div>
                      {openId === q.id ? (
                        <ChevronUp className="w-5 h-5 text-muted-fg flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-fg flex-shrink-0" />
                      )}
                    </button>

                    <AnimatePresence>
                      {openId === q.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden border-t border-border"
                        >
                          <div className="p-4 sm:p-5 sm:pl-14 space-y-4">
                            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                              {q.answer}
                            </div>

                            {q.deskSignal && (
                              <div className="bg-primary-soft border border-primary-line rounded-lg p-4 text-sm">
                                <p className="text-primary-800/80 text-[10px] font-mono font-bold uppercase tracking-widest mb-1.5">
                                  // The Desk Implication
                                </p>
                                <p className="text-primary-900 leading-relaxed">{q.deskSignal}</p>
                              </div>
                            )}

                            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                              <div className="flex flex-wrap gap-1.5">
                                {q.tags.map((tag) => (
                                  <span key={tag} className="px-2 py-0.5 rounded bg-secondary text-xs text-muted-fg">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-fg">
                                <ThumbsUp className="w-3.5 h-3.5" /> Helpful · {q.helpful}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Ask a Practitioner — bottom blue section */}
      <section id="ask-practitioner" className="mt-12 rounded-2xl bg-primary-800 p-8 relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-accent mb-3">
              {pageCopy.submit.eyebrow}
            </p>
            <h2 className="font-serif text-2xl font-bold text-white mb-3">
              {pageCopy.submit.headline}{" "}
              {pageCopy.submit.headlineAccent ? (
                <span className="text-accent italic">{pageCopy.submit.headlineAccent}</span>
              ) : null}
            </h2>
            <p className="text-white/65 text-sm leading-relaxed mb-4">{pageCopy.submit.description}</p>
            <ul className="space-y-2 text-sm text-white/70">
              {pageCopy.submit.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" /> {bullet}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white rounded-xl p-6">
            <h3 className="font-serif font-bold text-gray-900 mb-1">{pageCopy.submit.formTitle}</h3>
            <p className="text-xs text-muted-fg mb-4">{pageCopy.submit.formSubtitle}</p>
            <Link href={pageCopy.submit.formHref}>
              <Button className="w-full" size="lg">
                {pageCopy.submit.formButton} <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
      </TierGate>
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </div>
  );
}
