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

export interface LibraryPayload {
  files: LibraryFileRecord[];
}

const EMPTY_LIBRARY: LibraryPayload = { files: [] };

function asTrack(value: unknown): LibraryFileRecord["track"] {
  return value === "career" || value === "sales" || value === "both" ? value : "both";
}

function asDelivery(value: unknown): LibraryFileRecord["delivery"] {
  return value === "download" ? "download" : "view-only";
}

function asAccessTier(value: unknown): LibraryFileRecord["accessTier"] {
  return value === "free" ? "free" : "elite";
}

/** CMS library is an unbounded file list. Empty or missing payloads still render. */
export function normalizeLibraryPayload(payload: unknown): LibraryPayload {
  const raw = payload as { files?: unknown } | null;
  if (!Array.isArray(raw?.files)) return EMPTY_LIBRARY;
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
  return { files };
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
