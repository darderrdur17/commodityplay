"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, ChevronRight, ExternalLink, Lock, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Reveal } from "@/components/animations";
import { hasAccess } from "@/lib/utils";
import { UPGRADE_TO_ACCESS } from "@/data/pricing-shared";
import { CAREER_PLAN_HREF, SALES_PLAN_HREF } from "@/lib/pricing-routes";
import {
  CAREER_PREP_LIBRARY_SEED_TOPICS,
  PREP_LIBRARY_CATEGORIES,
  PREP_LIBRARY_SEGMENTS,
  SALES_PREP_LIBRARY_SEED_TOPICS,
  type PrepCategoryEnum,
  type PrepStatusEnum,
  type TalkingPoint,
  type PrepLibraryTrack,
} from "@/data/prep-library";
import { cn } from "@/lib/utils";
import { ModuleTrackBadge } from "@/components/dashboard/module-track-badge";

// ─── Shared types ────────────────────────────────────────────────────────────

interface TrackTheme {
  formHeader: string;
  iconWrapClass: string;
  iconClass: string;
  categoryBadgeClass: string;
  linkedTextClass: string;
  labelColorClass: string;
  textareaFocusClass: string;
  saveButtonClass: string;
  placeholders: {
    title: string;
    keyPoints: string;
    source: string;
    canUseFor: string;
  };
  defaultCategory: PrepCategoryEnum;
  saveButtonLabel: string;
  unlinkedLabel: string;
  upgradeDescription: string;
  upgradeHref: string;
  seedTopics: TalkingPoint[];
}

// ─── Track themes ─────────────────────────────────────────────────────────────

