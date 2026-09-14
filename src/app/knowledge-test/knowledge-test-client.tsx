"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle, XCircle, ArrowRight, BarChart3, Calendar } from "lucide-react";
import { TierGate } from "@/components/tier-gate";
import { Reveal } from "@/components/animations";
import { Button } from "@/components/ui/button";
import { KNOWLEDGE_TEST, scoreKnowledgeTest, type KnowledgeQuestion } from "@/data/knowledge-test";
import {
  DEFAULT_KNOWLEDGE_TEST_HERO,
  formatKnowledgeTestHeroCopy,
  formatKnowledgeTestReleaseCopy,
  groupUpcomingKnowledgeTestSetsByWeek,
  memberKnowledgeTestHeroVars,
  type KnowledgeTestHeroCopy,
  type UpcomingKnowledgeTestSet,
} from "@/lib/content/knowledge-test-payload";
import type { KnowledgeTestStoredResult } from "@/lib/content/knowledge-test-results";

export type MemberKnowledgeTestSet = {
  id: string;
  label: string;
  questions: KnowledgeQuestion[];
};

type SetAttempt = {
  answers: Record<string, number>;
  submitted: boolean;
};

interface Props {
  userTier: string;
  questions?: KnowledgeQuestion[];
  activeSetLabel?: string;
  liveSets?: MemberKnowledgeTestSet[];
  upcomingSets?: UpcomingKnowledgeTestSet[];
  initialResults?: Record<string, KnowledgeTestStoredResult>;
  requiredTier?: "PRO" | "ELITE";
  hero?: KnowledgeTestHeroCopy;
}

const ATTEMPT_STORAGE_KEY = "cp-knowledge-test-attempts-v1";

