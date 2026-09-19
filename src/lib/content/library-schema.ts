import { mergeCmsSimpleHero, type CmsSimpleHero } from "@/lib/content/cms-page-copy";

export interface LibraryFileRecord {
  id: string;
  label: string;
  fileName: string;
  assetId: string;
  mimeType: string;
  delivery: "view-only" | "download";
  track: "career" | "sales" | "both";
  accessTier: "free" | "elite";
}

export type LibraryHeroCopy = CmsSimpleHero;

export interface LibrarySectionCopy {
  title: string;
  description: string;
}

export const DEFAULT_LIBRARY_HERO: LibraryHeroCopy = {
  eyebrow: "Resource Library",
  title: "Resource Library",
  description: "Free reference files for all members, plus Elite bonus guides and desk materials.",
};

export const DEFAULT_LIBRARY_FREE_SECTION: LibrarySectionCopy = {
  title: "Free Resources",
  description: "Available to all logged-in members.",
};

export const DEFAULT_LIBRARY_ELITE_SECTION: LibrarySectionCopy = {
  title: "Elite Resources",
  description: "Bonus guides and reference materials for Elite members.",
};

export interface LibraryPayload {
  files: LibraryFileRecord[];
  hero: LibraryHeroCopy;
  freeSection: LibrarySectionCopy;
  eliteSection: LibrarySectionCopy;
}

const EMPTY_LIBRARY: LibraryPayload = {
  files: [],
  hero: DEFAULT_LIBRARY_HERO,
  freeSection: DEFAULT_LIBRARY_FREE_SECTION,
  eliteSection: DEFAULT_LIBRARY_ELITE_SECTION,
};

function mergeLibrarySection(
  defaults: LibrarySectionCopy,
  saved?: Partial<LibrarySectionCopy> | null
): LibrarySectionCopy {
  const raw = saved ?? {};
  return {
    title: typeof raw.title === "string" && raw.title.trim() ? raw.title.trim() : defaults.title,
    description:
      typeof raw.description === "string" && raw.description.trim()
        ? raw.description.trim()
        : defaults.description,
  };
}

function asTrack(value: unknown): LibraryFileRecord["track"] {
  return value === "career" || value === "sales" || value === "both" ? value : "both";
}

function asDelivery(value: unknown): LibraryFileRecord["delivery"] {
  return value === "download" ? "download" : "view-only";
}

function asAccessTier(value: unknown): LibraryFileRecord["accessTier"] {
  return value === "free" ? "free" : "elite";
}

/** CMS library is an unbounded file list. Empty or missing payloads still render the blue strip. */
export function normalizeLibraryPayload(payload: unknown): LibraryPayload {
  const raw = (payload ?? {}) as {
    files?: unknown;
    hero?: Partial<LibraryHeroCopy> | null;
    freeSection?: Partial<LibrarySectionCopy> | null;
    eliteSection?: Partial<LibrarySectionCopy> | null;
  };
  const hero = mergeCmsSimpleHero(DEFAULT_LIBRARY_HERO, raw.hero);
  const freeSection = mergeLibrarySection(DEFAULT_LIBRARY_FREE_SECTION, raw.freeSection);
  const eliteSection = mergeLibrarySection(DEFAULT_LIBRARY_ELITE_SECTION, raw.eliteSection);
  if (!Array.isArray(raw.files)) return { ...EMPTY_LIBRARY, hero, freeSection, eliteSection };
  const files: LibraryFileRecord[] = [];
  for (const item of raw.files) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<LibraryFileRecord>;
    files.push({
      id: typeof row.id === "string" && row.id.trim() ? row.id : `lib-${files.length + 1}`,
      label: typeof row.label === "string" ? row.label : "",
      fileName: typeof row.fileName === "string" ? row.fileName : "",
      assetId: typeof row.assetId === "string" ? row.assetId : "",
      mimeType: typeof row.mimeType === "string" && row.mimeType.trim() ? row.mimeType : "application/pdf",
      delivery: asDelivery(row.delivery),
      track: asTrack(row.track),
      accessTier: asAccessTier(row.accessTier),
    });
  }
  return { files, hero, freeSection, eliteSection };
}

export function libraryFileVisibleToTrack(
  file: Pick<LibraryFileRecord, "track">,
  memberTrack: string | null | undefined
): boolean {
  if (file.track === "both") return true;
  const track = memberTrack?.toLowerCase();
  if (!track || track === "both") return true;
  return file.track === track;
}
