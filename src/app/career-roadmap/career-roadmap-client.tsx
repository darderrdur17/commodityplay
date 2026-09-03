"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Clock, DollarSign, AlertTriangle, TrendingUp, Building2, Download, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TierGate } from "@/components/tier-gate";
import { Reveal } from "@/components/animations";
import { CAREER_ROLES, type CareerRole } from "@/data/career-roadmap";
import type { FunctionMatrixRow, TimelineQuarter, CompBenchmarks } from "@/data/career-roadmap-extras";
import type {
  CareerRoadmapPageHero,
  CareerRoadmapSectionCopy,
  GuideAttachment,
} from "@/lib/content/career-roadmap-payload";
import {
  DEFAULT_CAREER_ROADMAP_HERO,
  DEFAULT_FUNCTION_MATRIX_SECTION,
  DEFAULT_TIMELINE_SECTION,
  interpolateRoleCount,
} from "@/lib/content/career-roadmap-payload";
import { attachmentHref } from "@/lib/content/attachments";
import { getPersonaCareerGuide, getRecommendedRoleSlugs } from "@/data/persona-career";
import { PERSONA_LABELS } from "@/lib/utils";
import { PERSONA_ARCHETYPES } from "@/data/persona-archetypes";
import { apiPersonaToPersonaId } from "@/lib/resume-template-download";

const CAT_COLORS: Record<string, string> = {
  front: "#3280ff",
  ops: "#0F766E",
  middle: "#5B21B6",
  adjacent: "#B45309",
};

const DIFF_LABELS: Record<CareerRole["difficulty"], string> = {
  low: "Lower entry barrier",
  med: "Medium entry barrier",
  high: "High entry barrier",
};

interface Props {
  userTier: string;
  persona: string | null;
  roles?: CareerRole[];
  functionMatrix?: FunctionMatrixRow[];
  timeline12Month?: TimelineQuarter[];
  compBenchmarks?: CompBenchmarks;
  pageHero?: CareerRoadmapPageHero;
  functionMatrixSection?: CareerRoadmapSectionCopy;
  timelineSection?: CareerRoadmapSectionCopy;
  careerNavigationGuide?: GuideAttachment | null;
  requiredTier?: "PRO" | "ELITE";
}

