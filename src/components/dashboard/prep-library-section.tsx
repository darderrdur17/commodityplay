"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, Bookmark, ChevronRight, ExternalLink, Lock, Plus, Trash2 } from "lucide-react";
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
  PREP_LIBRARY_EXAMPLE_TOPICS,
  PREP_LIBRARY_SEGMENTS,
  PREP_STATUS_PRESETS,
  SALES_PREP_LIBRARY_SEED_TOPICS,
  type PrepCategoryEnum,
  type PrepStatusEnum,
  type TalkingPoint,
  type PrepLibraryTrack,
} from "@/data/prep-library";
import { cn } from "@/lib/utils";
import {
  SALES_HERO_GREEN,
} from "@/lib/sales-brand-colors";
import { ModuleTrackBadge } from "@/components/dashboard/module-track-badge";
import { BookmarkUnderAccountModal } from "@/components/dashboard/bookmark-under-account-modal";

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
    category: string;
    canUseFor: string;
    usedInNote: string;
  };
  defaultCategory: PrepCategoryEnum;
  saveButtonLabel: string;
  unlinkedLabel: string;
  upgradeDescription: string;
  upgradeHref: string;
  seedTopics: TalkingPoint[];
}

/** Frances mockup — forest green sales palette (see TRACK_THEMES.SALES) */

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
      category: "e.g. current event, market mechanics, role movement etc",
      canUseFor: "e.g. Meridian Energy interview",
      usedInNote: "e.g. Referenced this in my Meridian interview",
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
    iconWrapClass: "w-8 h-8 rounded-lg bg-[#065F46]/10 flex items-center justify-center",
    iconClass: "w-4 h-4 text-[#065F46]",
    categoryBadgeClass:
      "inline-flex shrink-0 rounded-full bg-teal-50 px-2.5 py-0.5 text-[11px] font-semibold text-[#065F46]",
    linkedTextClass: "text-xs font-semibold text-[#065F46]",
    labelColorClass: "text-[#065F46]/70",
    textareaFocusClass: "focus:ring-[#065F46]",
    saveButtonClass: "bg-[#065F46] hover:bg-[#047857] text-white border-0",
    placeholders: {
      title: "e.g. Framing this week's spread move",
      keyPoints: "Add up to 4 short bullets",
      source: "e.g. Chapter 4 · Weekly Market Update",
      category: "Current event",
      canUseFor: "e.g. Meridian Energy",
      usedInNote: "e.g. Referenced this in my Meridian client meeting",
    },
    defaultCategory: "Current event",
    saveButtonLabel: "Save topic",
    unlinkedLabel: "Not yet used with an account",
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

/** Map free-text category input to the closest enum value. */
function normalizeCategoryInput(raw: string, fallback: PrepCategoryEnum): PrepCategoryEnum {
  const trimmed = raw.trim();
  if (!trimmed) return fallback;

  const exact = PREP_LIBRARY_CATEGORIES.find((c) => c.toLowerCase() === trimmed.toLowerCase());
  if (exact) return exact;

  const lower = trimmed.toLowerCase();
  if (lower.includes("current event")) return "Current event";
  if (lower.includes("market mechanic")) return "Market mechanics";
  if (lower.includes("risk") || lower.includes("pricing")) return "Risk & pricing";
  if (lower.includes("logistic")) return "Logistics";

  return "Other";
}

/** Group talking points by month/year for long lists (newest first). */
function groupTopicsByMonthYear(
  topics: TalkingPoint[]
): { label: string; topics: TalkingPoint[] }[] {
  const sorted = [...topics].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const groups = new Map<string, TalkingPoint[]>();

  for (const topic of sorted) {
    const label = new Date(topic.createdAt).toLocaleDateString("en-GB", {
      month: "long",
      year: "numeric",
    });
    const bucket = groups.get(label) ?? [];
    bucket.push(topic);
    groups.set(label, bucket);
  }

  return Array.from(groups.entries()).map(([label, groupTopics]) => ({
    label,
    topics: groupTopics,
  }));
}

