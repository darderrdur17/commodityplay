import {
  CASE_STUDIES,
  CASE_STUDY_DETAILS,
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
import { formatCmsHeroCopy, mergeCmsSimpleHero, type CmsSimpleHero } from "@/lib/content/cms-page-copy";

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

export function normalizeCaseStudyCard(raw: CaseStudyCard): CaseStudyCard {
  const number =
    typeof raw.number === "number" && Number.isFinite(raw.number) && raw.number > 0
      ? Math.floor(raw.number)
      : undefined;
  return {
    ...raw,
    number,
    subtitle: asTrimmed(raw.subtitle) || undefined,
    heroBody: asTrimmed(raw.heroBody) || undefined,
    stats: visibleCaseStudyStats(raw.stats),
    showSidebar: raw.showSidebar === true,
  };
}

export function normalizeCaseStudySection(raw: CaseStudySection): CaseStudySection {
  const paragraphs = Array.isArray(raw.paragraphs)
    ? raw.paragraphs.map((p) => (typeof p === "string" ? p : "")).filter((p) => p.trim())
    : [];
  const numberedPoints = visibleNumberedPoints(raw.numberedPoints);
  const table = visibleCaseStudyTable(raw.table);
  const callout = visibleCallout(raw.callout);
  const timeline = visibleTimeline(raw.timeline);
  const lessons = visibleLessons(raw.lessons);
  const selfTest = visibleSelfTest(raw.selfTest);
  const sources = visibleSources(raw.sources);
  return {
    id: raw.id,
    label: asTrimmed(raw.label),
    title: asTrimmed(raw.title),
    paragraphs,
    quote: asTrimmed(raw.quote) || undefined,
    numberedPoints: numberedPoints.length ? numberedPoints : undefined,
    table: table ?? undefined,
    callout: callout ?? undefined,
    timeline: timeline ?? undefined,
    lessons: lessons.length ? lessons : undefined,
    selfTest: selfTest ?? undefined,
    sources: sources.length ? sources : undefined,
    sourcesNote: asTrimmed(raw.sourcesNote) || undefined,
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