export function CareerRoadmapClient({
  userTier,
  persona,
  roles = CAREER_ROLES,
  functionMatrix = [],
  timeline12Month = [],
  compBenchmarks,
  pageHero = DEFAULT_CAREER_ROADMAP_HERO,
  functionMatrixSection = DEFAULT_FUNCTION_MATRIX_SECTION,
  timelineSection = DEFAULT_TIMELINE_SECTION,
  careerNavigationGuide = null,
  requiredTier = "PRO",
}: Props) {
  const [activeSlug, setActiveSlug] = useState(roles[0]?.slug ?? "");
  const personaGuide = getPersonaCareerGuide(persona);
  const personaLabel = persona ? PERSONA_LABELS[persona]?.label : null;
  const personaId = apiPersonaToPersonaId(persona);
  const archetype = personaId ? PERSONA_ARCHETYPES[personaId] : null;
  const recommendedSlugs = useMemo(() => getRecommendedRoleSlugs(persona), [persona]);

  useEffect(() => {
    if (recommendedSlugs.length === 0) return;
    const first = roles.find((r) => recommendedSlugs.includes(r.slug));
    if (first) setActiveSlug(first.slug);
  }, [persona, recommendedSlugs, roles]);

  const role = roles.find((r) => r.slug === activeSlug) || roles[0];
  if (!role) {
    return <div className="page-container py-10 text-muted-fg">No career roles configured.</div>;
  }

  const color = CAT_COLORS[role.cat] || "#3280ff";

  return (
    <div className="page-container py-8 sm:py-10">
      <section className="rounded-2xl bg-primary-800 px-6 sm:px-8 py-10 mb-8 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #3280ff 0%, transparent 70%)" }} />
        <Reveal className="relative z-10">
          <div className="pill pill-dark mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" /> {pageHero.eyebrow}
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-3">
            {pageHero.title} <span className="text-accent italic">{pageHero.titleAccent}</span>
          </h1>
          <p className="text-white/65 text-base sm:text-lg max-w-xl">
            {interpolateRoleCount(pageHero.description, roles.length)}
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            {pageHero.stats.map((s) => (
              <div key={s.label} className="glass-card px-4 py-2.5 text-white text-sm">
                <span className="font-serif font-bold text-lg block">{interpolateRoleCount(s.num, roles.length)}</span>
                <span className="text-white/60 text-xs">{s.label}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <TierGate requiredTier={requiredTier} userTier={userTier}>
        {personaGuide && personaLabel && archetype ? (
          <Reveal className="mb-10 rounded-xl border border-primary-line bg-primary-soft/40 px-5 py-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-primary-800 mb-1">
              Your persona · {personaLabel}
            </p>
            <p className="font-semibold text-gray-900 text-sm mb-1">{personaGuide.headline}</p>
            <p className="text-sm text-muted-fg leading-relaxed mb-4">{personaGuide.tip}</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/resume-templates">
                <Button size="sm">
                  <Download className="w-4 h-4" />
                  Download {archetype.name} template
                </Button>
              </Link>
              <Link href="/resume-templates">
                <Button size="sm" variant="outline">
                  <FileText className="w-4 h-4" />
                  Retake persona quiz
                </Button>
              </Link>
            </div>
          </Reveal>
        ) : (
          <Reveal className="mb-10 rounded-xl border border-border bg-white px-5 py-4">
            <p className="text-sm text-muted-fg mb-3">
              Take the Persona Analysis Quiz on Resume Templates to highlight the roles and 12-month plan built for your archetype.
            </p>
            <Link href="/resume-templates">
              <Button size="sm" variant="outline">
                Find your archetype <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </Reveal>
        )}

        {/* Function matrix */}
        {functionMatrix.length > 0 && (
          <section className="mb-12">
            <Reveal className="mb-6">
              <p className="text-xs font-bold uppercase tracking-widest text-primary-800 mb-2">{functionMatrixSection.eyebrow}</p>
              <h2 className="font-serif text-2xl font-bold text-gray-900 mb-2">{functionMatrixSection.title}</h2>
              <p className="text-muted-fg text-sm max-w-2xl">
                {functionMatrixSection.description}
              </p>
            </Reveal>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="bg-primary-800 text-white/85">
                    <th className="text-left px-4 py-3 font-semibold">Role</th>
                    <th className="text-left px-4 py-3 font-semibold">Entry difficulty</th>
                    <th className="text-left px-4 py-3 font-semibold">Category</th>
                    <th className="text-left px-4 py-3 font-semibold">Path to desk</th>
                    <th className="text-left px-4 py-3 font-semibold">Key skills</th>
                  </tr>
                </thead>
                <tbody>
                  {functionMatrix.map((row, i) => (
                    <tr key={row.role} className={i % 2 === 0 ? "bg-white" : "bg-secondary/60"}>
                      <td className="px-4 py-3 font-semibold text-primary-800">{row.role}</td>
                      <td className="px-4 py-3 text-muted-fg">{row.difficulty}</td>
                      <td className="px-4 py-3">{row.category}</td>
                      <td className="px-4 py-3">{row.pathToDesk}</td>
                      <td className="px-4 py-3 text-muted-fg">{row.keySkills}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <h2 className="font-serif font-bold text-gray-900 mb-4">Roles</h2>
            <div className="space-y-2">
              {roles.map((r) => {
                const isRecommended = recommendedSlugs.includes(r.slug);
                return (
                <button
                  key={r.slug}
                  type="button"
                  onClick={() => setActiveSlug(r.slug)}
                  className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all ${
                    activeSlug === r.slug
                      ? "border-primary-400 bg-primary-soft"
                      : isRecommended
                        ? "border-primary-line bg-white hover:border-primary-400"
                        : "border-border hover:border-primary-line bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ background: CAT_COLORS[r.cat] }}
                    >
                      {r.id}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-gray-900 leading-tight truncate">{r.title}</p>
                      <p className="text-xs text-muted-fg">
                        {isRecommended ? "Recommended for you · " : ""}
                        {r.categoryLabel}
                      </p>
                    </div>
                  </div>
                </button>
              );
              })}
            </div>
          </div>

          <div className="lg:col-span-2">
            <motion.div
              key={activeSlug}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-5"
            >
              <div className="bg-white rounded-2xl border border-border p-6 sm:p-7">
                <div className="flex flex-wrap gap-2 mb-4">
                  {role.tags.map((t) => (
                    <Badge key={t.label} size="sm">{t.label}</Badge>
                  ))}
                </div>
                <h2 className="font-serif text-2xl font-bold text-gray-900 mb-2">{role.title}</h2>
                <p className="text-muted-fg text-sm mb-5">{role.summary}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                  <div className="bg-secondary rounded-xl p-4">
                    <div className="flex items-center gap-2 text-muted-fg text-xs mb-1">
                      <Clock className="w-3.5 h-3.5" /> Typical timeline
                    </div>
                    <p className="font-semibold text-gray-900 text-sm">{role.timeline}</p>
                    <p className="text-xs text-muted-fg mt-1">{DIFF_LABELS[role.difficulty]}</p>
                  </div>
                  <div className="bg-secondary rounded-xl p-4">
                    <div className="flex items-center gap-2 text-muted-fg text-xs mb-1">
                      <Building2 className="w-3.5 h-3.5" /> Typical firms
                    </div>
                    <p className="font-semibold text-gray-900 text-sm">{role.firms}</p>
                  </div>
                </div>

                <div className="mb-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-fg mb-2">What the role actually involves</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{role.what}</p>
                </div>

                <div className="mb-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-fg mb-2 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5" /> Compensation benchmarks (SGD)
                  </p>
                  <div className="space-y-2">
                    {role.comp.map((c) => (
                      <div key={c.label} className="flex justify-between text-sm border-b border-border pb-2">
                        <span className="text-muted-fg">{c.label}</span>
                        <span className="font-semibold text-gray-900">{c.range}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-start gap-2 text-sm text-primary-800 bg-primary-soft rounded-xl p-4">
                  <TrendingUp className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color }} />
                  <div>
                    <p className="font-semibold mb-1">Upgrade path</p>
                    <p className="text-primary-900/80">{role.upgrade}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-border p-6 sm:p-7">
                <h3 className="font-serif font-bold text-gray-900 mb-3">Typical backgrounds</h3>
                <ul className="space-y-2 mb-6">
                  {role.backgrounds.map((b, i) => (
                    <li key={i} className="text-sm text-gray-700 flex gap-2">
                      <span className="text-primary-400">·</span>
                      <span dangerouslySetInnerHTML={{ __html: b.replace(/\*\*/g, "") }} />
                    </li>
                  ))}
                </ul>

                <h3 className="font-serif font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> Red flags for hiring managers
                </h3>
                <ul className="space-y-2">
                  {role.redFlags.map((f, i) => (
                    <li key={i} className="text-sm text-gray-700 flex gap-2">
                      <span className="text-amber-500">!</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>
        </div>

        {/* 12-month timeline */}
        {timeline12Month.length > 0 && (
          <section className="mt-16">
            <Reveal className="mb-8 text-center max-w-2xl mx-auto">
              <p className="text-xs font-bold uppercase tracking-widest text-primary-800 mb-2">{timelineSection.eyebrow}</p>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{timelineSection.title}</h2>
              <p className="text-muted-fg text-sm">
                {timelineSection.description}
              </p>
            </Reveal>
            <div className="max-w-3xl mx-auto space-y-8">
              {timeline12Month.map((q, qi) => (
                <Reveal key={q.quarter}>
                  <div
                    className={`flex gap-4 rounded-xl p-4 -mx-4 ${
                      personaGuide && qi === personaGuide.focusQuarterIndex ? "bg-primary-soft/40 ring-1 ring-primary-line" : ""
                    }`}
                  >
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div
                        className={`w-3 h-3 rounded-full mt-1.5 ${
                          personaGuide && qi === personaGuide.focusQuarterIndex ? "bg-primary-800" : "bg-primary-400"
                        }`}
                      />
                      <div className="w-px flex-1 bg-border min-h-[40px]" />
                    </div>
                    <div className="pb-2">
                      {personaGuide && qi === personaGuide.focusQuarterIndex && (
                        <Badge size="sm" className="mb-2 bg-accent text-primary-900">
                          Resume rewrite quarter · {personaLabel ?? "your persona"}
                        </Badge>
                      )}
                      <p className="text-[10px] font-bold uppercase tracking-widest text-primary-800 mb-1">{q.quarter}</p>
                      <h3 className="font-serif font-semibold text-gray-900 mb-3">{q.title}</h3>
                      <ul className="space-y-2">
                        {q.items.map((item) => (
                          <li key={item.slice(0, 40)} className="text-sm text-gray-700 flex gap-2">
                            <span className="text-primary-400 flex-shrink-0">·</span>
                            {item.includes("Resume Templates module") ? (
                              <>
                                Rewrite your resume using your archetype template from the{" "}
                                <Link href="/resume-templates" className="text-primary-800 font-semibold hover:underline">
                                  Resume Templates
                                </Link>{" "}
                                module. Every bullet must demonstrate commercial awareness, not just activity.
                              </>
                            ) : (
                              item
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>
        )}

        <section className="mt-16">
          <Reveal>
            <div className="rounded-2xl border border-primary-line bg-primary-soft/50 p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold uppercase tracking-widest text-primary-800 mb-1">
                  Career Navigation Guide
                </p>
                <h2 className="font-serif text-xl font-bold text-gray-900 mb-1">
                  {careerNavigationGuide?.label || "Download the Career Navigation Guide"}
                </h2>
                {careerNavigationGuide?.fileName && (
                  <p className="text-sm text-muted-fg">{careerNavigationGuide.fileName}</p>
                )}
              </div>
              {careerNavigationGuide?.assetId ? (
                <a
                  href={attachmentHref(`/api/content/assets/${careerNavigationGuide.assetId}`, "download")}
                  download={careerNavigationGuide.fileName || "career-navigation-guide.pdf"}
                >
                  <Button>
                    <Download className="w-4 h-4" />
                    Download PDF
                  </Button>
                </a>
              ) : (
                <Button disabled>
                  <Download className="w-4 h-4" />
                  PDF coming soon
                </Button>
              )}
            </div>
          </Reveal>
        </section>

        {/* Comp benchmarks */}
        {compBenchmarks && compBenchmarks.cards.length > 0 && (
          <section className="mt-16 pt-16 border-t border-border">
            <Reveal className="mb-8 text-center max-w-2xl mx-auto">
              <p className="text-xs font-bold uppercase tracking-widest text-primary-800 mb-2">
                {compBenchmarks.eyebrow}
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                {compBenchmarks.title}
              </h2>
              <p className="text-muted-fg text-sm leading-relaxed">{compBenchmarks.description}</p>
            </Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {compBenchmarks.cards.map((card, index) => (
                <Reveal key={card.role} delay={index * 0.04}>
                  <div className="rounded-xl border border-border bg-white p-5 h-full">
                    <p className="text-sm font-semibold text-primary-800 mb-2">{card.role}</p>
                    <p className="font-serif text-2xl font-bold text-gray-900 mb-1">{card.range}</p>
                    <p className="text-xs text-muted-fg">{card.note}</p>
                  </div>
                </Reveal>
              ))}
            </div>
            {compBenchmarks.footnote && (
              <Reveal className="mt-6">
                <p className="text-xs text-muted-fg text-center max-w-2xl mx-auto leading-relaxed">
                  {compBenchmarks.footnote}
                </p>
              </Reveal>
            )}
          </section>
        )}
      </TierGate>
    </div>
  );
}
