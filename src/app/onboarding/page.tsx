"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { GradientOrbs } from "@/components/animations";
import { Logo } from "@/components/brand/logo";
import { BRAND_NAME } from "@/lib/brand";

// ─── QUIZ QUESTIONS ──────────────────────────────────────────────────
const QUIZ = [
  {
    id: "q1",
    question: "Which best describes your current situation?",
    options: [
      { text: "I'm a recent graduate looking to break into commodity trading", scores: { FRESH_GRAD: 3, CAREER_SWITCHER: 0, INSIDER: 0, ANALYST_TRADER: 1, VENDOR: 0 } },
      { text: "I'm in another industry and want to transition into commodities", scores: { FRESH_GRAD: 0, CAREER_SWITCHER: 3, INSIDER: 0, ANALYST_TRADER: 0, VENDOR: 0 } },
      { text: "I'm already working in commodities (operations, logistics, trading)", scores: { FRESH_GRAD: 0, CAREER_SWITCHER: 0, INSIDER: 3, ANALYST_TRADER: 1, VENDOR: 0 } },
      { text: "I'm a commodity analyst or trader looking to advance", scores: { FRESH_GRAD: 0, CAREER_SWITCHER: 0, INSIDER: 1, ANALYST_TRADER: 3, VENDOR: 0 } },
      { text: "I work for a vendor / supplier selling into commodity firms", scores: { FRESH_GRAD: 0, CAREER_SWITCHER: 0, INSIDER: 0, ANALYST_TRADER: 0, VENDOR: 3 } },
    ],
  },
  {
    id: "q2",
    question: "What's your primary goal right now?",
    options: [
      { text: "Land my first desk or analyst role", scores: { FRESH_GRAD: 2, CAREER_SWITCHER: 1, INSIDER: 0, ANALYST_TRADER: 0, VENDOR: 0 } },
      { text: "Move up the desk hierarchy or change desks", scores: { FRESH_GRAD: 0, CAREER_SWITCHER: 0, INSIDER: 2, ANALYST_TRADER: 2, VENDOR: 0 } },
      { text: "Understand the market deeply to improve my coverage", scores: { FRESH_GRAD: 0, CAREER_SWITCHER: 1, INSIDER: 1, ANALYST_TRADER: 2, VENDOR: 1 } },
      { text: "Open new accounts and grow revenue in commodity firms", scores: { FRESH_GRAD: 0, CAREER_SWITCHER: 0, INSIDER: 0, ANALYST_TRADER: 0, VENDOR: 3 } },
    ],
  },
  {
    id: "q3",
    question: "How comfortable are you with commodity market mechanics?",
    options: [
      { text: "Total beginner — still learning what 'basis' means", scores: { FRESH_GRAD: 3, CAREER_SWITCHER: 2, INSIDER: 0, ANALYST_TRADER: 0, VENDOR: 1 } },
      { text: "Basic knowledge — know the key products but not the desk language", scores: { FRESH_GRAD: 1, CAREER_SWITCHER: 2, INSIDER: 1, ANALYST_TRADER: 0, VENDOR: 2 } },
      { text: "Solid working knowledge from adjacent roles or study", scores: { FRESH_GRAD: 0, CAREER_SWITCHER: 1, INSIDER: 2, ANALYST_TRADER: 1, VENDOR: 1 } },
      { text: "Deep expertise — I work with these markets every day", scores: { FRESH_GRAD: 0, CAREER_SWITCHER: 0, INSIDER: 2, ANALYST_TRADER: 3, VENDOR: 0 } },
    ],
  },
  {
    id: "q4",
    question: "Which area do you want most help with?",
    options: [
      { text: "Resume positioning and interview preparation", scores: { FRESH_GRAD: 2, CAREER_SWITCHER: 2, INSIDER: 0, ANALYST_TRADER: 0, VENDOR: 0 } },
      { text: "Career roadmap and role progression", scores: { FRESH_GRAD: 1, CAREER_SWITCHER: 1, INSIDER: 2, ANALYST_TRADER: 2, VENDOR: 0 } },
      { text: "Market intelligence and case studies", scores: { FRESH_GRAD: 0, CAREER_SWITCHER: 0, INSIDER: 1, ANALYST_TRADER: 3, VENDOR: 1 } },
      { text: "Desk language, relationships, and how firms actually operate", scores: { FRESH_GRAD: 1, CAREER_SWITCHER: 1, INSIDER: 1, ANALYST_TRADER: 0, VENDOR: 3 } },
    ],
  },
];