const TRACK_THEMES: Record<PrepLibraryTrack, TrackTheme> = {
  CAREER: {
    formHeader: "Add a talking point",
    iconWrapClass: "w-8 h-8 rounded-lg bg-primary-400/10 flex items-center justify-center",
    iconClass: "w-4 h-4 text-primary-400",
    categoryBadgeClass:
      "inline-flex shrink-0 rounded-full bg-primary-400/10 px-2.5 py-1 text-[11px] font-semibold text-primary-400",
    linkedTextClass: "text-xs font-semibold text-primary-400",
    labelColorClass: "text-muted-fg",
    textareaFocusClass: "focus:ring-primary-400",
    saveButtonClass: "",
    placeholders: {
      title: "e.g. Why cargo diversion happens",
      keyPoints: "Add up to 4 short bullets",
      source: "e.g. Chapter 4 · Weekly Market Update",
      canUseFor: "e.g. Meridian Energy interview",
    },
    defaultCategory: "Market mechanics",
    saveButtonLabel: "Save topic",
    unlinkedLabel: "Not yet linked to an interview",
    upgradeDescription:
      "Build your private prep library with talking points linked to upcoming interviews.",
    upgradeHref: CAREER_PLAN_HREF("pro"),
    seedTopics: CAREER_PREP_LIBRARY_SEED_TOPICS,
  },
  SALES: {
    formHeader: "Add a talking point",
    iconWrapClass: "w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center",
    iconClass: "w-4 h-4 text-teal-700",
    categoryBadgeClass:
      "inline-flex shrink-0 rounded-full bg-teal-100 px-2.5 py-1 text-[11px] font-semibold text-teal-800",
    linkedTextClass: "text-xs font-semibold text-teal-800",
    labelColorClass: "text-teal-800/70",
    textareaFocusClass: "focus:ring-teal-600",
    saveButtonClass: "bg-teal-800 hover:bg-teal-700 text-white border-0",
    placeholders: {
      title: "e.g. Framing this week's spread move",
      keyPoints: "Add up to 4 short bullets",
      source: "e.g. Chapter 4 · Weekly Market Update",
      canUseFor: "e.g. Meridian Energy",
    },
    defaultCategory: "Current event",
    saveButtonLabel: "Save topic",
    unlinkedLabel: "Not yet linked to a meeting",
    upgradeDescription:
      "Build your private prep library with talking points ready for your next client meeting.",
    upgradeHref: SALES_PLAN_HREF("pro"),
    seedTopics: SALES_PREP_LIBRARY_SEED_TOPICS,
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseKeyPoints(raw: string): string[] {
  return raw
    .split("\n")
    .map((line) => line.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 4);
}

const PREP_STATUS_STYLES: Record<PrepStatusEnum, { badge: string; label: string }> = {
  "Learning it": {
    badge: "inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600",
    label: "Learning it",
  },
  "Interview-ready": {
    badge: "inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700",
    label: "Interview-ready",
  },
  "Used it": {
    badge: "inline-flex rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-semibold text-green-700",
    label: "Used it",
  },
};

// ─── Topic card ───────────────────────────────────────────────────────────────

function TopicCard({
  topic,
  theme,
  onDelete,
}: {
  topic: TalkingPoint;
  theme: TrackTheme;
  onDelete?: (id: string) => void;
}) {
  const statusStyle = PREP_STATUS_STYLES[topic.prepStatus] ?? PREP_STATUS_STYLES["Learning it"];

  return (
    <article className="rounded-xl border border-border bg-secondary/30 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug flex-1">{topic.title}</h3>
        <div className="flex items-center gap-2 shrink-0">
          <span className={theme.categoryBadgeClass}>{topic.category}</span>
          <span className={statusStyle.badge}>{statusStyle.label}</span>
          {onDelete && (
            <button
              onClick={() => onDelete(topic.id)}
              className="p-1 rounded hover:bg-red-50 text-muted-fg hover:text-red-500 transition-colors"
              aria-label="Delete talking point"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
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

      <div className="pt-2.5 border-t border-border/60 space-y-1.5">
        {topic.canUseFor ? (
          <p className={theme.linkedTextClass}>Can use for: {topic.canUseFor}</p>
        ) : (
          <p className="text-xs font-medium text-muted-fg">{theme.unlinkedLabel}</p>
        )}
        {topic.source && (
          <p className="flex items-center gap-1 text-xs text-muted-fg">
            <ExternalLink className="w-3 h-3 shrink-0" />
            <span>{topic.source}</span>
          </p>
        )}
        {topic.usedInNote && (
          <p className="text-xs italic text-muted-fg">— {topic.usedInNote}</p>
        )}
      </div>
    </article>
  );
}

// ─── Compact card (lives inside the content grid) ────────────────────────────

export function PrepLibraryCard({
  track,
  userTier,
  topicCount,
  showTrackBadge = false,
}: {
  track: PrepLibraryTrack;
  userTier: string;
  topicCount: number;
  /** When true, show Career/Sales track pill for admin preview. */
  showTrackBadge?: boolean;
}) {
  const segment = PREP_LIBRARY_SEGMENTS[track];
  const theme = TRACK_THEMES[track];
  const unlocked = hasAccess(userTier, segment.requiredTier);

  return (
    <Reveal>
      <div
        className={cn(
          "relative h-full bg-white rounded-xl border transition-all duration-200 p-5",
          unlocked ? "border-border card-hover" : "border-border opacity-75"
        )}
      >
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

        <h3 className="font-semibold text-sm text-gray-900 mb-1">{segment.title}</h3>
        <p className="text-xs text-muted-fg mb-3 leading-relaxed">{segment.cardDescription}</p>

        <div className="flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="pro" size="sm">
              Pro
            </Badge>
            {showTrackBadge && (
              <ModuleTrackBadge track={track === "CAREER" ? "Career" : "Sales"} />
            )}
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-fg">
              {topicCount} saved
            </span>
          </div>

          {unlocked ? (
            <Link
              href="/dashboard/prep-library"
              className="text-xs text-primary-400 font-medium hover:text-primary-500 flex items-center gap-0.5 shrink-0"
            >
              Open <ChevronRight className="w-3.5 h-3.5" />
            </Link>
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
    </Reveal>
  );
}

// ─── Full-width body (rendered BELOW the content grid) ───────────────────────

export function PrepLibraryBody({
  track,
  userTier,
  onTopicCountChange,
}: {
  track: PrepLibraryTrack;
  userTier: string;
  onTopicCountChange?: (count: number) => void;
}) {
  const segment = PREP_LIBRARY_SEGMENTS[track];
  const theme = TRACK_THEMES[track];
  const unlocked = hasAccess(userTier, segment.requiredTier);

  // TODO: replace with DB persistence
  const [topics, setTopics] = useState<TalkingPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [keyPointsRaw, setKeyPointsRaw] = useState("");
  const [category, setCategory] = useState<PrepCategoryEnum>(theme.defaultCategory);
  const [source, setSource] = useState("");
  const [prepStatus, setPrepStatus] = useState<PrepStatusEnum>("Learning it");
  const [usedInNote, setUsedInNote] = useState("");
  const [canUseFor, setCanUseFor] = useState("");

  // Load from API on mount
  useEffect(() => {
    if (!unlocked) {
      onTopicCountChange?.(theme.seedTopics.length);
      setLoading(false);
      return;
    }

    fetch(`/api/prep-library?track=${track}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: TalkingPoint[]) => {
        const parsed = data.map((t) => ({ ...t, createdAt: new Date(t.createdAt) }));
        setTopics(parsed);
        onTopicCountChange?.(parsed.length);
      })
      .catch(() => {
        // Fall back to seed topics if API fails
        setTopics(theme.seedTopics);
        onTopicCountChange?.(theme.seedTopics.length);
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track, unlocked]);

  const handleSave = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmedTitle = title.trim();
      if (!trimmedTitle) return;

      const keyPoints = parseKeyPoints(keyPointsRaw);
      const body = {
        track,
        title: trimmedTitle,
        category,
        keyPoints,
        source: source.trim() || undefined,
        prepStatus,
        usedInNote: usedInNote.trim() || undefined,
        canUseFor: canUseFor.trim() || undefined,
      };

      try {
        const res = await fetch("/api/prep-library", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          const created: TalkingPoint = await res.json();
          const newTopics = [{ ...created, createdAt: new Date(created.createdAt) }, ...topics];
          setTopics(newTopics);
          onTopicCountChange?.(newTopics.length);
        }
      } catch {
        // Optimistic local-only fallback
        const optimistic: TalkingPoint = {
          id: `user-${Date.now()}`,
          createdAt: new Date(),
          ...body,
          prepStatus,
        };
        const newTopics = [optimistic, ...topics];
        setTopics(newTopics);
        onTopicCountChange?.(newTopics.length);
      }

      setTitle("");
      setKeyPointsRaw("");
      setCategory(theme.defaultCategory);
      setSource("");
      setPrepStatus("Learning it");
      setUsedInNote("");
      setCanUseFor("");
    },
    [title, keyPointsRaw, category, source, prepStatus, usedInNote, canUseFor, track, theme, topics, onTopicCountChange]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await fetch(`/api/prep-library/${id}`, { method: "DELETE" });
      } catch {
        // best-effort
      }
      setTopics((prev) => {
        const next = prev.filter((t) => t.id !== id);
        onTopicCountChange?.(next.length);
        return next;
      });
    },
    [onTopicCountChange]
  );

  const labelClass = cn(
    "text-[10px] font-bold uppercase tracking-widest",
    theme.labelColorClass
  );

  return (
    <Reveal className="mb-6">
      <section
        id={segment.anchor}
        aria-labelledby={`prep-library-heading-${track}`}
        className="rounded-xl border border-border bg-white overflow-hidden"
      >
        {/* Section header */}
        <div className="px-5 sm:px-6 py-5 border-b border-border">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-fg mb-1">
            {segment.eyebrow}
          </p>
          <h2
            id={`prep-library-heading-${track}`}
            className="font-semibold text-base text-gray-900"
          >
            {segment.title}
          </h2>
        </div>

        {!unlocked ? (
          /* Locked: blurred preview + upgrade CTA */
          <div className="relative">
            <div
              className="blur-sm pointer-events-none select-none px-5 sm:px-6 py-5 space-y-4"
              aria-hidden
            >
              {theme.seedTopics.slice(0, 2).map((topic) => (
                <TopicCard key={topic.id} topic={topic} theme={theme} />
              ))}
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm px-6 text-center py-10">
              <Lock className="w-5 h-5 text-muted-fg mb-2" />
              <p className="text-sm font-semibold text-gray-700 mb-1">Pro Pack required</p>
              <p className="text-xs text-muted-fg mb-4 max-w-xs">{theme.upgradeDescription}</p>
              <Link href={theme.upgradeHref}>
                <Button size="sm">{UPGRADE_TO_ACCESS}</Button>
              </Link>
            </div>
          </div>
        ) : (
          /* Unlocked: form + saved topics */
          <div className="px-5 sm:px-6 py-5 space-y-6">
            <form onSubmit={handleSave} className="space-y-4">
              <div className="flex items-center gap-2">
                <div className={theme.iconWrapClass}>
                  <BarChart3 className={theme.iconClass} />
                </div>
                <h3 className="font-semibold text-gray-900">{theme.formHeader}</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Title */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label htmlFor={`prep-topic-title-${track}`} className={labelClass}>
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

                {/* Key points */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label htmlFor={`prep-key-points-${track}`} className={labelClass}>
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

                {/* Category */}
                <div className="space-y-1.5">
                  <label htmlFor={`prep-category-${track}`} className={labelClass}>
                    Category
                  </label>
                  <select
                    id={`prep-category-${track}`}
                    value={category}
                    onChange={(e) => setCategory(e.target.value as PrepCategoryEnum)}
                    className={cn(
                      "flex w-full rounded-lg border border-border bg-white px-3 py-2 text-sm h-10",
                      "focus:outline-none focus:ring-2 focus:border-transparent",
                      theme.textareaFocusClass,
                      "transition-all duration-200"
                    )}
                  >
                    {PREP_LIBRARY_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Source */}
                <div className="space-y-1.5">
                  <label htmlFor={`prep-source-${track}`} className={labelClass}>
                    Source <span className="font-normal normal-case tracking-normal">(optional)</span>
                  </label>
                  <Input
                    id={`prep-source-${track}`}
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder={theme.placeholders.source}
                    className="h-10"
                  />
                </div>

                {/* Prep status */}
                <div className="sm:col-span-2 space-y-1.5">
                  <span className={labelClass}>Prep status</span>
                  <div className="flex gap-2 flex-wrap">
                    {(["Learning it", "Interview-ready", "Used it"] as PrepStatusEnum[]).map(
                      (status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setPrepStatus(status)}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150",
                            prepStatus === status
                              ? status === "Learning it"
                                ? "bg-gray-200 border-gray-300 text-gray-700"
                                : status === "Interview-ready"
                                ? "bg-amber-100 border-amber-300 text-amber-700"
                                : "bg-green-100 border-green-300 text-green-700"
                              : "bg-white border-border text-muted-fg hover:border-gray-300"
                          )}
                        >
                          {status}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Can use for */}
                <div className="space-y-1.5">
                  <label htmlFor={`prep-can-use-for-${track}`} className={labelClass}>
                    Can use for
                  </label>
                  <Input
                    id={`prep-can-use-for-${track}`}
                    value={canUseFor}
                    onChange={(e) => setCanUseFor(e.target.value)}
                    placeholder={theme.placeholders.canUseFor}
                    className="h-10"
                  />
                </div>

                {/* Used in note */}
                <div className="space-y-1.5">
                  <label htmlFor={`prep-used-in-note-${track}`} className={labelClass}>
                    Notes <span className="font-normal normal-case tracking-normal">(optional)</span>
                  </label>
                  <Input
                    id={`prep-used-in-note-${track}`}
                    value={usedInNote}
                    onChange={(e) => setUsedInNote(e.target.value)}
                    placeholder="e.g. Referenced this in my Meridian interview"
                    className="h-10"
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

            {loading ? (
              <p className="text-xs text-muted-fg">Loading your topics…</p>
            ) : topics.length > 0 ? (
              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-fg">
                  {topics.length} {topics.length === 1 ? "topic" : "topics"} saved
                </p>
                {topics.map((topic, i) => (
                  <Reveal key={topic.id} delay={i * 0.03}>
                    <TopicCard topic={topic} theme={theme} onDelete={handleDelete} />
                  </Reveal>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </section>
    </Reveal>
  );
}

// ─── Legacy export kept for backwards compat ─────────────────────────────────
export { PrepLibraryCard as PrepLibrarySection };
