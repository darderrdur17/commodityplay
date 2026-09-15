import { CHAPTERS, type PlaybookSection } from "@/data/playbook";
import playbookSections from "@/data/playbook-sections.json";
import { mergePlaybookHubHero, type PlaybookHubHeroCopy } from "@/data/playbook-hub-hero";
import type { ContentAttachment } from "@/lib/content/attachments";

export type PlaybookSectionBody = PlaybookSection & {
  freePreview?: boolean;
  assets?: ContentAttachment[];
};

export type PlaybookChapterStatus = "live" | "releasing-soon";

export type PlaybookChapterRecord = {
  id: string;
  letter: string;
  title: string;
  subtitle: string;
  color?: string;
  pages: number;
  preview?: boolean;
  /** Hub listing: live chapters are readable; releasing-soon stay visible but locked. */
  status: PlaybookChapterStatus;
  sections: PlaybookSectionBody[];
  keyTakeaways?: readonly string[];
  track?: "career" | "sales" | "both";
};

/** Brand navy (`primary-800`) when a CMS chapter has no usable per-chapter color. */
export const PLAYBOOK_CHAPTER_FALLBACK_COLOR = "#0830a0";

function isUsableChapterColor(value: unknown): value is string {
  if (!filled(value)) return false;
  const c = value.trim().toLowerCase();
  if (
    c === "transparent" ||
    c === "none" ||
    c === "inherit" ||
    c === "white" ||
    c === "#fff" ||
    c === "#ffffff" ||
    c === "#ffffffff"
  ) {
    return false;
  }
  return true;
}

/** Seed only — missing CMS flags: letters A–E live, F+ releasing soon. */
export function defaultPlaybookChapterStatus(letter: string): PlaybookChapterStatus {
  const ch = letter.trim().charAt(0).toUpperCase();
  if (!ch) return "live";
  return ch >= "F" ? "releasing-soon" : "live";
}

/** Always a paint-able CSS color so F+ admin preview still gets the A–E navy strip. */
export function playbookChapterHeroColor(chapter: { color?: string | null }): string {
  return isUsableChapterColor(chapter.color) ? chapter.color.trim() : PLAYBOOK_CHAPTER_FALLBACK_COLOR;
}

function mergeKeyTakeaways(
  cms: readonly string[] | undefined,
  base: readonly string[] | undefined
): readonly string[] | undefined {
  if (Array.isArray(cms) && cms.some((line) => filled(line))) {
    return cms.map((line) => (typeof line === "string" ? line : "")).filter((line) => filled(line));
  }
  return base;
}

export function resolvePlaybookChapterStatus(
  chapter: { letter?: string; status?: string | null }
): PlaybookChapterStatus {
  if (chapter.status === "live" || chapter.status === "releasing-soon") {
    return chapter.status;
  }
  return defaultPlaybookChapterStatus(chapter.letter ?? "");
}

export function isPlaybookChapterReleasingSoon(
  chapter: { letter?: string; status?: string | null }
): boolean {
  return resolvePlaybookChapterStatus(chapter) === "releasing-soon";
}

export type PlaybookSectionsMap = Record<string, PlaybookSectionBody[]>;

export type PlaybookResolvedPayload = {
  chapters: PlaybookChapterRecord[];
  sections: PlaybookSectionsMap;
  hubHero: PlaybookHubHeroCopy;
};

type LooseSection = Partial<PlaybookSectionBody> & {
  title?: string;
  pages?: string | number;
};

