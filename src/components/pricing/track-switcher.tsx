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
   * Palette for the surface this sits on. `/pricing` is the only consumer and
   * renders it on the black page, so it passes `"dark"`; the `"light"` branch is
   * retained because the control is designed to sit on either surface and the
   * note / inactive-label colours are the only thing that changes. Defaults to
   * `"light"`.
   */
  tone?: "light" | "dark";
  className?: string;
}

const TRACKS: ReadonlyArray<{ key: PlanTrack; label: string }> = [
  { key: "CAREER", label: "Career" },
  { key: "SALES", label: "Sales" },
];

/**
 * The selected segment's fill, one per track — the owner's brief was "blue for
 * Career, green for Sales". These are the SAME two accents the plan cards below
 * already use (`#2e7bfe` on the Career cards, `#2fbf8f` on the Sales cards), so
 * the toggle reads as part of the same page rather than a detached control.
 *
 * The gradient is vertical (lighter at the top) because that is what sells the
 * emboss: light from above, shadow below.
 */
const ACTIVE_FILL: Record<PlanTrack, string> = {
  CAREER: "bg-gradient-to-b from-[#5a9bff] to-[#0b45e0]",
  SALES: "bg-gradient-to-b from-[#43d6a0] to-[#14805f]",
};

/**
 * The embossed treatment for a selected segment: a light inner highlight along
 * the top edge, a hard 2px bottom edge that reads as physical thickness, and a
 * soft drop shadow beneath. Together they lift the segment off the track.
 *
 * There are two variants because the page background moved to pure black. The
 * light-page shadows are slate — `rgba(15,23,42,…)`, near-black — so against
 * `#000000` they cast nothing and the selected chip goes flat. On the dark page
 * the lift has to come from the other direction:
 *
 *   - a TRUE black bottom edge, which is visible precisely because the chip sits
 *     on the lighter `#1a1a1a` track (`bg-white/10`) rather than on the page; and
 *   - a faint 1px light rim, which is what separates the chip from the black
 *     page behind it — on a dark surface a raised element reads as *lit*, not
 *     as *shadowed*.
 */
const EMBOSSED_ACTIVE_LIGHT =
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_2px_0_rgba(15,23,42,0.28),0_6px_16px_rgba(15,23,42,0.22)]";
const EMBOSSED_ACTIVE_DARK =
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_2px_0_rgba(0,0,0,0.65),0_8px_18px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.14)]";

/**
 * The matching treatment for an UNSELECTED segment: pressed into the track
 * instead of raised — a soft inner shadow and no drop shadow. The pair is what
 * makes the control read as embossed rather than as two flat chips.
 *
 * The dark variant uses a true black inset for the same reason as above: a
 * slate inset is invisible against the `#1a1a1a` track, so the pressed-in cue
 * disappeared along with the page's white background.
 */
const EMBOSSED_IDLE_LIGHT = "shadow-[inset_0_2px_4px_rgba(15,23,42,0.10)]";
const EMBOSSED_IDLE_DARK = "shadow-[inset_0_2px_5px_rgba(0,0,0,0.55)]";

/**
 * Segmented `Career | Sales` control for the /pricing page.
 *
 * Each segment is a raised button; the selected one is filled in its own track
 * colour (blue Career, green Sales) and lifted, the other is recessed into the
 * track. Sizes are deliberately generous — the brief was "make the toggle
 * buttons bigger" — so the hit targets are ~44px tall even before the padding
 * step, which clears the 24px minimum comfortably.
 *
 * `tone` selects the emboss shadows (a raised element reads as *lit* on a dark
 * surface and as *shadowed* on a light one), plus the note and idle label
 * colours. The selected fill is track-coloured on either surface.
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
  const embossActive = dark ? EMBOSSED_ACTIVE_DARK : EMBOSSED_ACTIVE_LIGHT;
  const embossIdle = dark ? EMBOSSED_IDLE_DARK : EMBOSSED_IDLE_LIGHT;
  const derivedNote =
    disabledTrack === "SALES"
      ? "Your account is on the Career track, so Career pricing is shown."
      : disabledTrack === "CAREER"
        ? "Your account is on the Sales track, so Sales pricing is shown."
        : null;
  const resolvedNote = note ?? derivedNote;

  return (
    <div className={cn("flex flex-col items-center gap-2.5", className)}>
      <div
        role="radiogroup"
        aria-label="Pricing track"
        className={cn(
          "inline-grid grid-cols-2 gap-2 rounded-2xl p-2",
          dark
            ? "bg-white/10 shadow-[inset_0_2px_6px_rgba(0,0,0,0.35)]"
            : "bg-secondary shadow-[inset_0_2px_6px_rgba(15,23,42,0.10)]"
        )}
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
                "min-w-[112px] rounded-xl px-6 py-3 text-base font-bold leading-tight transition-all sm:min-w-[140px] sm:px-9 sm:py-3.5",
                active
                  ? cn("text-white", ACTIVE_FILL[t.key], embossActive)
                  : cn(
                      embossIdle,
                      dark ? "text-white/70 hover:text-white" : "text-muted-fg hover:text-gray-900"
                    ),
                !active && "active:translate-y-px",
                disabled &&
                  cn(
                    "cursor-not-allowed opacity-40",
                    dark ? "hover:text-white/70" : "hover:text-muted-fg"
                  )
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
