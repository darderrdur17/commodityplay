import {
  CASE_STUDIES,
  CASE_STUDY_DETAILS,
  type CaseStudyBlock,
  type CaseStudyBlockKind,
  type CaseStudyCallout,
  type CaseStudyCard,
  type CaseStudyLesson,
  type CaseStudyNumberedPoint,
  type CaseStudySection,
  type CaseStudySelfTest,
  type CaseStudySource,
  type CaseStudyStat,
  type CaseStudyTable,
  type CaseStudyTimeline,
  type CaseStudyTimelineTone,
} from "@/data/case-studies";
import { BRAND_NAME } from "@/lib/brand";
import { normalizeCaseStudyTrack } from "@/lib/case-study-category-style";
import { formatCmsHeroCopy, mergeCmsSimpleHero, type CmsSimpleHero } from "@/lib/content/cms-page-copy";
import { SALES_SECTION_MINT } from "@/lib/sales-brand-colors";

/** Light mint fill for navy-hero stat cards (same sales-section mint as Market Nudges). */
export const CASE_STUDY_HERO_STAT_BG = SALES_SECTION_MINT;

export const DEFAULT_CASE_STUDIES_DISCLAIMER =
  "Disclaimer: Case studies, worked examples, market scenarios, and figures throughout are illustrative and hypothetical unless explicitly stated otherwise. They are designed to demonstrate commercial reasoning and market mechanics — not to represent actual historical trades, real company transactions, or verified market data.";

export type CaseStudiesHeroCopy = CmsSimpleHero & {
  disclaimer: string;
};

export const DEFAULT_CASE_STUDIES_HERO: CaseStudiesHeroCopy = {
  eyebrow: "ELITE · {studyCount} STUDIES",
  title: "Case Studies",
  description:
    "Study with commercial reasoning and market mechanics — physical arbs, cross-market reads, freight, and supply disruptions — price dynamics, risk decisions, and lessons learned.",
  disclaimer: DEFAULT_CASE_STUDIES_DISCLAIMER,
};

export type CaseStudyInlinePart =
  | { kind: "text"; text: string }
  | { kind: "strong"; text: string }
  | { kind: "source"; text: string };

/** Pull an inline “Disclaimer:” block out of a CMS description so it can render separately. */
export function splitCaseStudiesHeroDisclaimer(description?: string | null): {
  description: string;
  disclaimer?: string;
} {
  const raw = description ?? "";
  const match = raw.match(/\s+(Disclaimer:[\s\S]*)$/i);
  if (!match || match.index === undefined) {
    return { description: raw.trim() };
  }
  return {
    description: raw.slice(0, match.index).trim(),
    disclaimer: match[1].trim(),
  };
}

export interface CaseStudiesPayload {
  studies: CaseStudyCard[];
  details: Record<string, CaseStudySection[]>;
  hero?: Partial<CaseStudiesHeroCopy>;
}

export function mergeCaseStudiesHero(
  cms?: Partial<CaseStudiesHeroCopy> | null
): CaseStudiesHeroCopy {
  const raw = cms ?? {};
  const split = splitCaseStudiesHeroDisclaimer(raw.description);
  const description = split.description || DEFAULT_CASE_STUDIES_HERO.description;
  const disclaimer =
    raw.disclaimer?.trim() || split.disclaimer || DEFAULT_CASE_STUDIES_HERO.disclaimer;
  return {
    ...mergeCmsSimpleHero(DEFAULT_CASE_STUDIES_HERO, { ...raw, description }),
    disclaimer,
  };
}

export function formatCaseStudiesHeroCopy(template: string, studyCount: number): string {
  return formatCmsHeroCopy(template, { studyCount, brandName: BRAND_NAME });
}

function asTrimmed(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => asTrimmed(item)).filter(Boolean);
}

export function formatCaseStudySourceLabel(inner: string): string {
  const text = inner.trim();
  if (!text) return "";
  if (text.startsWith("(") && text.endsWith(")")) return text;
  return `(${text})`;
}

/** `{{IEA}}` → italic-blue source; `**bold**` stays bold (not glossary links). */
export function parseCaseStudyInline(text: string): CaseStudyInlinePart[] {
  const out: CaseStudyInlinePart[] = [];
  const chunks = String(text ?? "").split(/\{\{([^}]+)\}\}/g);
  chunks.forEach((chunk, index) => {
    if (index % 2 === 1) {
      const inner = chunk.trim();
      if (inner) out.push({ kind: "source", text: inner });
      return;
    }
    const boldParts = chunk.split(/\*\*(.+?)\*\*/g);
    boldParts.forEach((part, boldIndex) => {
      if (!part) return;
      if (boldIndex % 2 === 1) out.push({ kind: "strong", text: part });
      else out.push({ kind: "text", text: part });
    });
  });
  return out;
}

