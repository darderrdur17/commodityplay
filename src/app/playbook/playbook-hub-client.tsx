"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Clock, ChevronRight, Lock, CheckCircle } from "lucide-react";
import { CHAPTERS } from "@/data/playbook";
import { PRO_SUBSCRIPTION } from "@/data/pricing-shared";
import { CAREER_PLAN_HREF } from "@/lib/pricing-routes";

type Chapter = (typeof CHAPTERS)[number];
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnimatedProgress, Reveal, StaggerChildren, StaggerItem } from "@/components/animations";
import { hasAccess } from "@/lib/utils";

interface Props {
  chapters: readonly Chapter[];
  userTier: string;
  progress: Array<{ chapterId: string; progress: number; completed: boolean }>;
  requiredTier?: "PRO" | "ELITE";
}

export function PlaybookHubClient({
  chapters,
  userTier,
  progress,
  requiredTier = "PRO",
}: Props) {
  const getChapterProgress = (id: string) => progress.find((p) => p.chapterId === id);
  const completedCount = progress.filter((p) => p.completed).length;
  const totalProgress = progress.reduce((s, p) => s + p.progress, 0) / (5 * 100) * 100;
  const isPro = hasAccess(userTier, requiredTier);

  return (
    <div className="page-container py-8 sm:py-10">
      {/* Hero */}
      <section className="rounded-2xl bg-primary-800 px-8 py-12 mb-10 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #3280ff 0%, transparent 70%)" }} />
        <Reveal className="relative z-10">
          <div className="pill pill-dark mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            {isPro ? "Pro Access" : "Chapter A · Free Preview"}
          </div>
          <h1 className="font-serif text-4xl font-bold text-white mb-3">
            {isPro ? "The Full Playbook" : "Industry Foundations"}
          </h1>
          <p className="text-white/65 text-lg max-w-xl mb-6">
            {isPro
              ? "5 chapters · 40 sections · Industry foundations through commercial decision-making — sourced from the Pro Pack playbook."
              : "The ground-level understanding every serious learner of commodity trading needs before anything else. Three sections free. Five unlocked with Pro."}
          </p>
          {!isPro && (
            <div className="glass-card inline-flex px-5 py-3 text-sm text-white/80">
              <span className="font-semibold text-white">3 of 8 sections free.</span>
              <span className="ml-2">Sections A.4 – A.8 unlock with a Pro subscription ({PRO_SUBSCRIPTION.fullNote}).</span>
            </div>
          )}
          {isPro && (
            <div className="flex items-center gap-4 flex-wrap">
              <div className="glass-card px-5 py-3">
                <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Progress</p>
                <p className="text-white font-serif text-2xl font-bold">{Math.round(totalProgress)}%</p>
              </div>
              <div className="glass-card px-5 py-3">
                <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Chapters Done</p>
                <p className="text-white font-serif text-2xl font-bold">{completedCount}/5</p>
              </div>
              <div className="flex-1 min-w-[200px]">
                <AnimatedProgress value={totalProgress} className="h-2" color="rgba(223,242,255,0.7)" />
              </div>
            </div>
          )}
        </Reveal>
      </section>

      {/* Chapters */}
      <StaggerChildren className="space-y-4">
        {chapters.map((chapter, i) => {
          const prog = getChapterProgress(chapter.id);
          const isUnlocked = isPro || chapter.preview;
          const isCompleted = prog?.completed;
          const progressVal = prog?.progress || 0;

          return (
            <StaggerItem key={chapter.id}>
              <div
                className={`group relative rounded-2xl border overflow-hidden transition-all duration-200 ${
                  isUnlocked
                    ? "border-border bg-white hover:border-primary-line hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
                    : "border-border bg-secondary cursor-default"
                }`}
              >
                {/* Accent bar */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1"
                  style={{ background: chapter.color }}
                />

                <div className="pl-5 pr-6 py-5 flex items-start gap-5">
                  {/* Chapter indicator */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-serif text-xl font-bold"
                    style={{ background: chapter.color }}
                  >
                    {chapter.letter}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-1">
                      <div>
                        {chapter.preview && !isPro && (
                          <Badge variant="starter" size="sm" className="mb-2">Free Preview</Badge>
                        )}
                        <h2 className="font-serif font-bold text-gray-900 text-lg">
                          {chapter.title}
                        </h2>
                        <p className="text-sm text-muted-fg">{chapter.subtitle}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-xs text-muted-fg flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {chapter.readTime}
                        </span>
                        <span className="text-xs text-muted-fg flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5" /> {chapter.pages}p
                        </span>
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : !isUnlocked ? (
                          <Lock className="w-4 h-4 text-muted-fg" />
                        ) : null}
                      </div>
                    </div>

                    {/* Sections preview */}
                    <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-1.5 mt-3">
                      {chapter.sections.slice(0, 3).map((s) => (
                        <div key={s.title} className="text-xs text-muted-fg truncate">
                          <span className="text-primary-400 font-mono">{s.pages}</span> — {s.title}
                        </div>
                      ))}
                    </div>

                    {/* Progress bar */}
                    {isUnlocked && progressVal > 0 && (
                      <div className="mt-3">
                        <AnimatedProgress value={progressVal} />
                        <p className="text-xs text-muted-fg mt-1">{progressVal}% read</p>
                      </div>
                    )}
                  </div>

                  {/* CTA */}
                  <div className="flex-shrink-0">
                    {isUnlocked ? (
                      <Link href={`/playbook/${chapter.id}`}>
                        <Button variant="outline" size="sm" className="group-hover:bg-primary-400 group-hover:text-white group-hover:border-primary-400 transition-all">
                          {progressVal > 0 ? "Continue" : "Read"} <ChevronRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    ) : (
                      <Link href={CAREER_PLAN_HREF("pro")}>
                        <Button size="sm">
                          Unlock Pro
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </StaggerItem>
          );
        })}
      </StaggerChildren>
    </div>
  );
}
