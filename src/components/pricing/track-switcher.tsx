"use client";

import { cn } from "@/lib/utils";
import type { PlanTrack } from "@/data/pricing-shared";

export interface TrackSwitcherProps {
  value: PlanTrack;
  onChange: (track: PlanTrack) => void;
  /**
   * When set, that segment is disabled and a short note explains why. Signed-in
   * members are pinned to their own `User.track` (R-1): the checkout route reads
   * the track from the DB, so offering a track the server will ignore would show
   * one price and charge another.
   */
  disabledTrack?: PlanTrack;
  className?: string;
}

const TRACKS: ReadonlyArray<{ key: PlanTrack; label: string }> = [
  { key: "CAREER", label: "Career" },
  { key: "SALES", label: "Sales" },
];

/**
 * Segmented `Career | Sales` control for the /pricing page — light tone, built on
 * the same palette as `PlanTermSelector` so the two sit together cleanly.
 */
export function TrackSwitcher({ value, onChange, disabledTrack, className }: TrackSwitcherProps) {
  const note =
    disabledTrack === "SALES"
      ? "Your account is on the Career track, so Career pricing is shown."
      : disabledTrack === "CAREER"
        ? "Your account is on the Sales track, so Sales pricing is shown."
        : null;

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div
        role="radiogroup"
        aria-label="Pricing track"
        className="inline-grid grid-cols-2 gap-1 rounded-lg bg-secondary p-1"
      >
        {TRACKS.map((t) => {
          const active = t.key === value;
          const disabled = t.key === disabledTrack;
          return (
            <button
              key={t.key}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={disabled}
              onClick={() => {
                if (!disabled) onChange(t.key);
              }}
              className={cn(
                "rounded-md px-5 py-1.5 text-sm font-semibold leading-tight transition-colors",
                active ? "bg-white text-gray-900 shadow-sm" : "text-muted-fg hover:text-gray-900",
                disabled && "cursor-not-allowed opacity-40 hover:text-muted-fg"
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      {note && <p className="text-xs text-muted-fg">{note}</p>}
    </div>
  );
}
