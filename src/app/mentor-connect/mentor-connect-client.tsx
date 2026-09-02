"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { Users, MessageSquare, Clock, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TierGate } from "@/components/tier-gate";
import { Reveal } from "@/components/animations";
import { MentorAskPanel } from "@/components/mentor-connect/mentor-ask-panel";
import { formatDate } from "@/lib/utils";
import { formatMentorConnectSubtitle } from "@/data/mentor-connect-content";
import {
  formatMentorCreditsUsedLabel,
  type MentorCreditUsage,
} from "@/lib/mentor-credits";
import { filterMentorSegmentsForTrack } from "@/lib/mentor-segments";
import type { PublicMentorProfile, PublishedMentorSegment } from "@/data/mentors";

const SEGMENT_API_MAP: Record<string, string> = {
  "physical-paper": "physical-trading",
  "shipping-logistics": "operations",
  "risk-management": "finance",
  "market-intelligence": "analytics",
  "tools": "sales",
  "sales-advisory": "sales-advisory",
};

const SEGMENTS = [
  { value: "physical-trading", label: "Physical Trading", desc: "Price discovery, cargo logistics, arbitrage" },
  { value: "finance", label: "Finance & Risk", desc: "P&L, hedging, credit, derivatives" },
  { value: "analytics", label: "Market Analytics", desc: "Forecasting, data analysis, market intelligence" },
  { value: "operations", label: "Operations", desc: "Logistics, settlements, documentation" },
  { value: "sales", label: "Commercial / Sales", desc: "Origination, counterparty relationships, B2B" },
];

interface Question {
  id: string;
  segment: string;
  question: string;
  answer: string | null;
  isAnswered: boolean;
  createdAt: string;
  answeredAt?: string;
}

interface Props {
  userTier: string;
  userTrack: "CAREER" | "SALES";
  mentorCreditUsage: MentorCreditUsage | null;
  mentorSegments: PublishedMentorSegment[];
  mentorConnectHero: {
    eyebrow: string;
    title: string;
    subtitle: string;
  };
  mentorConnectHowItWorks: {
    title: string;
    steps: { num: string; title: string; body: string }[];
    callout: { title: string; body: string };
  };
  questions: Question[];
}

type SelectedMentor = PublicMentorProfile & { segmentId: string; segmentTitle: string };

