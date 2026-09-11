"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { AdminLandingEditor } from "../admin-landing-editor";
import { EditorSection, UploadSection } from "./shared";
import { DEFAULT_LANDING_CONTENT, type LandingContent } from "@/data/landing-content";
import { mergeLandingContent } from "@/lib/content/merge";
import {
  defaultCareerEdgeNote,
  defaultSalesEdgeNote,
  type WeeklyEdgeNote,
} from "@/lib/content/edge-notes";
import { WeeklyEdgeNoteEditor } from "./sales-edge-note-editor";
import { CONTENT_STAT_PLACEHOLDER_HINT } from "@/lib/content/content-stat-placeholders";

type TrackFilter = "career" | "sales" | "both";

function coerceStatValue(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Editor display — always merge CMS over defaults (never strict-parse while typing). */
export function resolveEditorLandingContent(payload: unknown): LandingContent {
  const merged = mergeLandingContent(
    DEFAULT_LANDING_CONTENT,
    (payload && typeof payload === "object" ? payload : {}) as Partial<LandingContent>
  );
  return {
    ...merged,
    career: {
      ...merged.career,
      heroStats: merged.career.heroStats.map((stat) => ({
        ...stat,
        value: coerceStatValue(stat.value),
        suffix: stat.suffix ?? "",
      })),
    },
    sales: {
      ...merged.sales,
      stats: merged.sales.stats.map((stat) => ({
        ...stat,
        value: coerceStatValue(stat.value),
        suffix: stat.suffix ?? "",
      })),
    },
  };
}

export function LandingEditorWrapper({
  payload,
  onChange,
  moduleSlug,
  requiredTier,
  initialTrackFilter = "both",
  contentVersion = 0,
}: {
  payload: unknown;
  onChange: (p: unknown) => void;
  moduleSlug: string;
  requiredTier: string;
  initialTrackFilter?: TrackFilter;
  /** Bumps after load / save / revert so editor re-syncs from server payload. */
  contentVersion?: number;
}) {
  const [track, setTrack] = useState<TrackFilter>(initialTrackFilter);
  const [content, setContent] = useState<LandingContent>(() => resolveEditorLandingContent(payload));

  useEffect(() => {
    if (payload == null) return;
    setContent(resolveEditorLandingContent(payload));
    // Re-sync only after load / save / revert — not on every local edit (payload changes each keystroke).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- payload read when contentVersion bumps
  }, [contentVersion]);

  const rawPayload = (payload && typeof payload === "object" ? payload : {}) as Record<string, unknown>;
  const careerEdgeNote = rawPayload.careerEdgeNote as WeeklyEdgeNote | undefined;
  const salesEdgeNote = rawPayload.salesEdgeNote as WeeklyEdgeNote | undefined;

  const showCareerNote = track === "both" || track === "career";
  const showSalesNote = track === "both" || track === "sales";

  function handleLandingChange(next: LandingContent) {
    setContent(next);
    onChange({ ...rawPayload, ...next });
  }

  function handleCareerEdgeNoteChange(note: WeeklyEdgeNote) {
    onChange({ ...rawPayload, careerEdgeNote: note });
  }

  function handleSalesEdgeNoteChange(note: WeeklyEdgeNote) {
    onChange({ ...rawPayload, salesEdgeNote: note });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <span className="text-xs font-semibold text-gray-700">Track filter:</span>
        {(["both", "career", "sales"] as TrackFilter[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTrack(t)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize",
              track === t ? "bg-primary-soft text-primary-400" : "bg-secondary text-muted-fg hover:bg-secondary/80"
            )}
          >
            {t === "both" ? "All sections" : t === "career" ? "Career Track" : "Sales Track"}
          </button>
        ))}
      </div>

      <details className="mx-1 rounded-lg border border-border bg-secondary/30 px-3 py-2 text-xs text-muted-fg">
        <summary className="cursor-pointer font-medium text-gray-700 select-none">
          Live count placeholders (optional in copy)
        </summary>
        <p className="mt-2 leading-relaxed">
          In pricing or feature text you can use tokens like{" "}
          <code className="rounded bg-white px-1 py-0.5 text-[11px]">{"{chapterCount}"}</code> — they
          auto-fill from live CMS on the public site.
        </p>
        <p className="mt-2 font-mono text-[10px] leading-relaxed break-all text-muted-fg">
          {CONTENT_STAT_PLACEHOLDER_HINT}
        </p>
      </details>

      <AdminLandingEditor
        content={content}
        onChange={handleLandingChange}
        trackFilter={track}
      />

      {showCareerNote && (
        <EditorSection
          title="Weekly Career Edge Note"
          description="Career track only — saves to landing payload key careerEdgeNote"
        >
          <WeeklyEdgeNoteEditor
            note={careerEdgeNote}
            onChange={handleCareerEdgeNoteChange}
            trackLabel="Career Track Only"
            defaultNote={defaultCareerEdgeNote}
          />
        </EditorSection>
      )}

      {showSalesNote && (
        <EditorSection
          title="Sales Market Strip"
          description="See demo button and Recent Topics card on the sales landing tools section. Feature titles and captions are edited above under Sales Track Only — Tools. Saves to salesEdgeNote."
        >
          <WeeklyEdgeNoteEditor
            note={salesEdgeNote}
            onChange={handleSalesEdgeNoteChange}
            trackLabel="Sales Track Only"
            defaultNote={defaultSalesEdgeNote}
            showDemoButton
            showTopics
          />
        </EditorSection>
      )}

      <UploadSection moduleSlug={moduleSlug} requiredTier={requiredTier} />
    </div>
  );
}
