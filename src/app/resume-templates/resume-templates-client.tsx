"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Download,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  Check,
  AlertCircle,
  Info,
  Upload,
  Send,
  Repeat2,
  Home,
  Activity,
  Box,
  GraduationCap,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { TierGate } from "@/components/tier-gate";
import { Reveal } from "@/components/animations";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RESUME_TEMPLATES,
  PERSONA_QUIZ_STEPS,
  INDUSTRY_MAP,
  POSITIONING_PRINCIPLE,
  TEMPLATE_CARD_DETAILS,
  RESUME_VETTING_SECTION,
  type ResumeTemplate,
  type PersonaQuizStep,
  type IndustryMapZone,
  type TemplateCardDetails,
  type ResumeVettingSection,
} from "@/data/resume-templates";
import {
  DEFAULT_RESUME_INDUSTRY_MAP_SECTION,
  DEFAULT_RESUME_PAGE_HERO,
  DEFAULT_RESUME_QUIZ_SECTION,
  DEFAULT_RESUME_TEMPLATES_SECTION,
  resumeVettingArchetypeOptions,
  type ResumeAdminPersona,
  type ResumePageHero,
  type ResumeQuizSectionCopy,
  type ResumeSectionCopy,
} from "@/lib/content/resume-payload";
import { PERSONA_ARCHETYPES } from "@/data/persona-archetypes";
import { scorePersonaQuiz, type PersonaId } from "@/lib/persona-quiz";
import { personaIdToApi } from "@/lib/persona-map";
import { PERSONA_LABELS } from "@/lib/utils";
import {
  resolveResumeTemplateDownloadUrl,
  resolveResumeTemplateFileUrl,
} from "@/lib/resume-template-download";
import { getRecommendedRoleSlugs } from "@/data/persona-career";

interface Props {
  userTier: string;
  persona: string | null;
  templates?: ResumeTemplate[];
  quizSteps?: PersonaQuizStep[];
  industryMap?: IndustryMapZone[];
  assetUrls?: Record<string, string>;
  requiredTier?: "PRO" | "ELITE";
  vettingSection?: ResumeVettingSection;
  pageHero?: ResumePageHero;
  quizSection?: ResumeQuizSectionCopy;
  industryMapSection?: ResumeSectionCopy;
  templatesSection?: ResumeSectionCopy;
  positioningPrinciple?: { title: string; body: string };
  templateCardDetails?: Record<string, TemplateCardDetails>;
  personas?: ResumeAdminPersona[];
}

const ARCHETYPE_ICONS: Record<PersonaId, React.ElementType> = {
  switcher: Repeat2,
  insider: Home,
  analyst: Activity,
  vendor: Box,
  fresh_grad: GraduationCap,
};