export function MentorConnectClient({
  userTier,
  userTrack,
  mentorCreditUsage,
  mentorSegments,
  questions,
  mentorConnectHero,
  mentorConnectHowItWorks,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const focusSegment = searchParams.get("segment");
  const [segment, setSegment] = useState("");
  const [question, setQuestion] = useState("");
  const [memberShareOptIn, setMemberShareOptIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [selectedMentor, setSelectedMentor] = useState<SelectedMentor | null>(null);
  const askPanelRef = useRef<HTMLDivElement>(null);

  const isElite = userTier === "ELITE";
  const creditsRemaining = mentorCreditUsage?.remaining ?? 0;
  const visibleSegments = filterMentorSegmentsForTrack(mentorSegments, userTrack);
  const visibleSegmentCount = visibleSegments.length;
  const visibleMentorCount = visibleSegments.reduce((sum, seg) => sum + seg.mentors.length, 0);

  useEffect(() => {
    if (!focusSegment) return;
    const el = document.getElementById(`mentor-segment-${focusSegment}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [focusSegment, visibleSegments.length]);

  useEffect(() => {
    if (!selectedMentor) return;
    askPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedMentor?.id]);

  function openMentor(mentor: PublicMentorProfile, segmentId: string, segmentTitle: string) {
    if (selectedMentor?.id === mentor.id) {
      clearMentorSelection();
      return;
    }
    setSelectedMentor({ ...mentor, segmentId, segmentTitle });
    setSegment(SEGMENT_API_MAP[segmentId] || segmentId);
    setSubmitted(false);
    setError("");
  }

  function clearMentorSelection() {
    setSelectedMentor(null);
    setSegment("");
    setQuestion("");
    setMemberShareOptIn(false);
    setSubmitted(false);
    setError("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedMentor || !segment || question.length < 20) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/mentor-connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ segment, question, memberShareOptIn }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong");
      } else {
        setSubmitted(true);
        setQuestion("");
        setMemberShareOptIn(false);
        setSegment("");
        router.refresh();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function scrollToSegment(segmentId: string) {
    document.getElementById(`mentor-segment-${segmentId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="page-container py-8 sm:py-10">
      <section className="rounded-2xl bg-primary-800 px-8 py-12 mb-10 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #3280ff 0%, transparent 70%)" }} />
        <Reveal className="relative z-10">
          <div className="pill pill-dark mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            {mentorConnectHero.eyebrow}
          </div>
          <h1 className="font-serif text-4xl font-bold text-white mb-3">
            {mentorConnectHero.title}
          </h1>
          <p className="text-white/65 text-lg max-w-2xl mb-6">
            {formatMentorConnectSubtitle(
              mentorConnectHero.subtitle,
              visibleMentorCount,
              visibleSegmentCount
            )}
          </p>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="glass-card px-4 py-2.5 text-white text-sm font-semibold">
              {isElite && mentorCreditUsage
                ? formatMentorCreditsUsedLabel(mentorCreditUsage)
                : isElite
                  ? "0/15 used"
                  : "Elite only"}
            </div>
            {isElite && mentorCreditUsage && (
              <div className="glass-card px-4 py-2.5 text-white/80 text-xs font-semibold uppercase tracking-widest">
                {mentorCreditUsage.monthLabel}
              </div>
            )}
            <div className="glass-card px-4 py-2.5 text-white text-sm font-semibold">{visibleMentorCount} Practitioners</div>
            <div className="glass-card px-4 py-2.5 text-white text-sm font-semibold">{visibleSegmentCount} Segments</div>
          </div>
        </Reveal>
      </section>

      <div className="flex gap-2 overflow-x-auto pb-1 mb-8 scrollbar-hide">
        {visibleSegments.map((seg) => (
          <button
            key={seg.id}
            type="button"
            onClick={() => scrollToSegment(seg.id)}
            className="px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap border transition-all bg-primary-400 text-white border-primary-400 hover:bg-primary-500 shrink-0"
          >
            {seg.num} · {seg.title}
          </button>
        ))}
      </div>

      <TierGate requiredTier="ELITE" userTier={userTier}>
        {/* Mentor browse + inline ask panel — full width */}
        <section className="mb-14">
          <Reveal className="mb-8">
            <p className="text-xs font-bold uppercase tracking-widest text-primary-800 mb-2">Browse mentors</p>
            <h2 className="font-serif text-2xl font-bold text-gray-900">{visibleMentorCount} Practitioners. {visibleSegmentCount} Segments.</h2>
            <p className="text-sm text-muted-fg mt-2">
              Tap a mentor to open the question panel right here — no scrolling to the bottom of the page.
            </p>
          </Reveal>

          <div className="space-y-10">
            {visibleSegments.map((seg) => (
                <div key={seg.id} id={`mentor-segment-${seg.id}`}>
                  <div className="mb-4 pb-4 border-b border-border">
                    <h2 className="font-serif text-xl sm:text-2xl font-bold text-gray-900">
                      {seg.num} · {seg.title}
                    </h2>
                    <p className="text-sm text-muted-fg mt-1.5 max-w-2xl">{seg.blurb}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      {seg.mentors.map((mentor) => {
                        const isSelected = selectedMentor?.id === mentor.id;

                        return (
                          <div key={mentor.id} className="flex flex-col min-w-0">
                          <button
                            type="button"
                            onClick={() => openMentor(mentor, seg.id, seg.title)}
                            aria-expanded={isSelected}
                            className={`text-left rounded-xl border bg-white p-4 h-full transition-all hover:-translate-y-1 hover:border-primary-line hover:shadow-md ${
                              isSelected
                                ? "border-primary-400 ring-2 ring-primary-400/20 shadow-md"
                                : "border-border"
                            }`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="w-10 h-10 rounded-full bg-primary-soft border border-primary-line flex items-center justify-center">
                                <Users className="w-4 h-4 text-primary-800" />
                              </div>
                              <span className="text-[10px] font-semibold text-muted-fg uppercase tracking-wider">{mentor.years} yrs</span>
                            </div>
                            <p className="text-[10px] font-bold text-primary-800 tracking-wider mb-1">{mentor.id}</p>
                            <h3 className="font-serif font-bold text-sm text-gray-900 mb-2 leading-snug">{mentor.headline}</h3>
                            <p className="text-xs text-muted-fg line-clamp-3 mb-3">{mentor.bio}</p>
                            <div className="flex flex-wrap gap-1 mb-3">
                              {mentor.tags.slice(0, 2).map((tag) => (
                                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-fg">{tag}</span>
                              ))}
                            </div>
                            <p className="flex items-center gap-1.5 text-xs font-semibold text-primary-400">
                              <MessageSquare className="w-3.5 h-3.5" />
                              {isSelected ? "Writing question…" : "Ask one question"}
                            </p>
                          </button>

                          <AnimatePresence mode="wait">
                            {isSelected && selectedMentor && (
                              <div ref={askPanelRef} className="mt-4">
                                <MentorAskPanel
                                  key={selectedMentor.id}
                                  mentor={selectedMentor}
                                  question={question}
                                  memberShareOptIn={memberShareOptIn}
                                  submitting={submitting}
                                  submitted={submitted}
                                  error={error}
                                  mentorCredits={creditsRemaining}
                                  onQuestionChange={setQuestion}
                                  onMemberShareOptInChange={setMemberShareOptIn}
                                  onClose={clearMentorSelection}
                                  onSubmit={handleSubmit}
                                  onAskAnother={() => {
                                    setSubmitted(false);
                                    clearMentorSelection();
                                  }}
                                />
                              </div>
                            )}
                          </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
          </div>
        </section>

        {/* My Questions — below mentor grid */}
        <section className="mb-14 pt-10 border-t border-border">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-fg" /> My Questions
          </h2>
          <p className="text-sm text-muted-fg mb-6">
            Answers sync here when a mentor responds — you&apos;ll also receive an email notification.
          </p>
          {questions.length === 0 ? (
            <div className="bg-white rounded-xl border border-border p-8 text-center max-w-xl">
              <Users className="w-8 h-8 text-muted-fg mx-auto mb-3" />
              <p className="text-sm text-muted-fg">No questions yet. Pick a mentor above and ask your first question.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {questions.map((q) => (
                <div key={q.id} className="bg-white rounded-xl border border-border p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge variant={q.isAnswered ? "success" : "secondary"} size="sm">
                      {q.isAnswered ? "Answered" : "Pending"}
                    </Badge>
                    <span className="text-xs text-muted-fg">{formatDate(q.createdAt)}</span>
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-fg mb-1">
                    {SEGMENTS.find((s) => s.value === q.segment)?.label}
                  </p>
                  <p className="text-sm text-gray-700 mb-2">{q.question}</p>
                  {q.isAnswered && q.answer && (
                    <div className="bg-primary-soft border border-primary-line rounded-lg p-3 mt-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-primary-800 mb-1">Answer</p>
                      <p className="text-sm text-primary-800">{q.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* How the Session Works */}
        <section className="mt-16 pt-12 border-t border-border">
          <Reveal>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-10">
              {mentorConnectHowItWorks.title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
              {mentorConnectHowItWorks.steps.map((step) => (
                <div
                  key={step.num}
                  className="bg-white rounded-xl border border-border p-6 transition-all hover:border-primary-line hover:shadow-sm"
                >
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-accent border border-primary-line text-xs font-bold text-primary-800 mb-4">
                    {step.num}
                  </div>
                  <h3 className="font-serif font-bold text-lg text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-fg leading-relaxed">
                    {formatMentorConnectSubtitle(step.body, visibleMentorCount, visibleSegmentCount)}
                  </p>
                </div>
              ))}
            </div>

            <div className="max-w-4xl mx-auto mt-9 flex gap-4 items-start rounded-r-lg border border-primary-line border-l-[3px] border-l-primary-400 bg-accent px-6 py-5">
              <Lock className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-serif font-bold text-primary-800 mb-1">{mentorConnectHowItWorks.callout.title}</p>
                <p className="text-sm text-secondary-fg leading-relaxed">
                  {mentorConnectHowItWorks.callout.body}
                </p>
              </div>
            </div>
          </Reveal>
        </section>
      </TierGate>
    </div>
  );
}