const PREP_STATUS_STYLES: Record<
  (typeof PREP_STATUS_PRESETS)[number],
  { badge: string; label: string }
> = {
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

function getPrepStatusBadge(status: string): { badge: string; label: string } {
  const preset = PREP_STATUS_STYLES[status as (typeof PREP_STATUS_PRESETS)[number]];
  if (preset) return preset;
  return {
    badge:
      "inline-flex rounded-full bg-primary-400/10 px-2.5 py-1 text-[11px] font-semibold text-primary-400",
    label: status,
  };
}

/** Sticky sidebar / mobile chips to filter topics by month/year. */
function MonthYearFilterBar({
  groups,
  value,
  onChange,
  className,
  orientation = "vertical",
  accent = "career",
}: {
  groups: { label: string; topics: TalkingPoint[] }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  orientation?: "vertical" | "horizontal";
  accent?: "career" | "sales";
}) {
  if (groups.length === 0) return null;

  const activeClass =
    accent === "sales"
      ? "bg-[#065F46]/10 text-[#065F46]"
      : "bg-primary-400/10 text-primary-400";

  const buttonClass = (active: boolean) =>
    cn(
      "rounded-lg text-left text-xs font-medium transition-colors",
      orientation === "vertical" ? "w-full px-3 py-2" : "shrink-0 px-3 py-1.5",
      active ? activeClass : "text-muted-fg hover:bg-secondary hover:text-gray-900"
    );

  return (
    <nav
      aria-label="Filter topics by month"
      className={cn(
        orientation === "vertical" ? "space-y-1" : "flex gap-2 overflow-x-auto pb-1",
        className
      )}
    >
      <p
        className={cn(
          "text-[10px] font-bold uppercase tracking-widest text-muted-fg",
          orientation === "horizontal" ? "sr-only" : "mb-2 px-1"
        )}
      >
        Filter by date
      </p>
      <button type="button" onClick={() => onChange("all")} className={buttonClass(value === "all")}>
        All topics
      </button>
      {groups.map((group) => (
        <button
          key={group.label}
          type="button"
          onClick={() => onChange(group.label)}
          className={buttonClass(value === group.label)}
        >
          {group.label}
          <span className="ml-1 text-[10px] font-normal opacity-70">({group.topics.length})</span>
        </button>
      ))}
    </nav>
  );
}

export const PREP_LIBRARY_COUNT_EVENT = "prep-library:count";

function TopicsSavedStatBox({
  count,
  loading,
  accentColor,
}: {
  count: number;
  loading: boolean;
  accentColor: string;
}) {
  return (
    <div className="inline-flex flex-col rounded-xl border border-border bg-white px-5 py-3 min-w-[120px] shadow-sm">
      <span className="text-3xl font-bold leading-none" style={{ color: accentColor }}>
        {loading ? "…" : count}
      </span>
      <span className="text-xs font-medium text-muted-fg mt-1">Topics saved</span>
    </div>
  );
}

function ExampleBadge() {
  return (
    <span className="inline-flex shrink-0 rounded-full border border-border bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-fg">
      Example
    </span>
  );
}

function notifyPrepLibraryCount(
  track: PrepLibraryTrack,
  count: number,
  onTopicCountChange?: (count: number) => void
) {
  onTopicCountChange?.(count);
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(PREP_LIBRARY_COUNT_EVENT, { detail: { track, count } })
    );
  }
}

// ─── Topic card ───────────────────────────────────────────────────────────────

