"use client";

import React, { useMemo, useState, useEffect } from "react";
import { ChevronDown, MessageSquare, Lightbulb, AlertTriangle } from "lucide-react";
import { BrandedSearchInput } from "@/components/brand/logo";
import { LibraryFreshnessStrip } from "@/components/library-freshness-strip";
import { TierGate } from "@/components/tier-gate";
import { Reveal } from "@/components/animations";
import {
  INTERVIEW_QUESTIONS,
  INTERVIEW_CATEGORIES,
  INTERVIEW_TABS,
  INTERVIEW_DIFFICULTIES,
  DEFAULT_INTERVIEW_QUESTIONS_HERO,
  formatInterviewHeroCopy,
  type InterviewQuestion,
  type InterviewTab,
  type InterviewTabMeta,
  type InterviewDifficulty,
  type InterviewQuestionsHeroCopy,
} from "@/data/interview-questions";
import {
  countNewThisMonth,
  formatInterviewMemberDate,
  getBankLastRefreshedIso,
  getCurrentMarketUpdatedIso,
  getQuestionFreshnessBadge,
  selectCurrentMarketQuestions,
  type InterviewFreshnessBadge,
} from "@/lib/content/interview-questions-freshness";

interface Props {
  userTier: string;
  questions?: InterviewQuestion[];
  categories?: string[];
  tabs?: InterviewTabMeta[];
  requiredTier?: "PRO" | "ELITE";
  hero?: InterviewQuestionsHeroCopy;
  lastRefreshed?: string;
}

const TAB_LABELS: Record<InterviewTab, string> = {
  technical: "Technical",
  commercial: "Commercial judgement",
  behavioural: "Behavioural",
  elimination: "Elimination questions",
};

function FreshnessBadge({ badge }: { badge: InterviewFreshnessBadge | null }) {
  if (!badge) return null;
  if (badge === "new") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        New
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 shrink-0">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
      Revisit
    </span>
  );
}