export function caseStudyDisplayNumber(
  study: Pick<CaseStudyCard, "number">,
  index: number
): number {
  const n = study.number;
  if (typeof n === "number" && Number.isFinite(n) && n > 0) return Math.floor(n);
  return index + 1;
}

export function isCaseStudyComingSoon(study: { status?: CaseStudyCard["status"] }): boolean {
  return study.status === "coming-soon";
}

export function isCaseStudyPublished(study: { status?: CaseStudyCard["status"] }): boolean {
  return !isCaseStudyComingSoon(study);
}

export type CaseStudyNavPeer = {
  slug: string;
  title: string;
};

/** Previous published study in CMS list order (skips coming-soon). */
export function caseStudyPreviousPeer(
  studies: CaseStudyCard[],
  currentSlug: string
): CaseStudyNavPeer | null {
  const published = studies.filter(isCaseStudyPublished);
  const index = published.findIndex((s) => s.slug === currentSlug);
  if (index <= 0) return null;
  const prev = published[index - 1]!;
  return { slug: prev.slug, title: prev.title };
}

export function shouldShowCaseStudySidebar(showSidebar?: boolean): boolean {
  return showSidebar === true;
}

export function visibleCaseStudyStats(stats?: CaseStudyStat[] | null): CaseStudyStat[] {
  if (!Array.isArray(stats)) return [];
  return stats
    .map((stat) => ({
      value: asTrimmed(stat?.value),
      label: asTrimmed(stat?.label),
    }))
    .filter((stat) => stat.value || stat.label);
}

export function visibleNumberedPoints(
  points?: CaseStudyNumberedPoint[] | null
): CaseStudyNumberedPoint[] {
  if (!Array.isArray(points)) return [];
  return points
    .map((point) => ({
      lead: asTrimmed(point?.lead),
      body: asTrimmed(point?.body),
    }))
    .filter((point) => point.lead || point.body);
}

export function visibleCaseStudyTable(table?: CaseStudyTable | null): CaseStudyTable | null {
  if (!table || typeof table !== "object") return null;
  const headers = Array.isArray(table.headers) ? table.headers.map((h) => asTrimmed(h)) : [];
  const rows = Array.isArray(table.rows)
    ? table.rows
        .map((row) => (Array.isArray(row) ? row.map((cell) => asTrimmed(cell)) : []))
        .filter((row) => row.some(Boolean))
    : [];
  const colCount = Math.max(headers.length, ...rows.map((row) => row.length), 0);
  if (colCount === 0) return null;
  const paddedHeaders = Array.from({ length: colCount }, (_, i) => headers[i] ?? "");
  const paddedRows = rows.map((row) => Array.from({ length: colCount }, (_, i) => row[i] ?? ""));
  if (paddedRows.length === 0) return null;
  return { headers: paddedHeaders, rows: paddedRows };
}

export function visibleCallout(callout?: CaseStudyCallout | null): CaseStudyCallout | null {
  if (!callout || typeof callout !== "object") return null;
  const kicker = asTrimmed(callout.kicker);
  const items = asStringList(callout.items);
  if (!kicker && items.length === 0) return null;
  return { kicker, items };
}

function asTone(value: unknown): CaseStudyTimelineTone {
  if (value === "positive" || value === "negative" || value === "neutral") return value;
  return "neutral";
}

export function visibleTimeline(timeline?: CaseStudyTimeline | null): CaseStudyTimeline | null {
  if (!timeline || typeof timeline !== "object") return null;
  const kicker = asTrimmed(timeline.kicker);
  const events = Array.isArray(timeline.events)
    ? timeline.events
        .map((event) => ({
          date: asTrimmed(event?.date),
          body: asTrimmed(event?.body),
          tone: asTone(event?.tone),
        }))
        .filter((event) => event.date || event.body)
    : [];
  if (!kicker && events.length === 0) return null;
  return { kicker, events };
}

export function visibleLessons(lessons?: CaseStudyLesson[] | null): CaseStudyLesson[] {
  if (!Array.isArray(lessons)) return [];
  return lessons
    .map((lesson) => ({
      title: asTrimmed(lesson?.title),
      body: asTrimmed(lesson?.body),
    }))
    .filter((lesson) => lesson.title || lesson.body);
}

