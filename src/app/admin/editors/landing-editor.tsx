"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { AdminLandingEditor } from "../admin-landing-editor";
import { EditorSection, UploadSection } from "./shared";
import { DEFAULT_LANDING_CONTENT, type LandingContent } from "@/data/landing-content";
import { parseLandingContentPayload } from "@/lib/content/landing-schema";
import { mergeLandingContent } from "@/lib/content/merge";
import {
  defaultCareerEdgeNote,
  defaultSalesEdgeNote,
  type WeeklyEdgeNote,
} from "@/lib/content/edge-notes";
import { WeeklyEdgeNoteEditor } from "./sales-edge-note-editor";

type TrackFilter = "career" | "sales" | "both";

export function LandingEditorWrapper({
  payload,
  onChange,
  moduleSlug,
  requiredTier,
  initialTrackFilter = "both",
}: {
  payload: unknown;
  onChange: (p: unknown) => void;
  moduleSlug: string;
  requiredTier: string;
  initialTrackFilter?: TrackFilter;
}) {
  const [track, setTrack] = useState<TrackFilter>(initialTrackFilter);

  const parsed = parseLandingContentPayload(payload);
  const content: LandingContent = parsed.success
    ? parsed.data
    : mergeLandingContent(DEFAULT_LANDING_CONTENT, (payload ?? {}) as Partial<LandingContent>);
  const rawPayload = (payload && typeof payload === "object" ? payload : {}) as Record<string, unknown>;
  const careerEdgeNote = rawPayload.careerEdgeNote as WeeklyEdgeNote | undefined;
  const salesEdgeNote = rawPayload.salesEdgeNote as WeeklyEdgeNote | undefined;

  const showCareerNote = track === "both" || track === "career";
  const showSalesNote = track === "both" || track === "sales";

  function handleLandingChange(next: LandingContent) {
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
          title="Weekly Sales Edge Note"
          description="Sales track only — saves to landing payload key salesEdgeNote"
        >
          <WeeklyEdgeNoteEditor
            note={salesEdgeNote}
            onChange={handleSalesEdgeNoteChange}
            trackLabel="Sales Track Only"
            defaultNote={defaultSalesEdgeNote}
          />
        </EditorSection>
      )}

      <UploadSection moduleSlug={moduleSlug} requiredTier={requiredTier} />
    </div>
  );
}
