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
  /**
   * Overrides the note derived from `disabledTrack`. `/pricing` uses it to explain
   * the administrator preview: an admin is NOT pinned (R-1 exception), so both
   * segments stay enabled and the derived pin note would be wrong. Non-admins are
   * unaffected — they omit this and keep the derived note.
   */
  note?: string;
  /**
   * Palette for the surface this sits on. `/pricing` renders it inside the dark
   * track-themed section, where the light palette's `text-muted-fg` note and
   * inactive label fall below WCAG AA against `#050b1d` / `#04130f`. Defaults to
   * `"light"` so every other consumer is byte-identical.
   */
  tone?: "light" | "dark";
  className?: string;
}

const TRACKS: ReadonlyArray<{ key: PlanTrack; label: string }> = [
  { key: "CAREER", label: "Career" },
  { key: "SALES", label: "Sales" },
];

/**
 * Segmented `Career | Sales` control for the /pricing page — built on the same
 * palette as `PlanTermSelector` so the two sit together cleanly. `tone` picks the
 * light or dark palette; the default keeps every existing consumer unchanged.
 */
export function TrackSwitcher({
  value,
  onChange,
  disabledTrack,
  note,
  tone = "light",
  className,
}: TrackSwitcherProps) {
  const dark = tone === "dark";
  const derivedNote =
    disabledTrack === "SALES"
      ? "Your account is on the Career track, so Career pricing is shown."
      : disabledTrack === "CAREER"
        ? "Your account is on the Sales track, so Sales pricing is shown."
        : null;
  const resolvedNote = note ?? derivedNote;

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div
        role="radiogroup"
        aria-label="Pricing track"
        className={cn("inline-grid grid-cols-2 gap-1 rounded-lg p-1", dark ? "bg-white/10" : "bg-secondary")}
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
                active
                  ? "bg-white text-gray-900 shadow-sm"
                  : dark
                    ? "text-white/70 hover:text-white"
                    : "text-muted-fg hover:text-gray-900",
                disabled &&
                  (dark
                    ? "cursor-not-allowed opacity-40 hover:text-white/70"
                    : "cursor-not-allowed opacity-40 hover:text-muted-fg")
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      {resolvedNote && (
        <p className={cn("text-xs", dark ? "text-white/60" : "text-muted-fg")}>{resolvedNote}</p>
      )}
    </div>
  );
}