function TemplatePreview({
  details,
  color,
  bgClass,
}: {
  details: TemplateCardDetails;
  color: string;
  bgClass: string;
}) {
  return (
    <div className="rounded-lg border overflow-hidden bg-muted" style={{ borderColor: `${color}40` }}>
      <div className={`px-3 py-2 border-b ${bgClass}`} style={{ borderColor: `${color}40` }}>
        <p className="text-lg font-black tracking-tight text-gray-900">YOUR NAME</p>
        <p className="text-[8px] font-semibold uppercase tracking-wider" style={{ color }}>
          {details.previewTagline}
        </p>
      </div>
      <div className="p-3 space-y-2.5">
        {details.previewSections.map((section) => (
          <div key={section.label}>
            <p
              className="text-[7px] font-bold uppercase tracking-wider mb-1"
              style={{ color: section.accent ? color : undefined }}
            >
              {section.label}
            </p>
            <div className="space-y-1">
              {section.barWidths.map((width, i) => (
                <div
                  key={i}
                  className="h-1.5 rounded-sm"
                  style={{
                    width: `${width}%`,
                    background: section.accent ? color : "var(--border, #e4e7ec)",
                    opacity: section.accent ? 0.5 : 1,
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResumeVettingSection({
  content,
  personas,
}: {
  content: ResumeVettingSection;
  personas?: ResumeAdminPersona[];
}) {
  const archetypeOptions = resumeVettingArchetypeOptions(personas);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [archetype, setArchetype] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [fileName, setFileName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function isValidYears(value: string) {
    if (!value.trim()) return false;
    const num = Number(value);
    return Number.isFinite(num) && num >= 0 && num <= 50 && Number.isInteger(num);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !email.includes("@") || !archetype) {
      setError("Please fill in your name, email, and archetype before submitting.");
      return;
    }
    if (!isValidYears(yearsExperience)) {
      setError("Please enter years of experience as a whole number from 0 to 50.");
      return;
    }
    setError("");
    setSubmitted(true);
  }

  const { labels } = content;

  return (
    <section id="vetting" className="mb-10">
      <div className="rounded-2xl bg-primary-800 p-6 sm:p-10 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-20 bg-primary-400 blur-3xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 relative z-10">
          <Reveal>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary-300">
                {content.eyebrow}
              </p>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-3">
              {content.headline}{" "}
              <span className="text-accent italic">{content.headlineAccent}</span>
            </h2>
            <p className="text-sm text-white/70 leading-relaxed mb-5">{content.intro}</p>
            <ul className="space-y-2 mb-6">
              {content.benefits.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-white/75 py-1.5 border-b border-white/10 last:border-0">
                  <Check className="w-3.5 h-3.5 text-primary-400 mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="rounded-lg border border-white/20 bg-white/10 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">{content.includedLabel}</p>
              <p className="text-sm text-white/80 leading-relaxed">{content.includedNote}</p>
            </div>
          </Reveal>

          <Reveal className="lg:mt-0">
            {submitted ? (
              <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm p-8 text-center">
                <div className="w-14 h-14 rounded-full bg-primary-400/20 border border-primary-400/40 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-6 h-6 text-primary-300" />
                </div>
                <h3 className="font-serif text-xl font-bold text-white mb-2">{content.successTitle}</h3>
                <p className="text-sm text-white/65 leading-relaxed">{content.successMessage}</p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm p-6"
              >
                <h3 className="font-serif text-lg font-bold text-white mb-1">{content.formTitle}</h3>
                <p className="text-xs text-white/50 mb-5">{content.formSubtitle}</p>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-white/65 tracking-wide block mb-1.5">
                      {labels.name}
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Wei Ming Tan"
                      className="w-full rounded-md border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary-400/60"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-white/65 tracking-wide block mb-1.5">
                      {labels.email}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="w-full rounded-md border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary-400/60"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-white/65 tracking-wide block mb-1.5">
                      {labels.archetype}
                    </label>
                    <select
                      value={archetype}
                      onChange={(e) => setArchetype(e.target.value)}
                      className="w-full rounded-md border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary-400/60 [&>option]:bg-white [&>option]:text-gray-900"
                    >
                      <option value="" disabled className="bg-white text-gray-900">
                        Select your archetype
                      </option>
                      {archetypeOptions.map((opt) => (
                        <option key={opt.value} value={opt.value} className="bg-white text-gray-900">
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-white/65 tracking-wide block mb-1.5">
                      {labels.yearsExperience}
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      step={1}
                      value={yearsExperience}
                      onChange={(e) => setYearsExperience(e.target.value)}
                      placeholder="e.g. 5"
                      className="w-full rounded-md border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary-400/60"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-white/65 tracking-wide block mb-1.5">
                      {labels.targetRole}
                    </label>
                    <input
                      type="text"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      placeholder="e.g. LNG Analyst, Crude Scheduler, Risk Analyst"
                      className="w-full rounded-md border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary-400/60"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-white/65 tracking-wide block mb-1.5">
                      {labels.upload}
                    </label>
                    <label className="block border border-dashed border-white/25 rounded-md p-4 text-center cursor-pointer hover:border-primary-400/50 transition-colors">
                      <Upload className="w-5 h-5 text-white/40 mx-auto mb-2" />
                      <p className="text-xs text-white/50">{labels.uploadHint}</p>
                      {fileName && <p className="text-[11px] text-white/50 mt-1">✓ {fileName}</p>}
                      <input
                        type="file"
                        accept=".docx,.pdf"
                        className="hidden"
                        onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
                      />
                    </label>
                    <p className="text-[11px] text-white/35 text-center mt-1.5">{labels.uploadLimit}</p>
                  </div>
                </div>

                {error && (
                  <p className="text-xs text-red-300 mt-3 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {error}
                  </p>
                )}

                <Button type="submit" className="w-full mt-4">
                  <Send className="w-4 h-4" />
                  {labels.submit}
                </Button>
              </form>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export function ResumeTemplatesClient({
  userTier,
  persona,
  templates = RESUME_TEMPLATES,
  quizSteps = PERSONA_QUIZ_STEPS,
  industryMap = INDUSTRY_MAP,
  assetUrls = {},
  requiredTier = "PRO",
  vettingSection = RESUME_VETTING_SECTION,
  pageHero = DEFAULT_RESUME_PAGE_HERO,
  quizSection = DEFAULT_RESUME_QUIZ_SECTION,
  industryMapSection = DEFAULT_RESUME_INDUSTRY_MAP_SECTION,
  templatesSection = DEFAULT_RESUME_TEMPLATES_SECTION,
  positioningPrinciple = POSITIONING_PRINCIPLE,
  templateCardDetails = TEMPLATE_CARD_DETAILS,
  personas,
}: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [quizComplete, setQuizComplete] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const savedPersonaRef = useRef<PersonaId | null>(null);
  const { data: session, update: updateSession } = useSession();

  const scoreResult = useMemo(
    () =>
      scorePersonaQuiz({
        q1: answers.q1,
        q2: answers.q2,
        q3: answers.q3,
        q4: answers.q4,
        q5: answers.q5,
      }),
    [answers]
  );

  const recommendedId = useMemo((): PersonaId | null => {
    if (quizComplete && Object.keys(answers).length >= 4) {
      return scoreResult.personaId;
    }
    if (persona) {
      const map: Record<string, PersonaId> = {
        CAREER_SWITCHER: "switcher",
        INSIDER: "insider",
        ANALYST_TRADER: "analyst",
        VENDOR: "vendor",
        FRESH_GRAD: "fresh_grad",
      };
      return map[persona] ?? null;
    }
    return null;
  }, [quizComplete, answers, scoreResult.personaId, persona]);

  const archetype = recommendedId ? PERSONA_ARCHETYPES[recommendedId] : null;
  const recommended = recommendedId ? templates.find((t) => t.id === recommendedId) : null;

  const currentStep = quizSteps[step];
  const canNext = currentStep && answers[currentStep.id];

  function selectOption(stepId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [stepId]: value }));
  }

  function nextStep() {
    if (step < quizSteps.length - 1) setStep(step + 1);
    else setQuizComplete(true);
  }

  function prevStep() {
    if (quizComplete) setQuizComplete(false);
    else if (step > 0) setStep(step - 1);
  }

  function retakeQuiz() {
    setQuizComplete(false);
    setStep(0);
    setAnswers({});
    setSaveStatus("idle");
    savedPersonaRef.current = null;
  }

  function scrollToTemplate(id: string) {
    document.getElementById(`template-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const progressPct = quizComplete ? 100 : Math.round(((step + 1) / quizSteps.length) * 100);

  const downloadHref = recommendedId ? resolveResumeTemplateDownloadUrl(recommendedId, assetUrls) : "";

  const recommendedCareerRoles = useMemo(
    () => getRecommendedRoleSlugs(recommendedId ? personaIdToApi(recommendedId) : persona, answers.q3),
    [recommendedId, persona, answers.q3]
  );

  useEffect(() => {
    if (!quizComplete || !recommendedId) return;
    if (savedPersonaRef.current === recommendedId) return;

    const personaToSave = recommendedId;
    savedPersonaRef.current = personaToSave;

    async function persistPersona() {
      setSaveStatus("saving");
      const track = (session?.user as { track?: string } | undefined)?.track ?? "CAREER";
      try {
        const res = await fetch("/api/user/persona", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            persona: personaIdToApi(personaToSave),
            track,
            source: "resume",
          }),
        });
        if (!res.ok) throw new Error("Save failed");
        await updateSession();
        setSaveStatus("saved");
      } catch {
        savedPersonaRef.current = null;
        setSaveStatus("error");
      }
    }

    persistPersona();
  }, [quizComplete, recommendedId, session?.user, updateSession]);

  return (
    <div className="page-container py-8 sm:py-10">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-fg hover:text-primary-400 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <section className="rounded-2xl bg-primary-800 px-6 sm:px-8 py-10 mb-8 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-10 bg-primary-400 blur-3xl" />
        <Reveal className="relative z-10">
          <div className="pill pill-dark mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" /> {pageHero.eyebrow}
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-3">
            {pageHero.title} <span className="text-accent italic">{pageHero.titleAccent}</span>
          </h1>
          <p className="text-white/65 text-base sm:text-lg max-w-xl mb-6">
            {pageHero.description}
          </p>
          <div className="flex flex-wrap gap-3">
            {pageHero.stats.map((s) => (
              <div key={s.label} className="glass-card px-4 py-2.5 text-white text-sm">
                <span className="font-serif font-bold text-lg block">{s.num}</span>
                <span className="text-white/60 text-xs">{s.label}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <TierGate requiredTier={requiredTier} userTier={userTier}>
        {/* Step 1 — Persona quiz */}
        <section id="quiz" className="mb-10">
          <Reveal className="text-center mb-7">
            <p className="text-xs font-bold uppercase tracking-widest text-primary-800 mb-2">{quizSection.eyebrow}</p>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{quizSection.title}</h2>
            <p className="text-sm text-muted-fg max-w-md mx-auto">
              {quizSection.description}
            </p>
          </Reveal>

          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            <div className="bg-primary-800 px-6 py-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/15 border border-white/25 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="font-serif font-bold text-white">{quizSection.finderTitle}</p>
                <p className="text-white/60 text-xs">{quizSection.finderSub}</p>
              </div>
            </div>
            <div className="h-1 bg-secondary">
              <div className="h-full bg-primary-400 transition-all" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="p-6 sm:p-8">
              {quizComplete && archetype && recommended ? (
                <div className="max-w-2xl mx-auto">
                  <div className={`rounded-2xl border border-border p-6 sm:p-8 ${archetype.bgClass}`}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary-800 mb-3">
                      Your archetype · {scoreResult.confidence}% match
                    </p>
                    <div className="flex items-start gap-3 mb-4">
                      <span className="text-3xl" aria-hidden>
                        {archetype.emoji}
                      </span>
                      <div>
                        <h3 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900">{archetype.name}</h3>
                        <p className="text-sm font-semibold mt-1" style={{ color: archetype.color }}>
                          {archetype.label}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed mb-4">{archetype.desc}</p>
                    <div className="rounded-xl bg-white/80 border border-border p-4 mb-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-fg mb-2">
                        Where you sit in the industry
                      </p>
                      <p className="text-sm text-gray-700 leading-relaxed">{archetype.industryPosition}</p>
                    </div>
                    <div className="rounded-xl border-l-[3px] border-primary-400 bg-accent px-4 py-3 mb-4">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-primary-900 mb-1">
                        Your #1 positioning move
                      </p>
                      <p className="text-sm text-primary-900 leading-relaxed font-medium">{archetype.keyMove}</p>
                    </div>
                    {(scoreResult.marketFocus || scoreResult.entryTrack) && (
                      <div className="flex flex-wrap gap-2 mb-6">
                        {scoreResult.marketFocus && (
                          <Badge variant="outline" size="sm">
                            Market focus: {scoreResult.marketFocus}
                          </Badge>
                        )}
                        {scoreResult.entryTrack && (
                          <Badge variant="outline" size="sm">
                            Entry track: {scoreResult.entryTrack}
                          </Badge>
                        )}
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <a href={downloadHref} download={archetype.templateFile} className="flex-1">
                        <Button className="w-full" style={{ background: archetype.color }}>
                          <Download className="w-4 h-4" />
                          Download {archetype.name} Template
                        </Button>
                      </a>
                      <Button variant="outline" onClick={retakeQuiz} className="flex-1 sm:flex-none">
                        Retake Quiz
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => scrollToTemplate(recommended.id)}
                        className="flex-1 sm:flex-none"
                      >
                        See Full Template
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                    {recommendedCareerRoles.length > 0 && (
                      <p className="text-xs text-muted-fg mt-4 leading-relaxed">
                        Recommended roadmap roles for your profile:{" "}
                        {recommendedCareerRoles.slice(0, 4).join(" · ")} — see full blueprints on the{" "}
                        <Link href="/career-roadmap" className="text-primary-800 font-semibold hover:underline">
                          Career Roadmap
                        </Link>
                        .
                      </p>
                    )}
                  </div>
                  {saveStatus === "saving" && (
                    <p className="text-xs text-muted-fg text-center mt-4">Saving persona to your profile…</p>
                  )}
                  {saveStatus === "saved" && (
                    <p className="text-xs text-teal-700 text-center mt-4 flex items-center justify-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Saved to your profile — synced across devices
                    </p>
                  )}
                  {saveStatus === "error" && (
                    <p className="text-xs text-red-600 text-center mt-4 flex items-center justify-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Could not save persona. Try again after signing in.
                    </p>
                  )}
                </div>
              ) : currentStep ? (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary-800 mb-2">
                    Question {step + 1} of {quizSteps.length}
                  </p>
                  <h3 className="font-serif text-xl font-bold text-gray-900 mb-1">{currentStep.question}</h3>
                  <p className="text-sm text-muted-fg mb-6">{currentStep.sub}</p>
                  <div className="space-y-2 mb-8">
                    {currentStep.options.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => selectOption(currentStep.id, opt.value)}
                        className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all ${
                          answers[currentStep.id] === opt.value
                            ? "border-primary-400 bg-primary-soft"
                            : "border-border hover:border-primary-line"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                              answers[currentStep.id] === opt.value
                                ? "border-primary-400 bg-primary-400"
                                : "border-border"
                            }`}
                          >
                            {answers[currentStep.id] === opt.value && (
                              <span className="w-1.5 h-1.5 rounded-full bg-white" />
                            )}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{opt.label}</p>
                            {opt.sub && <p className="text-xs text-muted-fg mt-0.5">{opt.sub}</p>}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-5 border-t border-border">
                    <p className="text-xs text-muted-fg">
                      {step === 0 ? "Select one to continue" : ""}
                    </p>
                    <div className="flex gap-2">
                      {step > 0 && (
                        <Button variant="outline" onClick={prevStep}>
                          <ChevronLeft className="w-4 h-4" /> Back
                        </Button>
                      )}
                      <Button onClick={nextStep} disabled={!canNext}>
                        {step === quizSteps.length - 1 ? "See My Archetype" : "Next"}
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </section>

        {/* Step 2 — Industry map */}
        {industryMap.length > 0 && (
          <section className="mb-10">
            <Reveal className="mb-6">
              <p className="text-xs font-bold uppercase tracking-widest text-primary-800 mb-2">
                {industryMapSection.eyebrow}
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{industryMapSection.title}</h2>
              <p className="text-muted-fg text-sm max-w-2xl">
                {industryMapSection.description}
              </p>
            </Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {industryMap.map((zone) => (
                <div
                  key={zone.zone}
                  className={`rounded-xl border overflow-hidden ${zone.muted ? "border-border bg-muted" : "border-border bg-white"}`}
                >
                  <div
                    className="px-4 py-3"
                    style={
                      zone.muted
                        ? { background: "var(--muted, #f9fafb)", borderBottom: "1px solid var(--border, #e4e7ec)" }
                        : { background: zone.color }
                    }
                  >
                    <p
                      className="text-[10px] uppercase tracking-widest"
                      style={{ color: zone.muted ? "var(--muted-fg, #677184)" : "rgba(255,255,255,0.6)" }}
                    >
                      {zone.zone === "Entry" ? "Entry Path" : `Zone ${zone.zone}`}
                    </p>
                    <p className={`font-serif font-bold ${zone.muted ? "text-gray-900" : "text-white"}`}>
                      {zone.title}
                    </p>
                  </div>
                  <ul className="p-4 space-y-2 bg-white border-t border-border">
                    {zone.roles.map((role) => (
                      <li key={role.name} className="text-sm text-gray-700 flex items-start gap-2">
                        <span
                          className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                          style={{ background: role.dotColor ?? zone.color }}
                        />
                        <span className="flex-1">
                          {role.name}
                          {role.tag && (
                            <span className="ml-1.5 text-[10px] font-semibold text-primary-800 bg-primary-soft px-1.5 py-0.5 rounded">
                              {role.tag}
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <Reveal className="rounded-xl border border-primary-line bg-accent px-5 py-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-800 flex items-center justify-center flex-shrink-0">
                <Info className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-bold text-sm text-primary-900 mb-1">{positioningPrinciple.title}</p>
                <p className="text-sm text-gray-700 leading-relaxed">{positioningPrinciple.body}</p>
              </div>
            </Reveal>
          </section>
        )}

        {/* Step 3 — Template library */}
        <section id="templates" className="mb-10">
          <Reveal className="mb-6">
            <p className="text-xs font-bold uppercase tracking-widest text-primary-800 mb-2">
              {templatesSection.eyebrow}
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{templatesSection.title}</h2>
            <p className="text-muted-fg text-sm max-w-2xl">
              {templatesSection.description}
            </p>
          </Reveal>

          <div className="space-y-5">
            {templates.map((t) => {
              const arch = PERSONA_ARCHETYPES[t.id as PersonaId];
              const details = templateCardDetails[t.id] ?? TEMPLATE_CARD_DETAILS[t.id];
              const Icon = ARCHETYPE_ICONS[t.id as PersonaId];
              const isRecommended = recommended?.id === t.id;

              if (!arch || !details) return null;

              return (
                <div
                  key={t.id}
                  id={`template-${t.id}`}
                  className={`rounded-xl border bg-white overflow-hidden transition-all ${
                    isRecommended ? "border-primary-400 ring-2 ring-primary-400/20" : "border-border hover:border-primary-line hover:shadow-lg"
                  }`}
                >
                  <div className="relative px-5 sm:px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: arch.color }} />
                    <div className="pl-2 flex flex-col sm:flex-row sm:items-center gap-4 flex-1 min-w-0">
                      <span
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider w-fit"
                        style={{
                          background: `${arch.color}18`,
                          color: arch.color,
                          border: `1px solid ${arch.color}40`,
                        }}
                      >
                        <Icon className="w-3 h-3" />
                        {t.label}
                      </span>
                      <div className="min-w-0 flex-1">
                        {isRecommended && (
                          <Badge size="sm" className="mb-1.5 bg-accent text-primary-900">
                            Recommended for you
                          </Badge>
                        )}
                        <h3 className="font-serif text-lg sm:text-xl font-bold text-gray-900">{details.title}</h3>
                        {t.roleBand && <p className="text-xs text-muted-fg mt-0.5">{t.roleBand}</p>}
                      </div>
                    </div>
                    <a
                      href={resolveResumeTemplateFileUrl(t.templateFile, assetUrls)}
                      download={t.templateFile}
                      className="sm:flex-shrink-0"
                    >
                      <Button style={{ background: arch.color }}>
                        <Download className="w-4 h-4" />
                        Download .docx
                      </Button>
                    </a>
                  </div>

                  <div className="px-5 sm:px-6 pb-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-primary-800 mb-2">
                        Who This Is For
                      </p>
                      <p className="text-sm text-gray-700 leading-relaxed mb-3">{details.whoThisIsFor}</p>
                      <div className="rounded-md bg-muted border border-border px-3.5 py-2.5">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-muted-fg mb-1">
                          Positioning Challenge
                        </p>
                        <p className="text-xs text-gray-700 leading-relaxed italic">{t.positioningChallenge}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-primary-800 mb-2">
                        What&apos;s Different About This Template
                      </p>
                      <ul className="space-y-2">
                        {details.highlights.map((item) => (
                          <li key={item} className="text-xs text-gray-700 leading-relaxed flex gap-2 border-b border-border pb-2 last:border-0">
                            <span className="text-primary-800 flex-shrink-0">▸</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-primary-800 mb-2">
                        Template Preview
                      </p>
                      <TemplatePreview details={details} color={arch.color} bgClass={arch.bgClass} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <ResumeVettingSection content={vettingSection} personas={personas} />

        {!quizComplete && persona && (
          <p className="text-sm text-muted-fg text-center">
            Profile hint: {PERSONA_LABELS[persona]?.label || persona}
          </p>
        )}
      </TierGate>
    </div>
  );
}