function TopicCard({
  topic,
  theme,
  onDelete,
  showLinkedFields = true,
}: {
  topic: TalkingPoint;
  theme: TrackTheme;
  onDelete?: (id: string) => void;
  /** Sales-only: can use for / notes. Hidden on career track. */
  showLinkedFields?: boolean;
}) {
  const statusStyle = getPrepStatusBadge(topic.prepStatus);
  const showExampleBadge = Boolean(topic.isStarterExample);

  return (
    <article className="rounded-xl border border-border bg-secondary/30 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug flex-1">{topic.title}</h3>
        <div className="flex items-center gap-2 shrink-0">
          {showExampleBadge && <ExampleBadge />}
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
        {showLinkedFields &&
          (topic.canUseFor ? (
            <p className={theme.linkedTextClass}>Can use for: {topic.canUseFor}</p>
          ) : (
            <p className="text-xs font-medium text-muted-fg">{theme.unlinkedLabel}</p>
          ))}
        {topic.source && (
          <p className="flex items-center gap-1 text-xs text-muted-fg">
            <ExternalLink className="w-3 h-3 shrink-0" />
            <span>{topic.source}</span>
          </p>
        )}
        {showLinkedFields && topic.usedInNote && (
          <p className="text-xs italic text-muted-fg">— {topic.usedInNote}</p>
        )}
      </div>
    </article>
  );
}

/** Bottom CTA — links prep topics to Account Intelligence (Elite). */
function SalesAccountIntelligenceBanner({ userTier }: { userTier: string }) {
  const hasElite = hasAccess(userTier, "ELITE");
  const href = hasElite ? "/dashboard/account-intelligence" : SALES_PLAN_HREF("elite");
  const buttonLabel = hasElite ? "Open Account Intelligence" : "Unlock Account Intelligence";

  return (
    <div className="rounded-xl bg-[#1a4fd6] px-6 py-5 sm:px-8 sm:py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
      <div className="space-y-1.5 min-w-0">
        <h2 className="text-base sm:text-lg font-bold text-white leading-snug">
          Link Topics to an Account?
        </h2>
        <p className="text-sm text-white/90 max-w-xl leading-relaxed">
          Attach a saved topic from your Prep Library to any account you&apos;re tracking — so
          it&apos;s ready right where you need it.
        </p>
      </div>
      <Link href={href} className="shrink-0 self-start sm:self-center">
        <Button
          size="sm"
          className="bg-[#3280ff] hover:bg-[#2870e8] text-white border-0 rounded-lg h-10 px-5 text-sm font-semibold"
        >
          {buttonLabel} →
        </Button>
      </Link>
    </div>
  );
}

