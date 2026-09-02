"use client";

import React, { useEffect, useState } from "react";
import { EditorField, inputClass } from "./shared";
import { DEFAULT_LANDING_CONTENT, type LandingContent } from "@/data/landing-content";
import { mergeLandingContent } from "@/lib/content/merge";

function resolveTrackSelection(payload: unknown): LandingContent["trackSelection"] {
  const merged = mergeLandingContent(
    DEFAULT_LANDING_CONTENT,
    (payload && typeof payload === "object" ? payload : {}) as Partial<LandingContent>
  );
  return merged.trackSelection;
}

export function TrackSelectionCaptionsEditor({
  payload,
  onChange,
  contentVersion = 0,
}: {
  payload: unknown;
  onChange: (p: unknown) => void;
  contentVersion?: number;
}) {
  const rawPayload = (payload && typeof payload === "object" ? payload : {}) as Record<string, unknown>;
  const [trackSelection, setTrackSelection] = useState(() => resolveTrackSelection(payload));

  useEffect(() => {
    if (payload == null) return;
    setTrackSelection(resolveTrackSelection(payload));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-sync when contentVersion bumps
  }, [contentVersion]);

  function patch(next: LandingContent["trackSelection"]) {
    setTrackSelection(next);
    onChange({ ...rawPayload, trackSelection: next });
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-fg leading-relaxed">
        Subtitle under &ldquo;Build a Career&rdquo; / &ldquo;Sell into Firms&rdquo; on signup, onboarding, and the
        starter-pack modal.
      </p>

      <div className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-700">Career track</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <EditorField label="Title">
            <input
              className={inputClass}
              value={trackSelection.career.title}
              onChange={(e) =>
                patch({
                  ...trackSelection,
                  career: { ...trackSelection.career, title: e.target.value },
                })
              }
            />
          </EditorField>
          <EditorField label="Caption">
            <input
              className={inputClass}
              value={trackSelection.career.caption}
              onChange={(e) =>
                patch({
                  ...trackSelection,
                  career: { ...trackSelection.career, caption: e.target.value },
                })
              }
            />
          </EditorField>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-700">Sales track</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <EditorField label="Title">
            <input
              className={inputClass}
              value={trackSelection.sales.title}
              onChange={(e) =>
                patch({
                  ...trackSelection,
                  sales: { ...trackSelection.sales, title: e.target.value },
                })
              }
            />
          </EditorField>
          <EditorField label="Caption">
            <input
              className={inputClass}
              value={trackSelection.sales.caption}
              onChange={(e) =>
                patch({
                  ...trackSelection,
                  sales: { ...trackSelection.sales, caption: e.target.value },
                })
              }
            />
          </EditorField>
        </div>
      </div>
    </div>
  );
}