// ─── PERSONAS ────────────────────────────────────────────────────────
const PERSONAS = {
  FRESH_GRAD: {
    label: "Fresh Graduate",
    emoji: "🎓",
    color: "#0F766E",
    bg: "#CCFBF1",
    desc: "You're starting fresh with strong academic foundations. Your playbook is all about positioning, interview prep, and making every application count.",
    resources: ["Chapter A Preview", "Resume Templates", "50 Interview Questions", "Career Roadmap"],
  },
  CAREER_SWITCHER: {
    label: "Career Switcher",
    emoji: "🔄",
    color: "#B45309",
    bg: "#FEF3C7",
    desc: "You're bringing valuable transferable skills from another field. The playbook will help you translate your experience into the desk's language.",
    resources: ["Persona Quiz + Resume", "Career Roadmap", "Desk Glossary", "Full Playbook"],
  },
  INSIDER: {
    label: "Industry Insider",
    emoji: "⚡",
    color: "#5B21B6",
    bg: "#EDE9FE",
    desc: "You know the business but want to accelerate upward. Case studies, the Desk Channel, and Mentor Connect are your power tools.",
    resources: ["Case Studies", "Desk Channel Q&As", "Mentor Connect", "Career Roadmap"],
  },
  ANALYST_TRADER: {
    label: "Analyst / Trader",
    emoji: "📊",
    color: "#1E3A5F",
    bg: "#DBEAFE",
    desc: "You live on the desk. Market Knowledge Test, deep case studies, and practitioner Q&As will sharpen your edge.",
    resources: ["Market Knowledge Test", "Case Studies", "Desk Channel", "Full Playbook"],
  },
  VENDOR: {
    label: "Vendor / Supplier",
    emoji: "🤝",
    color: "#9A3412",
    bg: "#FEF0E7",
    desc: "You sell into trading firms. The Desk Channel, case studies, and market intelligence will transform how you approach desk relationships.",
    resources: ["Desk Channel Q&As", "Market Intelligence", "Case Studies", "Full Playbook"],
  },
};

