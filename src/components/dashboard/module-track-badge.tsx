import { cn } from "@/lib/utils";

export type ModuleTrack = "Career" | "Sales" | "Both";

const TRACK_STYLES: Record<ModuleTrack, string> = {
  Career: "bg-blue-50 text-blue-700 border-blue-200",
  Sales: "bg-teal-50 text-teal-800 border-teal-200",
  Both: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

/** Compact track pill for admin preview on dashboard module cards. */
export function ModuleTrackBadge({ track }: { track: ModuleTrack }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-none",
        TRACK_STYLES[track]
      )}
    >
      {track}
    </span>
  );
}