function QuestionCard({
  q,
  isOpen,
  reviewed,
  onToggle,
  compact,
}: {
  q: InterviewQuestion;
  isOpen: boolean;
  reviewed: boolean;
  onToggle: () => void;
  compact?: boolean;
}) {
  const badge = getQuestionFreshnessBadge(q);
  return (
    <div className={`overflow-hidden ${compact ? "bg-transparent" : "rounded-xl border border-border bg-white"}`}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-start gap-3 p-5 text-left hover:bg-secondary/40 transition-colors"
      >
        {!compact && <MessageSquare className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />}
        <div className="flex-1 min-w-0">
          {!compact && (
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <p className="text-xs text-muted-fg">{q.category}</p>
              {q.difficulty && (
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  q.difficulty === "easy" ? "bg-green-50 text-green-700"
                    : q.difficulty === "med" ? "bg-amber-50 text-amber-800"
                      : "bg-red-50 text-red-700"
                }`}>
                  {q.difficulty}
                </span>
              )}
              {reviewed && (
                <span className="text-[10px] text-primary-400 font-semibold">Reviewed</span>
              )}
            </div>
          )}
          <p className="font-medium text-gray-900 pr-2">{q.question}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <FreshnessBadge badge={badge} />
          <ChevronDown className={`w-5 h-5 text-muted-fg flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </button>
      {isOpen && (
        <div className="px-5 pb-5 border-t border-border pt-4 ml-8 space-y-4">
          {q.tab === "elimination" ? (
            <>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-red-600 mb-2">Weak answer</p>
                <p className="text-sm text-gray-600 italic">{q.weakAnswer}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-green-700 mb-2">Strong answer</p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{q.modelAnswer}</p>
              </div>
              {q.why && (
                <div className="flex gap-2 text-sm bg-amber-50 text-amber-900 rounded-lg p-3">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span><strong>Why this filters:</strong> {q.why}</span>
                </div>
              )}
            </>
          ) : (
            <>
              {q.framework && q.tab !== "behavioural" && (
                <div className="text-sm bg-primary-soft text-primary-900 rounded-lg p-3">
                  <strong>Framework:</strong> {q.framework}
                </div>
              )}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-fg mb-2">Model answer</p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{q.modelAnswer}</p>
              </div>
              {q.interviewTip && q.tab === "technical" && (
                <div className="flex gap-2 text-sm bg-amber-50 text-amber-900 rounded-lg p-3">
                  <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span><strong>Desk signal:</strong> {q.interviewTip}</span>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function InterviewQuestionsClient({
  userTier,
  questions = INTERVIEW_QUESTIONS,
  categories = INTERVIEW_CATEGORIES,
  tabs = INTERVIEW_TABS,
  requiredTier = "PRO",
  hero = DEFAULT_INTERVIEW_QUESTIONS_HERO,
  lastRefreshed,
}: Props) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [activeTab, setActiveTab] = useState<InterviewTab>("technical");
  const [difficulty, setDifficulty] = useState<InterviewDifficulty | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [openedIds, setOpenedIds] = useState<Set<string>>(new Set());

  const tabQuestions = useMemo(
    () => questions.filter((q) => q.tab === activeTab),
    [questions, activeTab]
  );

  const filtered = useMemo(() => {
    return tabQuestions.filter((q) => {
      const matchCat = category === "All" || q.category === category;
      const matchDiff = difficulty === "all" || q.difficulty === difficulty || q.tab !== "technical";
      const matchSearch =
        !search ||
        q.question.toLowerCase().includes(search.toLowerCase()) ||
        q.modelAnswer.toLowerCase().includes(search.toLowerCase()) ||
        (q.framework?.toLowerCase().includes(search.toLowerCase()) ?? false);
      return matchCat && matchDiff && matchSearch;
    });
  }, [search, category, difficulty, tabQuestions, activeTab]);

  const tabOpened = useMemo(() => {
    return tabQuestions.filter((q) => openedIds.has(q.id)).length;
  }, [tabQuestions, openedIds]);

  const progressPct = tabQuestions.length
    ? Math.round((tabOpened / tabQuestions.length) * 100)
    : 0;

  useEffect(() => {
    setCategory("All");
    setDifficulty("all");
    setOpenId(null);
  }, [activeTab]);

  function toggleQuestion(id: string) {
    setOpenId((prev) => (prev === id ? null : id));
    setOpenedIds((prev) => new Set(prev).add(id));
  }

  const tabCategories = useMemo(() => {
    const cats = new Set(tabQuestions.map((q) => q.category));
    return ["All", ...Array.from(cats)];
  }, [tabQuestions]);

  const lastRefreshedLabel = formatInterviewMemberDate(getBankLastRefreshedIso(questions, lastRefreshed));
  const newThisMonth = countNewThisMonth(questions);
  const currentMarketQuestions = useMemo(
    () => (activeTab === "commercial" ? selectCurrentMarketQuestions(questions) : []),
    [questions, activeTab]
  );
  const currentMarketUpdatedLabel = formatInterviewMemberDate(
    getCurrentMarketUpdatedIso(currentMarketQuestions)
  );
  const currentMarketIds = useMemo(
    () => new Set(currentMarketQuestions.map((q) => q.id)),
    [currentMarketQuestions]
  );
  const fullBankQuestions = useMemo(
    () =>
      activeTab === "commercial"
        ? filtered.filter((q) => !currentMarketIds.has(q.id))
        : filtered,
    [activeTab, filtered, currentMarketIds]
  );

  return (
    <div className="page-container py-8 sm:py-10">
      <section className="rounded-2xl bg-primary-800 px-6 sm:px-8 py-10 mb-8 relative overflow-hidden">
        <Reveal className="relative z-10">
          <div className="pill pill-dark mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            {formatInterviewHeroCopy(hero.eyebrow, questions.length)}
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-3">
            {formatInterviewHeroCopy(hero.title, questions.length)}
          </h1>
          <p className="text-white/65 text-base sm:text-lg max-w-xl mb-6">
            {formatInterviewHeroCopy(hero.description, questions.length)}
          </p>
          <BrandedSearchInput
            variant="dark"
            placeholder={hero.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Reveal>
      </section>

      <TierGate requiredTier={requiredTier} userTier={userTier}>
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-border pb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-primary-800 text-white"
                  : "bg-secondary text-muted-fg hover:bg-gray-200"
              }`}
            >
              {TAB_LABELS[tab.id] || tab.label}{" "}
              <span className="opacity-70">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Progress */}
        <div className="mb-6 rounded-xl border border-border bg-white p-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium text-gray-900">{TAB_LABELS[activeTab]} progress</span>
            <span className="text-muted-fg">{tabOpened} / {tabQuestions.length} reviewed</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-400 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <LibraryFreshnessStrip
          lastRefreshedLabel={lastRefreshedLabel}
          newThisMonth={newThisMonth}
          total={questions.length}
          className="mb-6"
        />

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {tabCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                category === cat
                  ? "bg-primary-400 text-white border-primary-400"
                  : "bg-white text-gray-700 border-border hover:border-primary-line"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {activeTab === "technical" && (
          <div className="flex flex-wrap gap-2 mb-6">
            {INTERVIEW_DIFFICULTIES.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDifficulty(d.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  difficulty === d.id
                    ? "bg-primary-800 text-white border-primary-800"
                    : "bg-white text-gray-700 border-border"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        )}

        <p className="text-sm text-muted-fg mb-4">
          {activeTab === "commercial" ? "Commercial awareness" : TAB_LABELS[activeTab]}
          {" · "}
          {filtered.length} of {tabQuestions.length} in this tab
        </p>

        {activeTab === "commercial" && currentMarketQuestions.length > 0 && (
          <div className="mb-8">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-fg mb-2">
              Current market — refreshed monthly
            </p>
            <div className="rounded-xl border border-sky-200 bg-sky-50/80 overflow-hidden divide-y divide-sky-100">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between px-5 py-3">
                <p className="text-sm font-semibold text-sky-950">Tied to current market landscape</p>
                {currentMarketUpdatedLabel && (
                  <p className="text-xs text-sky-800/80">Updated {currentMarketUpdatedLabel}</p>
                )}
              </div>
              {currentMarketQuestions.map((q) => (
                <QuestionCard
                  key={q.id}
                  q={q}
                  compact
                  isOpen={openId === q.id}
                  reviewed={openedIds.has(q.id)}
                  onToggle={() => toggleQuestion(q.id)}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === "commercial" && (
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-fg mb-2">Full bank</p>
        )}

        <div className="space-y-3">
          {fullBankQuestions.map((q) => (
            <QuestionCard
              key={q.id}
              q={q}
              isOpen={openId === q.id}
              reviewed={openedIds.has(q.id)}
              onToggle={() => toggleQuestion(q.id)}
            />
          ))}
        </div>
      </TierGate>
    </div>
  );
}
