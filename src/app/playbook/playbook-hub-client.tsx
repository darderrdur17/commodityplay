"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, ChevronRight, Lock, CheckCircle } from "lucide-react";
import type { PlaybookHubHeroCopy } from "@/data/playbook-hub-hero";
import {
  isPlaybookChapterReleasingSoon,
  resolvePlaybookChapterStatus,
  type PlaybookChapterRecord,
} from "@/lib/content/playbook-payload";
import type { ContentStats } from "@/lib/content/content-stats";
import { formatContentPlaceholders } from "@/lib/content/content-stat-placeholders";
import { CAREER_PLAN_HREF } from "@/lib/pricing-routes";
import { UPGRADE_TO_ACCESS } from "@/data/pricing-shared";
import { starterChapterPreviewLabel } from "@/data/starter-pack";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnimatedProgress, Reveal, StaggerChildren, StaggerItem } from "@/components/animations";
import { hasAccess } from "@/lib/utils";

type Chapter = PlaybookChapterRecord;

interface Props {
  chapters: readonly Chapter[];
  userTier: string;
  progress: Array<{ chapterId: string; progress: number; completed: boolean }>;
  requiredTier?: "PRO" | "ELITE";
  contentStats: Pick<ContentStats, "chapterCount" | "sectionCount">;
  hubHero: PlaybookHubHeroCopy;
  /** Admins can open releasing-soon chapters to draft-check. */
  canPreviewReleasingSoon?: boolean;
}

export function PlaybookHubClient({
  chapters,
  userTier,
  progress,
  requiredTier = "PRO",
  contentStats,
  hubHero,
  canPreviewReleasingSoon = false,
}: Props) {
  const { chapterCount, sectionCount } = contentStats;
  const statPlaceholders = { chapterCount, sectionCount };
  const proDescription = formatContentPlaceholders(hubHero.proDescription, statPlaceholders);
  const previewDescription = formatContentPlaceholders(hubHero.previewDescription, statPlaceholders)
    .replace("{starterPreviewLabel}", starterChapterPreviewLabel());
  const liveChapters = chapters.filter((ch) => resolvePlaybookChapterStatus(ch) === "live");
  const liveChapterCount = liveChapters.length;
  const liveProgress = progress.filter((p) => liveChapters.some((ch) => ch.id === p.chapterId));
  const getChapterProgress = (id: string) => progress.find((p) => p.chapterId === id);
  const completedCount = liveProgress.filter((p) => p.completed).length;
  const totalProgress =
    liveChapterCount > 0
      ? liveProgress.reduce((s, p) => s + p.progress, 0) / (liveChapterCount * 100) * 100
      : 0;
  const isPro = hasAccess(userTier, requiredTier);

  return (
    <div className="page-container py-8 sm:py-10">
      {/* Hero */}
      <section className="rounded-2xl bg-primary-800 px-8 py-12 mb-10 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #3280ff 0%, transparent 70%)" }} />
        <Reveal className="relative z-10">
          <div className="pill pill-dark mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            {isPro ? hubHero.proBadge : hubHero.previewBadge}
          </div>
          <h1 className="font-serif text-4xl font-bold text-white mb-3">
            {isPro ? hubHero.proTitle : hubHero.previewTitle}
          </h1>
          <p className="text-white/65 text-lg max-w-xl mb-6">
            {isPro
              ? proDescription
              : previewDescription}
          </p>
          {isPro && (
            <div className="flex items-center gap-4 flex-wrap">
              <div className="glass-card px-5 py-3">
                <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Progress</p>
                <p className="text-white font-serif text-2xl font-bold">{Math.round(totalProgress)}%</p>
              </div>
              <div className="glass-card px-5 py-3">
                <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Chapters Done</p>
                <p className="text-white font-serif text-2xl font-bold">
                  {completedCount}/{liveChapterCount}
                </p>
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
        {chapters.map((chapter) => {
          const prog = getChapterProgress(chapter.id);
          const releasingSoon = isPlaybookChapterReleasingSoon(chapter);
          const isUnlocked = !releasingSoon && (isPro || chapter.preview);
          const isCompleted = prog?.completed;
          const progressVal = prog?.progress || 0;

          return (
            <StaggerItem key={chapter.id}>
              <div
                className={`group relative rounded-2xl border overflow-hidden transition-all duration-200 ${
                  releasingSoon
                    ? "border-gray-200 bg-gray-50 cursor-default"
                    : isUnlocked
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
                          <Badge variant="starter" size="sm" className="mb-2">
                            {starterChapterPreviewLabel(chapter.sections.length)}
                          </Badge>
                        )}
                        <h2 className="font-serif font-bold text-gray-900 text-lg">
                          {chapter.title}
                        </h2>
                        <p className="text-sm text-muted-fg">{chapter.subtitle}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
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
                    {!releasingSoon && (
                    <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-1.5 mt-3">
                      {chapter.sections.slice(0, 3).map((s) => {
                        const num = s.number || (s as { pages?: string }).pages;
                        return (
                        <div key={s.id || s.title} className="text-xs text-muted-fg truncate">
                          <span className="text-primary-400 font-mono">{num}</span> — {s.title}
                        </div>
                        );
                      })}
                    </div>
                    )}

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
                    {releasingSoon ? (
                      canPreviewReleasingSoon ? (
                        <Link href={`/playbook/${chapter.id}`}>
                          <Button variant="outline" size="sm">
                            Preview <ChevronRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-200">
                          Releasing soon
                        </span>
                      )
                    ) : isUnlocked ? (
                      <Link href={`/playbook/${chapter.id}`}>
                        <Button variant="outline" size="sm" className="group-hover:bg-primary-400 group-hover:text-white group-hover:border-primary-400 transition-all">
                          {progressVal > 0 ? "Continue" : "Read"} <ChevronRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    ) : (
                      <Link href={CAREER_PLAN_HREF("pro")}>
                        <Button size="sm">
                          {UPGRADE_TO_ACCESS}
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