function filled(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function defaultSectionsMap(): PlaybookSectionsMap {
  const map: PlaybookSectionsMap = {};
  for (const [chapterId, list] of Object.entries(playbookSections)) {
    map[chapterId] = (list as PlaybookSection[]).map((section) => ({ ...section }));
  }
  return map;
}

function defaultChapters(): PlaybookChapterRecord[] {
  return CHAPTERS.map((chapter) => ({
    ...chapter,
    status: defaultPlaybookChapterStatus(chapter.letter),
    sections: (defaultSectionsMap()[chapter.id] ?? []).map((section) => ({ ...section })),
  }));
}

function hasSectionBody(section: LooseSection | undefined): boolean {
  if (!section) return false;
  return (
    filled(section.id) ||
    filled(section.hook) ||
    filled(section.desc) ||
    filled(section.number) ||
    (Array.isArray(section.paragraphs) && section.paragraphs.some((p) => filled(p)))
  );
}

function mergeSection(
  defaults: PlaybookSectionBody | undefined,
  cms: LooseSection | undefined
): PlaybookSectionBody {
  const fallbackNumber =
    filled(cms?.number) ? cms.number : filled(String(cms?.pages ?? "")) ? String(cms?.pages) : "";
  const base: PlaybookSectionBody = defaults ?? {
    id: filled(cms?.id) ? cms.id : "",
    number: fallbackNumber,
    title: filled(cms?.title) ? cms.title : "New Section",
    desc: "",
    hook: "",
    paragraphs: [],
  };

  return {
    ...base,
    ...(cms ?? {}),
    id: filled(cms?.id) ? cms.id : base.id,
    number: filled(cms?.number) ? cms.number : filled(base.number) ? base.number : fallbackNumber,
    title: filled(cms?.title) ? cms.title : base.title,
    desc: filled(cms?.desc) ? cms.desc : base.desc,
    hook: filled(cms?.hook) ? cms.hook : base.hook,
    paragraphs:
      Array.isArray(cms?.paragraphs) && cms.paragraphs.some((p) => filled(p))
        ? cms.paragraphs
        : base.paragraphs,
    pullQuote: filled(cms?.pullQuote) ? cms.pullQuote : base.pullQuote,
    wtmfy: filled(cms?.wtmfy) ? cms.wtmfy : base.wtmfy,
    handoff: filled(cms?.handoff) ? cms.handoff : base.handoff,
    freePreview: cms?.freePreview ?? base.freePreview,
    assets: cms?.assets?.length ? cms.assets : base.assets,
  };
}

function mergeSectionList(
  defaults: PlaybookSectionBody[],
  cmsList: LooseSection[] | undefined
): PlaybookSectionBody[] {
  const usableCms = (cmsList ?? []).filter(hasSectionBody);
  if (!usableCms.length) return defaults.map((section) => ({ ...section }));

  const defaultsById = new Map(defaults.map((section) => [section.id, section]));
  const defaultsByTitle = new Map(defaults.map((section) => [section.title, section]));

  return usableCms.map((cms) => {
    const byId = filled(cms.id) ? defaultsById.get(cms.id) : undefined;
    const byTitle = !byId && filled(cms.title) ? defaultsByTitle.get(cms.title) : undefined;
    return mergeSection(byId ?? byTitle, cms);
  });
}

function mergeChapterMeta(
  defaults: PlaybookChapterRecord | undefined,
  cms: Partial<PlaybookChapterRecord> | undefined,
  sections: PlaybookSectionBody[]
): PlaybookChapterRecord {
  const base = defaults ?? {
    id: filled(cms?.id) ? cms.id : "chapter",
    letter: filled(cms?.letter) ? cms.letter : "X",
    title: filled(cms?.title) ? cms.title : "New Chapter",
    subtitle: "",
    pages: 0,
    status: defaultPlaybookChapterStatus(filled(cms?.letter) ? cms.letter : "X"),
    sections: [],
  };

  const letter = filled(cms?.letter) ? cms.letter : base.letter;
  const status = resolvePlaybookChapterStatus({
    letter,
    status: typeof cms?.status === "string" ? cms.status : base.status,
  });

  return {
    ...base,
    ...(cms ?? {}),
    id: filled(cms?.id) ? cms.id : base.id,
    letter,
    title: filled(cms?.title) ? cms.title : base.title,
    subtitle: filled(cms?.subtitle) ? cms.subtitle : base.subtitle,
    color: playbookChapterHeroColor({ color: filled(cms?.color) ? cms.color : base.color }),
    pages: typeof cms?.pages === "number" ? cms.pages : base.pages,
    preview: cms?.preview ?? base.preview,
    status,
    keyTakeaways: mergeKeyTakeaways(cms?.keyTakeaways, base.keyTakeaways),
    track: cms?.track ?? base.track,
    sections,
  };
}

/** CMS-over-defaults playbook merge keyed by chapter/section id. Empty CMS strings fall back to repo copy. */
export function resolvePlaybookPayload(cms: unknown): PlaybookResolvedPayload {
  const raw = cms && typeof cms === "object" ? (cms as Record<string, unknown>) : {};
  const defaultChaptersList = defaultChapters();
  const defaultMap = defaultSectionsMap();
  const cmsChapters = Array.isArray(raw.chapters)
    ? (raw.chapters as Partial<PlaybookChapterRecord>[])
    : [];
  const cmsSectionsMap =
    raw.sections && typeof raw.sections === "object" && !Array.isArray(raw.sections)
      ? (raw.sections as Record<string, LooseSection[]>)
      : {};

  const defaultsById = new Map(defaultChaptersList.map((chapter) => [chapter.id, chapter]));
  const chapterSource = cmsChapters.length ? cmsChapters : defaultChaptersList;
  const chapters: PlaybookChapterRecord[] = [];

  for (const cmsChapter of chapterSource) {
    const id = filled(cmsChapter.id) ? cmsChapter.id : "";
    const defaults = id ? defaultsById.get(id) : undefined;
    const keyed = id && Array.isArray(cmsSectionsMap[id]) ? cmsSectionsMap[id] : undefined;
    const nested = Array.isArray(cmsChapter.sections)
      ? (cmsChapter.sections as LooseSection[])
      : undefined;
    const cmsList = (nested ?? []).some(hasSectionBody) ? nested : keyed;
    const sections = mergeSectionList(defaults?.sections ?? defaultMap[id] ?? [], cmsList);
    chapters.push(mergeChapterMeta(defaults, cmsChapter, sections));
  }

  const sections: PlaybookSectionsMap = {};
  for (const chapter of chapters) {
    sections[chapter.id] = chapter.sections;
  }
  for (const [chapterId, list] of Object.entries(defaultMap)) {
    if (!sections[chapterId]) {
      sections[chapterId] = mergeSectionList(list, cmsSectionsMap[chapterId]);
    }
  }

  return {
    chapters,
    sections,
    hubHero: mergePlaybookHubHero(
      raw.hubHero && typeof raw.hubHero === "object"
        ? (raw.hubHero as Partial<PlaybookHubHeroCopy>)
        : undefined
    ),
  };
}

/** Keep the keyed `sections` map in sync with nested chapter bodies for public accessors. */
export function playbookPayloadFromEditorChapters(
  chapters: PlaybookChapterRecord[],
  hubHero?: Partial<PlaybookHubHeroCopy>
): Omit<PlaybookResolvedPayload, "hubHero"> & { hubHero?: Partial<PlaybookHubHeroCopy> } {
  const sections: PlaybookSectionsMap = {};
  for (const chapter of chapters) {
    sections[chapter.id] = chapter.sections;
  }
  return { chapters, sections, hubHero };
}
