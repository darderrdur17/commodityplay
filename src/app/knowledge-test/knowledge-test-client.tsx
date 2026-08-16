"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle, XCircle, ArrowRight, BarChart3 } from "lucide-react";
import { TierGate } from "@/components/tier-gate";
import { Reveal } from "@/components/animations";
import { Button } from "@/components/ui/button";
import { KNOWLEDGE_TEST, scoreKnowledgeTest, type KnowledgeQuestion } from "@/data/knowledge-test";

interface Props {
  userTier: string;
  questions?: KnowledgeQuestion[];
  activeSetLabel?: string;
  requiredTier?: "PRO" | "ELITE";
}

export function KnowledgeTestClient({
  userTier,
  questions = KNOWLEDGE_TEST,
  activeSetLabel,
  requiredTier = "PRO",
}: Props) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const result = submitted ? scoreKnowledgeTest(answers, questions) : null;

  function selectAnswer(qId: string, index: number) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qId]: index }));
  }

  const allAnswered = questions.every((q) => answers[q.id] !== undefined);

  return (
    <div className="page-container py-8 sm:py-10 max-w-2xl">
      <section className="rounded-2xl bg-primary-800 px-6 sm:px-8 py-10 mb-8 relative overflow-hidden">
        <Reveal className="relative z-10">
          <div className="pill pill-dark mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" /> Pro · {questions.length} Questions
            {activeSetLabel ? ` · ${activeSetLabel}` : ""}
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-3">Knowledge Test</h1>
          <p className="text-white/65 text-base sm:text-lg">
            Gap analysis across Playbook foundations — personalised recommendations on where to study next.
          </p>
        </Reveal>
      </section>

      <TierGate requiredTier={requiredTier} userTier={userTier}>
        {!submitted ? (
          <>
            <div className="space-y-6 mb-8">
              {questions.map((q, qi) => (
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
              disabled={!allAnswered}
              onClick={() => setSubmitted(true)}
            >
              Submit &amp; see recommendations
            </Button>
          </>
        ) : result && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-white p-8 text-center">
              <BarChart3 className="w-10 h-10 text-primary-400 mx-auto mb-3" />
              <p className="text-sm text-muted-fg mb-1">Your score</p>
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

            <Button variant="outline" className="w-full" onClick={() => { setSubmitted(false); setAnswers({}); }}>
              Retake test
            </Button>
          </div>
        )}
      </TierGate>
    </div>
  );
}