/** Sales track topic card — matches Frances mockup layout. */
function SalesTopicCard({
  topic,
  onDelete,
  onBookmark,
  showBookmark = false,
}: {
  topic: TalkingPoint;
  onDelete?: (id: string) => void;
  onBookmark?: (topic: TalkingPoint) => void;
  showBookmark?: boolean;
}) {
  const usedWithAccount = Boolean(topic.canUseFor?.trim());
  const showExampleBadge = Boolean(topic.isStarterExample);

  return (
    <article className="rounded-xl border border-border bg-white p-5 sm:p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base leading-snug">
            {topic.title}
          </h3>
          {showExampleBadge && <ExampleBadge />}
          <span
            className="inline-flex shrink-0 rounded-full bg-teal-50 px-2.5 py-0.5 text-[11px] font-semibold"
            style={{ color: SALES_HERO_GREEN }}
          >
            {topic.category}
          </span>
        </div>
        <div className="flex items-start gap-2 shrink-0">
          {topic.source && (
            <p className="text-[11px] text-muted-fg text-right max-w-[160px] leading-snug">
              {topic.source}
            </p>
          )}
          {onDelete && (
            <button
              type="button"
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
        <ul className="space-y-2 mb-4">
          {topic.keyPoints.map((point) => (
            <li key={point} className="flex gap-2 text-sm text-muted-fg leading-relaxed">
              <span className="text-gray-400 shrink-0">—</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="pt-3 border-t border-border/60 flex flex-wrap items-center gap-2">
        {usedWithAccount ? (
          <>
            <span
              className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold text-white"
              style={{ backgroundColor: SALES_HERO_GREEN }}
            >
              Used in: {topic.canUseFor}
            </span>
            {topic.usedInNote && (
              <span className="text-xs italic text-muted-fg">— {topic.usedInNote}</span>
            )}
          </>
        ) : (
          <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-500">
            Not yet used with an account
          </span>
        )}
        {showBookmark && onBookmark && !topic.isStarterExample && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onBookmark(topic)}
            className="ml-auto gap-1.5 h-8 text-xs hover:bg-teal-50"
            style={{
              borderColor: `${SALES_HERO_GREEN}33`,
              color: SALES_HERO_GREEN,
            }}
          >
            <Bookmark className="w-3.5 h-3.5" />
            Bookmark under account
          </Button>
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
              href={`/dashboard/prep-library#${segment.anchor}`}
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

  // Loaded from /api/prep-library on mount
  const [topics, setTopics] = useState<TalkingPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [keyPointsRaw, setKeyPointsRaw] = useState("");
  const [categoryInput, setCategoryInput] = useState("");
  const [source, setSource] = useState("");
  const [prepStatus, setPrepStatus] = useState<PrepStatusEnum>("Learning it");
  const [customPrepStatus, setCustomPrepStatus] = useState("");
  const [monthYearFilter, setMonthYearFilter] = useState<string>("all");
  const [usedInNote, setUsedInNote] = useState("");
  const [canUseFor, setCanUseFor] = useState("");
  const [bookmarkTopic, setBookmarkTopic] = useState<TalkingPoint | null>(null);
  const [saveError, setSaveError] = useState("");

  const hasElite = hasAccess(userTier, "ELITE");

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
        notifyPrepLibraryCount(track, parsed.length, onTopicCountChange);
      })
      .catch(() => {
        setTopics([]);
        notifyPrepLibraryCount(track, 0, onTopicCountChange);
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
      if (keyPoints.length === 0) return;

      const resolvedCategory = normalizeCategoryInput(categoryInput, theme.defaultCategory);
      const resolvedPrepStatus = (
        track === "CAREER" ? customPrepStatus.trim() || prepStatus : prepStatus
      ).slice(0, 50);
      const body = {
        track,
        title: trimmedTitle,
        category: resolvedCategory,
        keyPoints,
        source: source.trim() || undefined,
        prepStatus: resolvedPrepStatus,
        ...(track === "SALES"
          ? {
              usedInNote: usedInNote.trim() || undefined,
              canUseFor: canUseFor.trim() || undefined,
            }
          : {}),
      };

      setSaveError("");
      try {
        const res = await fetch("/api/prep-library", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          setSaveError("Could not save your topic. Please try again.");
          return;
        }
        const created: TalkingPoint = await res.json();
        const newTopics = [{ ...created, createdAt: new Date(created.createdAt) }, ...topics];
        setTopics(newTopics);
        notifyPrepLibraryCount(track, newTopics.length, onTopicCountChange);
      } catch {
        setSaveError("Could not save your topic. Check your connection and try again.");
        return;
      }

      setTitle("");
      setKeyPointsRaw("");
      setCategoryInput("");
      setSource("");
      setPrepStatus("Learning it");
      setCustomPrepStatus("");
      setUsedInNote("");
      setCanUseFor("");
    },
    [
      title,
      keyPointsRaw,
      categoryInput,
      source,
      prepStatus,
      customPrepStatus,
      usedInNote,
      canUseFor,
      track,
      theme,
      topics,
      onTopicCountChange,
    ]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/prep-library/${id}`, { method: "DELETE" });
        if (!res.ok) return;
      } catch {
        return;
      }
      setTopics((prev) => {
        const next = prev.filter((t) => t.id !== id);
        notifyPrepLibraryCount(track, next.length, onTopicCountChange);
        return next;
      });
    },
    [track, onTopicCountChange]
  );

  const handleBookmarked = useCallback(
    (topicId: string, accountName: string) => {
      setTopics((prev) =>
        prev.map((t) =>
          t.id === topicId ? { ...t, canUseFor: accountName, prepStatus: "Used it" } : t
        )
      );
      void fetch(`/api/prep-library/${topicId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canUseFor: accountName, prepStatus: "Used it" }),
      });
    },
    []
  );

  const labelClass = cn(
    "text-[10px] font-bold uppercase tracking-widest",
    theme.labelColorClass
  );

  const topicGroups = groupTopicsByMonthYear(topics);
  const filteredTopicGroups =
    monthYearFilter === "all"
      ? topicGroups
      : topicGroups.filter((group) => group.label === monthYearFilter);

  // Reset month filter if the selected period no longer exists (e.g. after delete)
  useEffect(() => {
    if (monthYearFilter !== "all" && !topicGroups.some((g) => g.label === monthYearFilter)) {
      setMonthYearFilter("all");
    }
  }, [topicGroups, monthYearFilter]);

  const salesAddTopicForm = (
    <form onSubmit={handleSave} className="space-y-5">
      <div className="flex items-center gap-2">
        <div className={theme.iconWrapClass}>
          <BarChart3 className={theme.iconClass} />
        </div>
        <h3 className="font-semibold text-gray-900">{theme.formHeader}</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="prep-topic-title-SALES" className={labelClass}>
            Topic title
          </label>
          <Input
            id="prep-topic-title-SALES"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={theme.placeholders.title}
            className="h-10"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="prep-key-points-SALES" className={labelClass}>
            Key points
          </label>
          <textarea
            id="prep-key-points-SALES"
            value={keyPointsRaw}
            onChange={(e) => setKeyPointsRaw(e.target.value)}
            placeholder={theme.placeholders.keyPoints}
            rows={2}
            className={cn(
              "flex w-full rounded-lg border border-border bg-white px-3 py-2 text-sm min-h-[40px]",
              "placeholder:text-muted-fg resize-none",
              "focus:outline-none focus:ring-2 focus:border-transparent",
              theme.textareaFocusClass,
              "transition-all duration-200"
            )}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="prep-category-SALES" className={labelClass}>
            Category
          </label>
          <Input
            id="prep-category-SALES"
            value={categoryInput}
            onChange={(e) => setCategoryInput(e.target.value)}
            placeholder={theme.placeholders.category}
            className="h-10"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="prep-can-use-for-SALES" className={labelClass}>
            Can use for
          </label>
          <Input
            id="prep-can-use-for-SALES"
            value={canUseFor}
            onChange={(e) => setCanUseFor(e.target.value)}
            placeholder={theme.placeholders.canUseFor}
            className="h-10"
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={!title.trim() || !keyPointsRaw.trim()}
        className={cn("gap-1.5", theme.saveButtonClass)}
      >
        <Plus className="w-4 h-4" />
        {theme.saveButtonLabel}
      </Button>
      {saveError && <p className="text-xs text-red-600">{saveError}</p>}
    </form>
  );

  const careerAddTopicForm = (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="flex items-center gap-2">
        <div className={theme.iconWrapClass}>
          <BarChart3 className={theme.iconClass} />
        </div>
        <h3 className="font-semibold text-gray-900">{theme.formHeader}</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        <div className="space-y-1.5">
          <label htmlFor={`prep-category-${track}`} className={labelClass}>
            Category
          </label>
          <Input
            id={`prep-category-${track}`}
            value={categoryInput}
            onChange={(e) => setCategoryInput(e.target.value)}
            placeholder={theme.placeholders.category}
            className="h-10"
          />
        </div>

        {track === "CAREER" && (
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
        )}

        {track === "CAREER" && (
          <>
            <div className="sm:col-span-2 space-y-3">
              <span className={labelClass}>Prep status</span>
              <div className="flex gap-2 flex-wrap">
                {PREP_STATUS_PRESETS.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => {
                      setPrepStatus(status);
                      setCustomPrepStatus("");
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150",
                      prepStatus === status && !customPrepStatus.trim()
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
                ))}
              </div>
              <div className="space-y-1.5">
                <label htmlFor={`prep-custom-status-${track}`} className={labelClass}>
                  Or name your own
                </label>
                <Input
                  id={`prep-custom-status-${track}`}
                  value={customPrepStatus}
                  onChange={(e) => setCustomPrepStatus(e.target.value)}
                  placeholder="e.g. Revisit before final round"
                  className="h-10"
                  maxLength={50}
                />
              </div>
            </div>
          </>
        )}
      </div>

      <Button
        type="submit"
        disabled={!title.trim() || !keyPointsRaw.trim()}
        className={cn("gap-1.5", theme.saveButtonClass)}
      >
        <Plus className="w-4 h-4" />
        {theme.saveButtonLabel}
      </Button>
      {saveError && <p className="text-xs text-red-600">{saveError}</p>}
    </form>
  );

  if (track === "SALES") {
    return (
      <Reveal className="mb-6">
        <section id={segment.anchor} aria-labelledby={`prep-library-heading-${track}`}>
          {!unlocked ? (
            <div className="relative rounded-xl border border-border bg-white overflow-hidden">
              <div className="blur-sm pointer-events-none select-none px-5 sm:px-6 py-5 space-y-4" aria-hidden>
                {theme.seedTopics.slice(0, 2).map((topic) => (
                  <SalesTopicCard key={topic.id} topic={topic} />
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
            <div className="space-y-8">
              {/* Hero — forest green mockup */}
              <div className="space-y-4">
                <p
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: SALES_HERO_GREEN }}
                >
                  {segment.eyebrow}
                </p>
                <h1
                  id={`prep-library-heading-${track}`}
                  className="font-serif text-3xl sm:text-4xl font-bold text-gray-900"
                >
                  {segment.pageTitle}
                </h1>
                <p className="text-sm text-muted-fg max-w-2xl leading-relaxed">
                  {segment.pageDescription}
                </p>
                <TopicsSavedStatBox
                  count={topics.length}
                  loading={loading}
                  accentColor={SALES_HERO_GREEN}
                />
              </div>

              {/* Add form — mint dotted border */}
              <div className="rounded-xl border-2 border-dashed border-teal-200 bg-teal-50/20 p-5 sm:p-6 shadow-sm">
                {salesAddTopicForm}
              </div>

              {/* Topics with month/year filter sidebar */}
              {loading ? (
                <p className="text-xs text-muted-fg">Loading your topics…</p>
              ) : topics.length > 0 ? (
                <div className="space-y-4">
                  <MonthYearFilterBar
                    groups={topicGroups}
                    value={monthYearFilter}
                    onChange={setMonthYearFilter}
                    orientation="horizontal"
                    accent="sales"
                    className="lg:hidden -mx-1 px-1"
                  />

                  <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                    <MonthYearFilterBar
                      groups={topicGroups}
                      value={monthYearFilter}
                      onChange={setMonthYearFilter}
                      orientation="vertical"
                      accent="sales"
                      className="hidden lg:block lg:w-44 shrink-0 lg:sticky lg:top-24 lg:self-start rounded-xl border border-teal-100 bg-teal-50/40 p-3"
                    />

                    <div className="flex-1 min-w-0 space-y-8">
                      {filteredTopicGroups.length > 0 ? (
                        filteredTopicGroups.map((group) => (
                          <div
                            key={group.label}
                            id={`prep-sales-month-${group.label.replace(/\s+/g, "-")}`}
                            className="space-y-4"
                          >
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-fg">
                              {group.label}
                            </p>
                            <div className="space-y-4">
                              {group.topics.map((topic, i) => (
                                <Reveal key={topic.id} delay={i * 0.03}>
                                  <SalesTopicCard
                                    topic={topic}
                                    onDelete={handleDelete}
                                    showBookmark={hasElite}
                                    onBookmark={setBookmarkTopic}
                                  />
                                </Reveal>
                              ))}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-fg">No topics in this period.</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-fg">No topics yet — add one above.</p>
              )}

              <SalesAccountIntelligenceBanner userTier={userTier} />

              <BookmarkUnderAccountModal
                open={Boolean(bookmarkTopic)}
                onClose={() => setBookmarkTopic(null)}
                sourceType="PREP_LIBRARY"
                sourceId={bookmarkTopic?.id ?? ""}
                sourceTitle={bookmarkTopic?.title ?? ""}
                onBookmarked={(accountName) => {
                  if (bookmarkTopic) {
                    handleBookmarked(bookmarkTopic.id, accountName);
                  }
                }}
              />
            </div>
          )}

          {!unlocked && (
            <div className="mt-8">
              <SalesAccountIntelligenceBanner userTier={userTier} />
            </div>
          )}
        </section>
      </Reveal>
    );
  }

  return (
    <Reveal className="mb-6">
      <section id={segment.anchor} aria-labelledby={`prep-library-heading-${track}`}>
        {!unlocked ? (
          <div className="relative rounded-xl border border-border bg-white overflow-hidden">
            <div
              className="blur-sm pointer-events-none select-none px-5 sm:px-6 py-5 space-y-4"
              aria-hidden
            >
              {theme.seedTopics.slice(0, 2).map((topic) => (
                <TopicCard key={topic.id} topic={topic} theme={theme} showLinkedFields={false} />
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
          <div className="space-y-8">
            <div className="space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary-400">
                {segment.eyebrow}
              </p>
              <h1
                id={`prep-library-heading-${track}`}
                className="font-serif text-3xl sm:text-4xl font-bold text-gray-900"
              >
                {segment.pageTitle}
              </h1>
              <p className="text-sm text-muted-fg max-w-2xl leading-relaxed">
                {segment.pageDescription}
              </p>
              <TopicsSavedStatBox
                count={topics.length}
                loading={loading}
                accentColor={segment.color}
              />
            </div>

            <div className="rounded-xl border-2 border-dashed border-primary-200 bg-primary-50/10 p-5 sm:p-6 shadow-sm">
              {careerAddTopicForm}
            </div>

            {loading ? (
              <p className="text-xs text-muted-fg">Loading your topics…</p>
            ) : topics.length > 0 ? (
              <div className="space-y-4">
                <MonthYearFilterBar
                  groups={topicGroups}
                  value={monthYearFilter}
                  onChange={setMonthYearFilter}
                  orientation="horizontal"
                  className="lg:hidden -mx-1 px-1"
                />

                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                  <MonthYearFilterBar
                    groups={topicGroups}
                    value={monthYearFilter}
                    onChange={setMonthYearFilter}
                    orientation="vertical"
                    className="hidden lg:block lg:w-44 shrink-0 lg:sticky lg:top-24 lg:self-start rounded-xl border border-border bg-secondary/20 p-3"
                  />

                  <div className="flex-1 min-w-0 space-y-6">
                    {filteredTopicGroups.length > 0 ? (
                      filteredTopicGroups.map((group) => (
                        <div
                          key={group.label}
                          id={`prep-month-${group.label.replace(/\s+/g, "-")}`}
                          className="space-y-3"
                        >
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-fg">
                            {group.label}
                          </p>
                          <div className="space-y-3">
                            {group.topics.map((topic, i) => (
                              <Reveal key={topic.id} delay={i * 0.03}>
                                <TopicCard
                                  topic={topic}
                                  theme={theme}
                                  onDelete={handleDelete}
                                  showLinkedFields={false}
                                />
                              </Reveal>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-fg">No topics in this period.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-fg">No topics yet — add one above.</p>
            )}
          </div>
        )}
      </section>
    </Reveal>
  );
}

// ─── Legacy export kept for backwards compat ─────────────────────────────────
export { PrepLibraryCard as PrepLibrarySection };
