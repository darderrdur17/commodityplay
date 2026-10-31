import type {
  ClientAdEntry,
  ClientAdTrack,
  LandingClientAds,
} from "@/data/landing-content";

/**
 * Row selection for the "Client ads & shoutouts" section.
 *
 * ⚠️ Deliberately a PLAIN module — no `server-only`, no `fs`, no React. The
 * visibility rules below are the only thing standing between a hidden or
 * wrong-track row and the live page, so the verification harness executes this
 * function directly instead of grepping for it. Anything that pulls in
 * `server-only` cannot be imported by `tsx`, which is why the filter does not live
 * inside the component.
 */

/** The two landing tracks. A row's own `track` may also be `"both"`. */
export type ClientAdLandingTrack = "career" | "sales";

/** Human labels for the admin dropdown, shared so the two never drift. */
export const CLIENT_AD_TRACK_LABELS: Record<ClientAdTrack, string> = {
  career: "Career track only",
  sales: "Sales track only",
  both: "Both tracks",
};

/**
 * The rows to render for one track, in CMS order.
 *
 * Two independent gates, and both matter:
 *   - `visible` — an unticked row stays in the CMS so it can be brought back, but
 *     must never render anywhere.
 *   - `track` — `"both"` matches either track; anything else matches only itself.
 *
 * Order is the admin's order, untouched. A track with no matching rows returns an
 * empty array, and the section renders nothing at all — retiring the section is
 * just unticking every row.
 */
export function selectClientAds(
  section: LandingClientAds | undefined,
  track: ClientAdLandingTrack
): ClientAdEntry[] {
  if (!section?.entries?.length) return [];
  return section.entries.filter(
    (entry) => entry.visible && (entry.track === "both" || entry.track === track)
  );
}

/**
 * Monogram for the generated placeholder tile. Two letters at most, so a long
 * company name cannot overflow the tile.
 */
export function clientAdInitials(company: string): string {
  const words = company
    .replace(/[^\p{L}\p{N}\s&.]/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length > 0 && word !== "&");
  if (words.length === 0) return "AD";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}