type PersonaKey = keyof typeof PERSONAS;

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-secondary">
          <div className="animate-spin w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full" />
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromSignup = searchParams.get("fromSignup") === "1";
  const { data: session, update, status } = useSession();
  const [step, setStep] = useState(0); // 0 = track, 1-N = quiz, N+1 = result
  const [track, setTrack] = useState<"CAREER" | "SALES">("CAREER");
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [persona, setPersona] = useState<PersonaKey | null>(null);
  const [saving, setSaving] = useState(false);
  const [trackReady, setTrackReady] = useState(false);
  const [skipTrackStep, setSkipTrackStep] = useState(fromSignup);

  useEffect(() => {
    if (status === "loading") return;

    let cancelled = false;

    async function initTrack() {
      let nextTrack: "CAREER" | "SALES" = session?.user?.track ?? "CAREER";
      let skipTrackStep = fromSignup;

      const stored = sessionStorage.getItem("signupTrack");
      if (stored === "CAREER" || stored === "SALES") {
        sessionStorage.removeItem("signupTrack");
        nextTrack = stored;
        skipTrackStep = true;
        try {
          await fetch("/api/user/track", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ track: stored }),
          });
          await update({ track: stored });
        } catch {
          // Continue with quiz — track saves again at finish.
        }
      }

      if (!cancelled) {
        setTrack(nextTrack);
        if (skipTrackStep) {
          setSkipTrackStep(true);
          setStep(1);
        }
        setTrackReady(true);
      }
    }

    initTrack();

    return () => {
      cancelled = true;
    };
  }, [fromSignup, session?.user?.track, status, update]);

  const isQuiz = step >= 1 && step <= QUIZ.length;
  const isResult = step > QUIZ.length;
  const currentQuestion = isQuiz ? QUIZ[step - 1] : null;

  function calculatePersona(answerIndices: number[]): PersonaKey {
    const scores: Record<PersonaKey, number> = {
      FRESH_GRAD: 0,
      CAREER_SWITCHER: 0,
      INSIDER: 0,
      ANALYST_TRADER: 0,
      VENDOR: 0,
    };

    QUIZ.forEach((q, qi) => {
      const selectedIdx = answerIndices[qi];
      if (selectedIdx !== undefined) {
        const option = q.options[selectedIdx];
        Object.entries(option.scores).forEach(([key, val]) => {
          scores[key as PersonaKey] += val;
        });
      }
    });

    return Object.entries(scores).sort(([, a], [, b]) => b - a)[0][0] as PersonaKey;
  }

  function handleOptionSelect(idx: number) {
    setSelectedOption(idx);
  }

  function handleNext() {
    if (step === 0) {
      setStep(1);
      return;
    }

    if (isQuiz && selectedOption !== null) {
      const newAnswers = [...answers, selectedOption];
      setAnswers(newAnswers);
      setSelectedOption(null);

      if (step === QUIZ.length) {
        const result = calculatePersona(newAnswers);
        setPersona(result);
        setStep(QUIZ.length + 1);
      } else {
        setStep(step + 1);
      }
    }
  }

  function handleBack() {
    if (step > 0) {
      setStep(step - 1);
      if (answers.length > 0) {
        const newAnswers = [...answers];
        newAnswers.pop();
        setAnswers(newAnswers);
      }
      setSelectedOption(null);
    }
  }

  async function handleFinish() {
    if (!persona) return;
    setSaving(true);
    try {
      await fetch("/api/user/persona", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona, track }),
      });
      await update({ persona, track, onboardingDone: true });
      router.push("/dashboard");
    } catch {
      router.push("/dashboard");
    }
  }

  const progress = isResult ? 100 : (step / (QUIZ.length + 1)) * 100;
  const totalSteps = QUIZ.length + (skipTrackStep ? 1 : 2);
  const currentStep = skipTrackStep ? step : step + 1;

  if (!trackReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary">
        <div className="animate-spin w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
      <GradientOrbs />
      <div className="relative z-10 w-full max-w-2xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-muted-fg mb-2">
            <span>Step {Math.min(currentStep, totalSteps)} of {totalSteps}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div className="h-1.5 bg-border rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* ── STEP 0: Track selection ── */}
          {step === 0 && (
            <motion.div
              key="track"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl border border-border p-8"
            >
              <div className="text-center mb-8">
                <div className="flex justify-center mb-4">
                  <Logo variant="horizontal" href={false} />
                </div>
                <h2 className="font-serif text-2xl font-bold text-gray-900 mb-2">
                  Welcome to {BRAND_NAME}
                </h2>
                <p className="text-muted-fg text-sm max-w-sm mx-auto">
                  Let's personalise your experience. Which track are you on?
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {(["CAREER", "SALES"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTrack(t)}
                    className={`p-5 rounded-xl border-2 text-left transition-all duration-200 ${
                      track === t
                        ? "border-primary-400 bg-primary-soft"
                        : "border-border hover:border-primary-line"
                    }`}
                  >
                    <div className="text-2xl mb-2">{t === "CAREER" ? "🚀" : "💼"}</div>
                    <h3 className="font-semibold text-gray-900 text-sm mb-1">
                      {t === "CAREER" ? "Build a Career" : "Sell Into Firms"}
                    </h3>
                    <p className="text-xs text-muted-fg">
                      {t === "CAREER"
                        ? "Breaking in, moving up, or re-positioning in commodity trading"
                        : "Selling products / services into commodity trading firms"}
                    </p>
                    {track === t && (
                      <div className="mt-3 flex items-center gap-1 text-primary-400 text-xs font-semibold">
                        <Check className="w-3.5 h-3.5" /> Selected
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <Button className="w-full" size="lg" onClick={handleNext}>
                Continue <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}

          {/* ── QUIZ QUESTIONS ── */}
          {isQuiz && currentQuestion && (
            <motion.div
              key={`q${step}`}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl border border-border p-8"
            >
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-fg mb-3">
                  Question {step} of {QUIZ.length}
                </p>
                <h2 className="font-serif text-xl font-bold text-gray-900">
                  {currentQuestion.question}
                </h2>
              </div>

              <div className="space-y-3 mb-8">
                {currentQuestion.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleOptionSelect(idx)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 text-sm ${
                      selectedOption === idx
                        ? "border-primary-400 bg-primary-soft text-gray-900"
                        : "border-border hover:border-primary-line text-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          selectedOption === idx
                            ? "border-primary-400 bg-primary-400"
                            : "border-border"
                        }`}
                      >
                        {selectedOption === idx && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      {opt.text}
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleNext}
                  disabled={selectedOption === null}
                >
                  {step === QUIZ.length ? "See My Result" : "Next"}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── RESULT ── */}
          {isResult && persona && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl border border-border p-8 text-center"
            >
              <div
                className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center text-4xl mb-5"
                style={{ background: PERSONAS[persona].bg }}
              >
                {PERSONAS[persona].emoji}
              </div>
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4"
                style={{ background: `${PERSONAS[persona].color}15`, color: PERSONAS[persona].color }}
              >
                Your Persona
              </div>
              <h2 className="font-serif text-3xl font-bold text-gray-900 mb-3">
                {PERSONAS[persona].label}
              </h2>
              <p className="text-muted-fg text-sm leading-relaxed max-w-md mx-auto mb-6">
                {PERSONAS[persona].desc}
              </p>

              <div className="bg-secondary rounded-xl p-5 mb-8 text-left">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-fg mb-3">
                  Your recommended starting points
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {PERSONAS[persona].resources.map((r) => (
                    <div key={r} className="flex items-center gap-2 text-sm text-gray-700">
                      <Check className="w-3.5 h-3.5 text-primary-400 flex-shrink-0" />
                      {r}
                    </div>
                  ))}
                </div>
              </div>

              <Button
                size="lg"
                className="w-full"
                onClick={handleFinish}
                loading={saving}
              >
                Go to My Dashboard <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