export function visibleSelfTest(selfTest?: CaseStudySelfTest | null): CaseStudySelfTest | null {
  if (!selfTest || typeof selfTest !== "object") return null;
  const kicker = asTrimmed(selfTest.kicker);
  const questions = Array.isArray(selfTest.questions)
    ? selfTest.questions
        .map((item) => ({
          question: asTrimmed(item?.question),
          answer: asTrimmed(item?.answer),
        }))
        .filter((item) => item.question || item.answer)
    : [];
  if (!kicker && questions.length === 0) return null;
  return { kicker, questions };
}

export function visibleSources(sources?: CaseStudySource[] | null): CaseStudySource[] {
  if (!Array.isArray(sources)) return [];
  return sources
    .map((source) => ({
      name: asTrimmed(source?.name),
      detail: asTrimmed(source?.detail),
    }))
    .filter((source) => source.name || source.detail);
}

function blockId(kind: string, index: number, existing?: string): string {
  if (typeof existing === "string" && existing.trim()) return existing.trim();
  return `csb-${kind}-${index}`;
}

export function createEmptyCaseStudyBlock(kind: CaseStudyBlockKind): CaseStudyBlock {
  const id = `csb-${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  switch (kind) {
    case "title":
    case "paragraph":
    case "quote":
      return { id, kind, text: "" };
    case "numberedPoints":
      return { id, kind, points: [{ lead: "", body: "" }] };
    case "table":
      return {
        id,
        kind,
        table: {
          headers: ["MARKET", "BEFORE", "DURING", "SOURCE"],
          rows: [["", "", "", ""]],
        },
      };
    case "callout":
      return { id, kind, callout: { kicker: "", items: [""] } };
    case "timeline":
      return { id, kind, timeline: { kicker: "", events: [{ date: "", body: "", tone: "neutral" }] } };
    case "lessons":
      return { id, kind, lessons: [{ title: "", body: "" }] };
    case "selfTest":
      return { id, kind, selfTest: { kicker: "", questions: [{ question: "", answer: "" }] } };
    case "sources":
      return { id, kind, sources: [{ name: "", detail: "" }] };
  }
}

/** Member-page order for pre-block CMS payloads (title → paragraphs → list → table → … → quote last). */
export function migrateLegacySectionToBlocks(raw: CaseStudySection): CaseStudyBlock[] {
  const blocks: CaseStudyBlock[] = [];
  let i = 0;
  const title = asTrimmed(raw.title);
  if (title) blocks.push({ id: blockId("title", i++), kind: "title", text: title });
  const paragraphs = Array.isArray(raw.paragraphs) ? raw.paragraphs : [];
  for (const paragraph of paragraphs) {
    const text = typeof paragraph === "string" ? paragraph.trim() : "";
    if (text) blocks.push({ id: blockId("paragraph", i++), kind: "paragraph", text });
  }
  const numberedPoints = visibleNumberedPoints(raw.numberedPoints);
  if (numberedPoints.length) {
    blocks.push({ id: blockId("numberedPoints", i++), kind: "numberedPoints", points: numberedPoints });
  }
  const table = visibleCaseStudyTable(raw.table);
  if (table) blocks.push({ id: blockId("table", i++), kind: "table", table });
  const callout = visibleCallout(raw.callout);
  if (callout) blocks.push({ id: blockId("callout", i++), kind: "callout", callout });
  const timeline = visibleTimeline(raw.timeline);
  if (timeline) blocks.push({ id: blockId("timeline", i++), kind: "timeline", timeline });
  const lessons = visibleLessons(raw.lessons);
  if (lessons.length) blocks.push({ id: blockId("lessons", i++), kind: "lessons", lessons });
  const selfTest = visibleSelfTest(raw.selfTest);
  if (selfTest) blocks.push({ id: blockId("selfTest", i++), kind: "selfTest", selfTest });
  const sources = visibleSources(raw.sources);
  const sourcesNote = asTrimmed(raw.sourcesNote);
  if (sources.length || sourcesNote) {
    blocks.push({
      id: blockId("sources", i++),
      kind: "sources",
      sources,
      note: sourcesNote || undefined,
    });
  }
  const quote = asTrimmed(raw.quote);
  if (quote) blocks.push({ id: blockId("quote", i++), kind: "quote", text: quote });
  return blocks;
}

export function normalizeCaseStudyBlock(raw: unknown, index: number): CaseStudyBlock | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<CaseStudyBlock> & { kind?: string; text?: unknown; note?: unknown };
  const kind = row.kind;
  const id = blockId(kind || "block", index, typeof row.id === "string" ? row.id : undefined);
  switch (kind) {
    case "title":
    case "paragraph":
    case "quote":
      return { id, kind, text: typeof row.text === "string" ? row.text : "" };
    case "numberedPoints": {
      const points = Array.isArray((row as { points?: unknown }).points)
        ? ((row as { points: CaseStudyNumberedPoint[] }).points)
        : [];
      return { id, kind, points };
    }
    case "table": {
      const table = (row as { table?: CaseStudyTable }).table;
      return table && typeof table === "object"
        ? { id, kind, table }
        : { id, kind, table: { headers: [""], rows: [[""]] } };
    }
    case "callout": {
      const callout = (row as { callout?: CaseStudyCallout }).callout;
      return callout && typeof callout === "object"
        ? { id, kind, callout }
        : { id, kind, callout: { kicker: "", items: [] } };
    }
    case "timeline": {
      const timeline = (row as { timeline?: CaseStudyTimeline }).timeline;
      return timeline && typeof timeline === "object"
        ? { id, kind, timeline }
        : { id, kind, timeline: { kicker: "", events: [] } };
    }
    case "lessons": {
      const lessons = Array.isArray((row as { lessons?: CaseStudyLesson[] }).lessons)
        ? (row as { lessons: CaseStudyLesson[] }).lessons
        : [];
      return { id, kind, lessons };
    }
    case "selfTest": {
      const selfTest = (row as { selfTest?: CaseStudySelfTest }).selfTest;
      return selfTest && typeof selfTest === "object"
        ? { id, kind, selfTest }
        : { id, kind, selfTest: { kicker: "", questions: [] } };
    }
    case "sources": {
      const sources = Array.isArray((row as { sources?: CaseStudySource[] }).sources)
        ? (row as { sources: CaseStudySource[] }).sources
        : [];
      const note = typeof row.note === "string" ? row.note : "";
      return { id, kind, sources, note: note || undefined };
    }
    default:
      return null;
  }
}

export function visibleCaseStudyBlocks(blocks?: CaseStudyBlock[] | null): CaseStudyBlock[] {
  if (!Array.isArray(blocks)) return [];
  const out: CaseStudyBlock[] = [];
  for (const block of blocks) {
    switch (block.kind) {
      case "title":
      case "paragraph":
      case "quote": {
        const text = asTrimmed(block.text);
        if (text) out.push({ ...block, text });
        break;
      }
      case "numberedPoints": {
        const points = visibleNumberedPoints(block.points);
        if (points.length) out.push({ ...block, points });
        break;
      }
      case "table": {
        const table = visibleCaseStudyTable(block.table);
        if (table) out.push({ ...block, table });
        break;
      }
      case "callout": {
        const callout = visibleCallout(block.callout);
        if (callout) out.push({ ...block, callout });
        break;
      }
      case "timeline": {
        const timeline = visibleTimeline(block.timeline);
        if (timeline) out.push({ ...block, timeline });
        break;
      }
      case "lessons": {
        const lessons = visibleLessons(block.lessons);
        if (lessons.length) out.push({ ...block, lessons });
        break;
      }
      case "selfTest": {
        const selfTest = visibleSelfTest(block.selfTest);
        if (selfTest) out.push({ ...block, selfTest });
        break;
      }
      case "sources": {
        const sources = visibleSources(block.sources);
        const note = asTrimmed(block.note);
        if (sources.length || note) out.push({ ...block, sources, note: note || undefined });
        break;
      }
    }
  }
  return out;
}

function mirrorLegacyFromBlocks(blocks: CaseStudyBlock[], fallbackTitle: string): Pick<
  CaseStudySection,
  | "title"
  | "paragraphs"
  | "quote"
  | "numberedPoints"
  | "table"
  | "callout"
  | "timeline"
  | "lessons"
  | "selfTest"
  | "sources"
  | "sourcesNote"
> {
  const paragraphs: string[] = [];
  let title = "";
  let quote: string | undefined;
  let numberedPoints: CaseStudyNumberedPoint[] | undefined;
  let table: CaseStudyTable | undefined;
  let callout: CaseStudyCallout | undefined;
  let timeline: CaseStudyTimeline | undefined;
  let lessons: CaseStudyLesson[] | undefined;
  let selfTest: CaseStudySelfTest | undefined;
  let sources: CaseStudySource[] | undefined;
  let sourcesNote: string | undefined;
  for (const block of blocks) {
    switch (block.kind) {
      case "title":
        if (!title) title = asTrimmed(block.text);
        break;
      case "paragraph":
        if (block.text.trim()) paragraphs.push(block.text);
        break;
      case "quote":
        if (!quote) quote = asTrimmed(block.text) || undefined;
        break;
      case "numberedPoints":
        if (!numberedPoints) {
          const points = visibleNumberedPoints(block.points);
          numberedPoints = points.length ? points : undefined;
        }
        break;
      case "table":
        if (!table) table = visibleCaseStudyTable(block.table) ?? undefined;
        break;
      case "callout":
        if (!callout) callout = visibleCallout(block.callout) ?? undefined;
        break;
      case "timeline":
        if (!timeline) timeline = visibleTimeline(block.timeline) ?? undefined;
        break;
      case "lessons":
        if (!lessons) {
          const next = visibleLessons(block.lessons);
          lessons = next.length ? next : undefined;
        }
        break;
      case "selfTest":
        if (!selfTest) selfTest = visibleSelfTest(block.selfTest) ?? undefined;
        break;
      case "sources":
        if (!sources) {
          const next = visibleSources(block.sources);
          sources = next.length ? next : undefined;
          sourcesNote = asTrimmed(block.note) || undefined;
        }
        break;
    }
  }
  return {
    title: title || fallbackTitle,
    paragraphs,
    quote,
    numberedPoints,
    table,
    callout,
    timeline,
    lessons,
    selfTest,
    sources,
    sourcesNote,
  };
}

export function caseStudySectionNavTitle(section: CaseStudySection): string {
  const titleBlock = visibleCaseStudyBlocks(section.blocks).find((b) => b.kind === "title");
  if (titleBlock && titleBlock.kind === "title" && titleBlock.text) return titleBlock.text;
  return asTrimmed(section.title) || asTrimmed(section.label);
}

export function normalizeCaseStudyCard(raw: CaseStudyCard): CaseStudyCard {
  const number =
    typeof raw.number === "number" && Number.isFinite(raw.number) && raw.number > 0
      ? Math.floor(raw.number)
      : undefined;
  const comingSoon = raw.status === "coming-soon";
  return {
    ...raw,
    status: comingSoon ? "coming-soon" : "published",
    number,
    subtitle: asTrimmed(raw.subtitle) || undefined,
    heroBody: asTrimmed(raw.heroBody) || undefined,
    stats: visibleCaseStudyStats(raw.stats),
    showSidebar: raw.showSidebar === true,
    hasFullContent: comingSoon ? false : raw.hasFullContent === true,
    track: normalizeCaseStudyTrack(raw.track),
  };
}

export function normalizeCaseStudySection(raw: CaseStudySection): CaseStudySection {
  const hasBlocks = Array.isArray(raw.blocks);
  const blocks = hasBlocks
    ? (raw.blocks ?? [])
        .map((block, i) => normalizeCaseStudyBlock(block, i))
        .filter((block): block is CaseStudyBlock => Boolean(block))
    : migrateLegacySectionToBlocks(raw);
  const mirrored = mirrorLegacyFromBlocks(blocks, asTrimmed(raw.title));
  return {
    id: raw.id,
    label: asTrimmed(raw.label),
    ...mirrored,
    blocks,
  };
}

function normalizeDetails(details: Record<string, CaseStudySection[]>): Record<string, CaseStudySection[]> {
  const out: Record<string, CaseStudySection[]> = {};
  for (const [slug, sections] of Object.entries(details)) {
    out[slug] = Array.isArray(sections) ? sections.map(normalizeCaseStudySection) : [];
  }
  return out;
}

export function resolveCaseStudiesPayload(payload: unknown): {
  studies: CaseStudyCard[];
  details: Record<string, CaseStudySection[]>;
  hero: CaseStudiesHeroCopy;
} {
  if (Array.isArray(payload)) {
    return {
      studies: (payload.length ? (payload as CaseStudyCard[]) : CASE_STUDIES).map(normalizeCaseStudyCard),
      details: normalizeDetails(CASE_STUDY_DETAILS),
      hero: mergeCaseStudiesHero(undefined),
    };
  }
  const data = (payload ?? {}) as Partial<CaseStudiesPayload>;
  const studies = (data.studies?.length ? data.studies : CASE_STUDIES).map(normalizeCaseStudyCard);
  const details = data.details && Object.keys(data.details).length > 0 ? data.details : CASE_STUDY_DETAILS;
  return {
    studies,
    details: normalizeDetails(details),
    hero: mergeCaseStudiesHero(data.hero),
  };
}

export function buildDefaultCaseStudiesPayload(): CaseStudiesPayload {
  return {
    studies: CASE_STUDIES.map(normalizeCaseStudyCard),
    details: normalizeDetails(CASE_STUDY_DETAILS),
    hero: DEFAULT_CASE_STUDIES_HERO,
  };
}
