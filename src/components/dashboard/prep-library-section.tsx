"use client";

import React, { useCallback, useState } from "react";
import Link from "next/link";
import { BarChart3, ChevronDown, ChevronRight, ChevronUp, Lock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Reveal } from "@/components/animations";
import { hasAccess } from "@/lib/utils";
import { UPGRADE_TO_ACCESS } from "@/data/pricing-shared";
import { CAREER_PLAN_HREF, SALES_PLAN_HREF } from "@/lib/pricing-routes";
import {
  CAREER_PREP_LIBRARY_SEED_TOPICS,
  PREP_LIBRARY_SEGMENTS,
  SALES_PREP_LIBRARY_SEED_TOPICS,
  type PrepLibraryTopic,
  type PrepLibraryTrack,
} from "@/data/prep-library";
import { cn } from "@/lib/utils";

interface PrepLibrarySectionProps {
  track: PrepLibraryTrack;
  userTier: string;
}

interface TrackTheme {
  formHeader: string;
  iconWrapClass: string;
  iconClass: string;
  categoryBadgeClass: string;
  linkedBadgeClass: string;
  linkedTextClass: string;
  labelColorClass: string;
  textareaFocusClass: string;
  saveButtonClass: string;
  placeholders: {
    title: string;
    keyPoints: string;
    category: string;
    canUseFor: string;
  };
  defaultCategory: string;
  saveButtonLabel: string;
  linkedLabel: (target: string) => string;
  unlinkedLabel: string;
  upgradeDescription: string;
  upgradeHref: string;
  seedTopics: PrepLibraryTopic[];
  parseUsageTarget: (raw: string) => string | undefined;
}

const TRACK_THEMES: Record<PrepLibraryTrack, TrackTheme> = {
  CAREER: {
    formHeader: "Add a talking point",
    iconWrapClass: "w-8 h-8 rounded-lg bg-primary-400/10 flex items-center justify-center",
    iconClass: "w-4 h-4 text-primary-400",
    categoryBadgeClass:
      "inline-flex shrink-0 rounded-full bg-primary-400/10 px-2.5 py-1 text-[11px] font-semibold text-primary-400",
    linkedBadgeClass: "",
    linkedTextClass: "text-xs font-semibold text-primary-400",
    labelColorClass: "text-muted-fg",
    textareaFocusClass: "focus:ring-primary-400",
    saveButtonClass: "",
    placeholders: {
      title: "e.g. Why cargo diversion happens",
      keyPoints: "Add up to 4 short bullets",
      category: "Market mechanics",
      canUseFor: "e.g. Meridian Energy interview",
    },
    defaultCategory: "Market mechanics",
    saveButtonLabel: "Save topic",
    linkedLabel: (target) => `Can use for ${target} interview`,
    unlinkedLabel: "Not yet linked to an interview",
    upgradeDescription:
      "Build your private prep library with talking points linked to upcoming interviews.",
    upgradeHref: CAREER_PLAN_HREF("pro"),
    seedTopics: CAREER_PREP_LIBRARY_SEED_TOPICS,
    parseUsageTarget: (raw) => {
      const trimmed = raw.trim();
      if (!trimmed) return undefined;
      const match = trimmed.match(/^(.+?)\s+interview$/i);
      return match ? match[1].trim() : trimmed;
    },
  },
  SALES: {
    formHeader: "Add a talking point",
    iconWrapClass: "w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center",
    iconClass: "w-4 h-4 text-teal-700",
    categoryBadgeClass:
      "inline-flex shrink-0 rounded-full bg-teal-100 px-2.5 py-1 text-[11px] font-semibold text-teal-800",
    linkedBadgeClass:
      "inline-flex rounded-full bg-teal-100 px-2.5 py-1 text-[11px] font-semibold text-teal-800",
    linkedTextClass: "text-xs font-semibold text-teal-800",
    labelColorClass: "text-teal-800/70",
    textareaFocusClass: "focus:ring-teal-600",
    saveButtonClass: "bg-teal-800 hover:bg-teal-700 text-white border-0",
    placeholders: {
      title: "e.g. Framing this week's spread move",
      keyPoints: "Add up to 4 short bullets",
      category: "Current event",
      canUseFor: "e.g. Meridian Energy",
    },
    defaultCategory: "Current event",
    saveButtonLabel: "Save topic",
    linkedLabel: (target) => `Used in: ${target}`,
    unlinkedLabel: "Not yet linked to a meeting",
    upgradeDescription:
      "Build your private prep library with talking points ready for your next client meeting.",
    upgradeHref: SALES_PLAN_HREF("pro"),
    seedTopics: SALES_PREP_LIBRARY_SEED_TOPICS,
    parseUsageTarget: (raw) => {
      const trimmed = raw.trim();
      if (!trimmed) return undefined;
      const match = trimmed.match(/^used in:\s*(.+)$/i);
      return match ? match[1].trim() : trimmed;
    },
  },
};

