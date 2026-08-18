"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, MessageSquare, ThumbsUp, Check, ArrowRight } from "lucide-react";
import { BrandedSearchInput } from "@/components/brand/logo";
import { DESK_CATEGORIES, DESK_QA, type DeskCategory, type DeskQA } from "@/data/desk-channel";
import { TierGate } from "@/components/tier-gate";
import { Reveal } from "@/components/animations";
import { Button } from "@/components/ui/button";
import { BRAND_NAME } from "@/lib/brand";

interface Props {
  userTier: string;
  categories?: typeof DESK_CATEGORIES;
  questions?: DeskQA[];
  requiredTier?: "PRO" | "ELITE";
}

export function DeskChannelClient({
  userTier,
  categories = DESK_CATEGORIES,
  questions = DESK_QA,
  requiredTier = "ELITE",
}: Props) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<DeskCategory | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);

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

  const deskSegmentCount = categories.filter((c) => c.id !== "all").length;

  const content = (
    <div className="page-container py-8 sm:py-10">
      {/* Hero */}
      <section className="rounded-2xl bg-primary-800 px-6 sm:px-8 py-10 mb-8 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #3280ff 0%, transparent 70%)" }} />
        <Reveal className="relative z-10">
          <div className="pill pill-dark mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            Elite · The Desk Channel
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-3">
            Questions Answered by{" "}
            <span className="text-accent italic">People Who&apos;ve Been There.</span>
          </h1>
          <p className="text-white/65 text-base sm:text-lg max-w-xl mb-6">
            {questions.length} questions across {deskSegmentCount} categories — answered by vetted practitioners and the {BRAND_NAME} editorial team. Search the library. Can&apos;t find yours? Submit it below.
          </p>
          <BrandedSearchInput
            variant="dark"
            placeholder="Search — e.g. 'crack spread', 'JKM', 'demurrage', 'career switch'"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Reveal>
      </section>

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
          <div className="hidden lg:block mt-6 p-4 rounded-xl bg-primary-800 text-white">
            <p className="font-serif font-bold text-sm mb-1">Can&apos;t find your question?</p>
            <p className="text-xs text-white/60 mb-3">Submit a question to vetted practitioners.</p>
            <Link href="#ask-practitioner">
              <Button size="sm" variant="primary-dark" className="w-full">
                Ask a Question →
              </Button>
            </Link>
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
              <button onClick={() => { setSearch(""); setCategory("all"); }} className="text-sm text-primary-400 mt-2">
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
                            <div className="flex items-start gap-3 p-3 rounded-lg text-sm bg-primary-soft border border-primary-line">
                              <div>
                                <p className="font-semibold text-gray-800">{q.author}</p>
                                <p className="text-xs text-muted-fg">{q.authorRole}</p>
                              </div>
                            </div>

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

      {/* Ask a Practitioner — bottom section */}
      <section id="ask-practitioner" className="mt-12 rounded-2xl bg-primary-800 p-8 relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-accent mb-3">Submit a Question</p>
            <h2 className="font-serif text-2xl font-bold text-white mb-3">
              Can&apos;t find what you&apos;re <span className="text-accent italic">looking for?</span>
            </h2>
            <p className="text-white/65 text-sm leading-relaxed mb-4">
              Submit your question and a vetted practitioner or our editorial team will respond within 5 business days.
            </p>
            <ul className="space-y-2 text-sm text-white/70">
              <li className="flex items-start gap-2"><Check className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" /> One question per submission — specific is better than broad</li>
              <li className="flex items-start gap-2"><Check className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" /> Elite members · answered within 5 business days</li>
            </ul>
          </div>
          <div className="bg-white rounded-xl p-6">
            <h3 className="font-serif font-bold text-gray-900 mb-1">Ask a Practitioner</h3>
            <p className="text-xs text-muted-fg mb-4">Elite members · Answered within 5 business days</p>
            <Link href="/mentor-connect">
              <Button className="w-full" size="lg">
                Go to Mentor Connect <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );

  return (
    <TierGate requiredTier={requiredTier} userTier={userTier} compact>
      {content}
    </TierGate>
  );
}