function readStoredAttempts(): Record<string, SetAttempt> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(ATTEMPT_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, SetAttempt>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStoredAttempts(next: Record<string, SetAttempt>) {
  try {
    window.localStorage.setItem(ATTEMPT_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore quota / private mode
  }
}

export function KnowledgeTestClient({
  userTier,
  questions = KNOWLEDGE_TEST,
  activeSetLabel,
  liveSets,
  upcomingSets = [],
  initialResults,
  requiredTier = "PRO",
  hero = DEFAULT_KNOWLEDGE_TEST_HERO,
}: Props) {
  const sets = useMemo<MemberKnowledgeTestSet[]>(() => {
    if (Array.isArray(liveSets)) return liveSets;
    return [{ id: "default", label: activeSetLabel || "Default bank", questions }];
  }, [liveSets, questions, activeSetLabel]);

  const [selectedId, setSelectedId] = useState(sets[0]?.id ?? "default");
  const [attempts, setAttempts] = useState<Record<string, SetAttempt>>({});
  const hydratedRef = useRef(false);

  useEffect(() => {
    const stored = readStoredAttempts();
    const merged: Record<string, SetAttempt> = { ...stored };
    if (initialResults) {
      for (const [setId, row] of Object.entries(initialResults)) {
        merged[setId] = {
          answers: Object.keys(row.answers).length ? row.answers : stored[setId]?.answers ?? {},
          submitted: true,
        };
      }
    }
    setAttempts(merged);
    writeStoredAttempts(merged);
    if (!hydratedRef.current) {
      hydratedRef.current = true;
      const firstOpen = sets.find((s) => !merged[s.id]?.submitted);
      if (firstOpen) setSelectedId(firstOpen.id);
    }
  }, [initialResults, sets]);

  useEffect(() => {
    if (!sets.some((s) => s.id === selectedId)) {
      setSelectedId(sets[0]?.id ?? "default");
    }
  }, [sets, selectedId]);

  const selected = sets.find((s) => s.id === selectedId) ?? sets[0];
  const selectedQuestions = selected?.questions ?? [];
  const attempt = attempts[selected?.id ?? ""] ?? { answers: {}, submitted: false };
  const answers = attempt.answers;
  const submitted = attempt.submitted;

  function patchAttempt(setId: string, next: SetAttempt) {
    setAttempts((prev) => {
      const merged = { ...prev, [setId]: next };
      writeStoredAttempts(merged);
      return merged;
    });
  }

  const result = submitted ? scoreKnowledgeTest(answers, selectedQuestions) : null;
  const completedCount = sets.filter((s) => attempts[s.id]?.submitted).length;
  const nextFreshSet = sets.find((s) => s.id !== selected?.id && !attempts[s.id]?.submitted);
  const heroVars = memberKnowledgeTestHeroVars(sets);
  const eyebrow = formatKnowledgeTestHeroCopy(hero.eyebrow, heroVars);
  const title = formatKnowledgeTestHeroCopy(hero.title, heroVars);
  const description = formatKnowledgeTestHeroCopy(hero.description, heroVars);

  function selectAnswer(qId: string, index: number) {
    if (submitted || !selected) return;
    patchAttempt(selected.id, { answers: { ...answers, [qId]: index }, submitted: false });
  }

  const allAnswered = selectedQuestions.length > 0 && selectedQuestions.every((q) => answers[q.id] !== undefined);

  function openSet(id: string) {
    setSelectedId(id);
  }

  const otherLiveSets = sets.filter((s) => s.id !== selected?.id);
  const upcomingWeeks = groupUpcomingKnowledgeTestSetsByWeek(upcomingSets);
  const showAvailablePicker = sets.length > 1 || upcomingSets.length > 0;

  return (
    <div className="page-container py-8 sm:py-10 max-w-2xl">
      <section className="rounded-2xl bg-primary-800 px-6 sm:px-8 py-10 mb-8 relative overflow-hidden">
        <Reveal className="relative z-10">
          <div className="pill pill-dark mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            {eyebrow}
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-3">{title}</h1>
          <p className="text-white/65 text-base sm:text-lg">
            {description}
          </p>
        </Reveal>
      </section>

      <TierGate requiredTier={requiredTier} userTier={userTier}>
        {(showAvailablePicker || upcomingSets.length > 0) && (
          <div className="mb-6 space-y-4">
            {showAvailablePicker && (
              <div className="rounded-xl border border-border bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-fg mb-2">Available now</p>
                {sets.length > 0 ? (
                  <>
                    <p className="text-sm text-muted-fg mb-3">
                      {completedCount} of {sets.length} completed. Finish one, then take another fresh set.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {sets.map((set) => {
                        const done = Boolean(attempts[set.id]?.submitted);
                        const active = set.id === selected?.id;
                        return (
                          <button
                            key={set.id}
                            type="button"
                            onClick={() => openSet(set.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                              active
                                ? "bg-primary-800 text-white border-primary-800"
                                : "bg-white text-gray-800 border-border hover:border-primary-line"
                            }`}
                          >
                            {set.label}
                            {done ? " · done" : ""}
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-fg">No published sets to take yet. Upcoming banks are listed below.</p>
                )}
              </div>
            )}

            {upcomingSets.length > 0 && (
              <div className="rounded-xl border border-dashed border-border bg-secondary/30 p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-fg mb-1">Upcoming</p>
                <p className="text-sm text-muted-fg mb-3">
                  Scheduled banks you can see ahead of time. They open when Frances publishes them — you cannot start them yet.
                </p>
                <div className="space-y-4">
                  {upcomingWeeks.map((week) => (
                    <div key={week.weekStartIso}>
                      <p className="text-[11px] font-semibold text-gray-800 mb-2">{week.weekLabel}</p>
                      <ul className="space-y-2">
                        {week.sets.map((set, index) => (
                          <li
                            key={`${set.id}-${set.releaseDate}-${index}`}
                            className="flex items-start gap-2 rounded-lg border border-border bg-white px-3 py-2"
                          >
                            <Calendar className="w-3.5 h-3.5 text-muted-fg mt-0.5 shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{set.label}</p>
                              <p className="text-xs text-muted-fg">
                                {formatKnowledgeTestReleaseCopy(set.releaseDate) ?? "Release date set"}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {selectedQuestions.length === 0 ? (
          <p className="text-sm text-muted-fg">No published knowledge tests yet.</p>
        ) : !submitted ? (
          <>
            {sets.length > 1 && selected && (
              <p className="text-sm text-muted-fg mb-4">
                Taking <span className="font-semibold text-gray-900">{selected.label}</span> · {selectedQuestions.length} questions
              </p>
            )}
            <div className="space-y-6 mb-8">
              {selectedQuestions.map((q, qi) => (
                <div key={q.id} className="rounded-xl border border-border bg-white p-5">
                  <p className="text-xs text-muted-fg mb-1">Question {qi + 1} · {q.topic}</p>
                  <p className="font-medium text-gray-900 mb-4">{q.question}</p>
                  <div className="space-y-2">
                    {q.options.map((opt, oi) => (
                      <button
                        key={oi}
                        type="button"
                        onClick={() => selectAnswer(q.id, oi)}
                        className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all ${
                          answers[q.id] === oi
                            ? "border-primary-400 bg-primary-soft"
                            : "border-border hover:border-primary-line"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <Button
              className="w-full"
              disabled={!allAnswered || !selected}
              onClick={() => {
                if (!selected) return;
                patchAttempt(selected.id, { answers, submitted: true });
                const scored = scoreKnowledgeTest(answers, selectedQuestions);
                void fetch("/api/knowledge-test/results", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    testSetId: selected.id,
                    score: scored.score,
                    totalQ: scored.total,
                    gapAreas: scored.weakTopics,
                    answers,
                  }),
                }).catch(() => {
                  /* local per-set progress already saved */
                });
              }}
            >
              Submit &amp; see recommendations
            </Button>
          </>
        ) : result && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-white p-8 text-center">
              <BarChart3 className="w-10 h-10 text-primary-400 mx-auto mb-3" />
              <p className="text-sm text-muted-fg mb-1">
                {selected?.label ? `${selected.label} · your score` : "Your score"}
              </p>
              <p className="font-serif text-4xl font-bold text-gray-900 mb-2">
                {result.score}/{result.total}
              </p>
              <p className="text-sm text-gray-700">
                {result.score >= 16
                  ? "Strong foundation — focus on case studies and interview prep."
                  : result.score >= 12
                    ? "Solid base with gaps — review the recommended chapters below."
                    : "Start with Chapter A and the Career Roadmap entry roles."}
              </p>
            </div>

            {result.weakTopics.length > 0 && (
              <div className="rounded-xl bg-secondary p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-fg mb-2">Topics to strengthen</p>
                <div className="flex flex-wrap gap-2">
                  {result.weakTopics.map((t) => (
                    <span key={t} className="px-3 py-1 rounded-full bg-white text-sm text-gray-700 border border-border">{t}</span>
                  ))}
                </div>
              </div>
            )}

            {result.recommendations.length > 0 && (
              <div className="rounded-xl border border-border bg-white p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-fg mb-3">Recommended study</p>
                <ul className="space-y-2">
                  {result.recommendations.map((r) => (
                    <li key={r.chapter}>
                      <Link
                        href={r.chapter ? `/playbook/${r.chapter}` : "/career-roadmap"}
                        className="flex items-center justify-between text-sm text-primary-400 hover:underline"
                      >
                        {r.label}
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-3">
              {result.results.map((r, i) => (
                <div key={r.id} className={`rounded-lg border p-4 ${r.correct ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50"}`}>
                  <div className="flex items-start gap-2 mb-2">
                    {r.correct ? (
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600 mt-0.5" />
                    )}
                    <p className="text-sm font-medium text-gray-900">Q{i + 1}. {r.question}</p>
                  </div>
                  {!r.correct && (
                    <p className="text-xs text-gray-700 ml-6">{r.explanation}</p>
                  )}
                </div>
              ))}
            </div>

            {otherLiveSets.length > 0 && (
              <div className="rounded-xl border border-primary-line bg-primary-soft/40 p-5">
                <p className="text-sm font-semibold text-gray-900 mb-2">Continue with another set</p>
                <p className="text-xs text-muted-fg mb-3">
                  Your score on this bank is saved separately. Other published sets start fresh and will not overwrite it.
                </p>
                {nextFreshSet && (
                  <Button className="w-full mb-3" onClick={() => openSet(nextFreshSet.id)}>
                    Continue with {nextFreshSet.label}
                  </Button>
                )}
                <div className="flex flex-wrap gap-2">
                  {otherLiveSets.map((set) => (
                    <Button key={set.id} variant="outline" size="sm" onClick={() => openSet(set.id)}>
                      {attempts[set.id]?.submitted ? `Review ${set.label}` : set.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <Button
              variant="outline"
              className="w-full"
              onClick={() => selected && patchAttempt(selected.id, { answers: {}, submitted: false })}
            >
              Retake this set
            </Button>
          </div>
        )}
      </TierGate>
    </div>
  );
}