function parseKeyPoints(raw: string): string[] {
  return raw
    .split("\n")
    .map((line) => line.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 4);
}

function TopicCard({ topic, theme }: { topic: PrepLibraryTopic; theme: TrackTheme }) {
  const linked = Boolean(topic.usageTarget);

  return (
    <article className="rounded-xl border border-border bg-secondary/30 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug">{topic.title}</h3>
        <span className={theme.categoryBadgeClass}>{topic.category}</span>
      </div>

      {topic.keyPoints.length > 0 && (
        <ul className="space-y-1.5 mb-3">
          {topic.keyPoints.map((point) => (
            <li key={point} className="flex gap-2 text-sm text-muted-fg leading-relaxed">
              <span className="text-gray-400 shrink-0">—</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="pt-2.5 border-t border-border/60">
        {linked ? (
          theme.linkedBadgeClass ? (
            <span className={theme.linkedBadgeClass}>
              {theme.linkedLabel(topic.usageTarget!)}
            </span>
          ) : (
            <p className={theme.linkedTextClass}>
              {theme.linkedLabel(topic.usageTarget!)}
            </p>
          )
        ) : (
          <p className="text-xs font-medium text-muted-fg">{theme.unlinkedLabel}</p>
        )}
        {topic.note && (
          <p className="mt-1.5 text-xs italic text-muted-fg">— {topic.note}</p>
        )}
      </div>
    </article>
  );
}

export function PrepLibrarySection({ track, userTier }: PrepLibrarySectionProps) {
  const segment = PREP_LIBRARY_SEGMENTS[track];
  const theme = TRACK_THEMES[track];
  const unlocked = hasAccess(userTier, segment.requiredTier);

  // Body collapsed by default — tap Open to expand, matching other card behaviour
  const [expanded, setExpanded] = useState(false);

  const [topics, setTopics] = useState<PrepLibraryTopic[]>(theme.seedTopics);
  const [title, setTitle] = useState("");
  const [keyPointsRaw, setKeyPointsRaw] = useState("");
  const [category, setCategory] = useState("");
  const [canUseFor, setCanUseFor] = useState("");

  const topicCount = topics.length;

  const handleSave = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmedTitle = title.trim();
      if (!trimmedTitle) return;

      const keyPoints = parseKeyPoints(keyPointsRaw);
      const usageTarget = theme.parseUsageTarget(canUseFor);

      setTopics((prev) => [
        {
          id: `user-${Date.now()}`,
          title: trimmedTitle,
          category: category.trim() || theme.defaultCategory,
          keyPoints,
          usageTarget,
        },
        ...prev,
      ]);

      setTitle("");
      setKeyPointsRaw("");
      setCategory("");
      setCanUseFor("");
    },
    [title, keyPointsRaw, category, canUseFor, theme]
  );

  return (
    <Reveal className="mb-4">
      <section
        id={segment.anchor}
        aria-labelledby={`prep-library-heading-${track}`}
        className={cn(
          "rounded-xl border bg-white overflow-hidden transition-all duration-200",
          unlocked ? "border-border card-hover" : "border-border opacity-75"
        )}
      >
        {/* Compact card header — identical structure to other content cards */}
        <div className="relative p-5">
          {!unlocked && (
            <div className="absolute top-3 right-3">
              <Lock className="w-3.5 h-3.5 text-muted-fg" />
            </div>
          )}

          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
            style={{ background: `${segment.color}12` }}
          >
            <BarChart3 className="w-4.5 h-4.5" style={{ color: segment.color }} />
          </div>

          <h2
            id={`prep-library-heading-${track}`}
            className="font-semibold text-sm text-gray-900 mb-1"
          >
            {segment.title}
          </h2>
          <p className="text-xs text-muted-fg mb-3 leading-relaxed">
            {segment.cardDescription}
          </p>

          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="pro" size="sm">
                Pro
              </Badge>
              <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-fg">
                {topicCount} saved
              </span>
            </div>

            {unlocked ? (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="text-xs text-primary-400 font-medium hover:text-primary-500 flex items-center gap-0.5 shrink-0"
                aria-expanded={expanded}
                aria-controls={`${segment.anchor}-body`}
              >
                {expanded ? (
                  <>Collapse <ChevronUp className="w-3.5 h-3.5" /></>
                ) : (
                  <>Open <ChevronRight className="w-3.5 h-3.5" /></>
                )}
              </button>
            ) : (
              <Link
                href={theme.upgradeHref}
                className="text-xs font-medium text-primary-400 hover:text-primary-500 flex items-center gap-0.5 shrink-0"
              >
                {UPGRADE_TO_ACCESS} <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>

        {/* Expandable body — only shown when Open is tapped or locked preview */}
        {(expanded || !unlocked) && (
          <div id={`${segment.anchor}-body`} className="border-t border-border">
            {!unlocked ? (
              <div className="relative">
                {/* Blurred locked preview */}
                <div
                  className="blur-sm pointer-events-none select-none px-5 py-5 space-y-4"
                  aria-hidden
                >
                  {topics.slice(0, 2).map((topic) => (
                    <TopicCard key={topic.id} topic={topic} theme={theme} />
                  ))}
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm px-6 text-center">
                  <Lock className="w-5 h-5 text-muted-fg mb-2" />
                  <p className="text-sm font-semibold text-gray-700 mb-1">Pro Pack required</p>
                  <p className="text-xs text-muted-fg mb-4 max-w-xs">{theme.upgradeDescription}</p>
                  <Link href={theme.upgradeHref}>
                    <Button size="sm">{UPGRADE_TO_ACCESS}</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="px-5 py-5 space-y-6">
                {/* Add form */}
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className={theme.iconWrapClass}>
                      <BarChart3 className={theme.iconClass} />
                    </div>
                    <h3 className="font-semibold text-gray-900">{theme.formHeader}</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2 space-y-1.5">
                      <label
                        htmlFor={`prep-topic-title-${track}`}
                        className={cn(
                          "text-[10px] font-bold uppercase tracking-widest",
                          theme.labelColorClass
                        )}
                      >
                        Topic title
                      </label>
                      <Input
                        id={`prep-topic-title-${track}`}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={theme.placeholders.title}
                        className="h-10"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1.5">
                      <label
                        htmlFor={`prep-key-points-${track}`}
                        className={cn(
                          "text-[10px] font-bold uppercase tracking-widest",
                          theme.labelColorClass
                        )}
                      >
                        Key points
                      </label>
                      <textarea
                        id={`prep-key-points-${track}`}
                        value={keyPointsRaw}
                        onChange={(e) => setKeyPointsRaw(e.target.value)}
                        placeholder={theme.placeholders.keyPoints}
                        rows={3}
                        className={cn(
                          "flex w-full rounded-lg border border-border bg-white px-3 py-2 text-sm",
                          "placeholder:text-muted-fg resize-none",
                          "focus:outline-none focus:ring-2 focus:border-transparent",
                          theme.textareaFocusClass,
                          "transition-all duration-200"
                        )}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor={`prep-category-${track}`}
                        className={cn(
                          "text-[10px] font-bold uppercase tracking-widest",
                          theme.labelColorClass
                        )}
                      >
                        Category
                      </label>
                      <Input
                        id={`prep-category-${track}`}
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder={theme.placeholders.category}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor={`prep-can-use-for-${track}`}
                        className={cn(
                          "text-[10px] font-bold uppercase tracking-widest",
                          theme.labelColorClass
                        )}
                      >
                        Can use for
                      </label>
                      <Input
                        id={`prep-can-use-for-${track}`}
                        value={canUseFor}
                        onChange={(e) => setCanUseFor(e.target.value)}
                        placeholder={theme.placeholders.canUseFor}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={!title.trim()}
                    className={cn("gap-1.5", theme.saveButtonClass)}
                  >
                    <Plus className="w-4 h-4" />
                    {theme.saveButtonLabel}
                  </Button>
                </form>

                {/* Saved topics */}
                {topics.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-fg">
                      {topicCount} {topicCount === 1 ? "topic" : "topics"} saved
                    </p>
                    {topics.map((topic, i) => (
                      <Reveal key={topic.id} delay={i * 0.03}>
                        <TopicCard topic={topic} theme={theme} />
                      </Reveal>
                    ))}
                  </div>
                )}

                {/* Collapse button at bottom */}
                <button
                  type="button"
                  onClick={() => setExpanded(false)}
                  className="w-full flex items-center justify-center gap-1 text-xs text-muted-fg hover:text-gray-700 pt-2 transition-colors"
                >
                  <ChevronDown className="w-3.5 h-3.5 rotate-180" />
                  Collapse
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </Reveal>
  );
}
