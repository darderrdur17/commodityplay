"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { AdminLandingEditor } from "../admin-landing-editor";
import { UploadSection } from "./shared";
import { DEFAULT_LANDING_CONTENT, type LandingContent } from "@/data/landing-content";
import { parseLandingContentPayload } from "@/lib/content/landing-schema";

type TrackFilter = "career" | "sales" | "both";

export function LandingEditorWrapper({
  payload,
  onChange,
  moduleSlug,
  requiredTier,
}: {
  payload: unknown;
  onChange: (p: unknown) => void;
  moduleSlug: string;
  requiredTier: string;
}) {
  const [track, setTrack] = useState<TrackFilter>("both");

  const parsed = parseLandingContentPayload(payload);
  const content: LandingContent = parsed.success ? parsed.data : DEFAULT_LANDING_CONTENT;

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
        onChange={(next) => onChange(next)}
        trackFilter={track}
      />

      <UploadSection moduleSlug={moduleSlug} requiredTier={requiredTier} />
    </div>
  );
}
