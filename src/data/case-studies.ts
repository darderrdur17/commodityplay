import index from "./case-studies-index.json";
import details from "./case-studies-details.json";

export interface CaseStudyStat {
  value: string;
  label: string;
}

export interface CaseStudyNumberedPoint {
  lead: string;
  body: string;
}

export interface CaseStudyTable {
  headers: string[];
  rows: string[][];
}

export interface CaseStudyCallout {
  kicker: string;
  items: string[];
}

export type CaseStudyTimelineTone = "negative" | "positive" | "neutral";

export interface CaseStudyTimelineEvent {
  date: string;
  body: string;
  tone?: CaseStudyTimelineTone;
}

export interface CaseStudyTimeline {
  kicker: string;
  events: CaseStudyTimelineEvent[];
}

export interface CaseStudyLesson {
  title: string;
  body: string;
}

export interface CaseStudySelfTestQuestion {
  question: string;
  answer: string;
}

export interface CaseStudySelfTest {
  kicker: string;
  questions: CaseStudySelfTestQuestion[];
}

export interface CaseStudySource {
  name: string;
  detail: string;
}

export interface CaseStudyCard {
  slug: string;
  id: string;
  category: string;
  title: string;
  catchLine: string;
  description: string;
  readMinutes: number;
  status: "published" | "coming-soon";
  hasFullContent: boolean;
  /** Override for “CASE STUDY {n}”. If omitted, list order (1-based) is used. */
  number?: number;
  subtitle?: string;
  heroBody?: string;
  stats?: CaseStudyStat[];
  /** Member TOC. Default off so the page stays uncluttered. */
  showSidebar?: boolean;
  /** Career, Sales, or Both — drives category pill color on list/detail (sales = green). */
  track?: "career" | "sales" | "both";
}

export type CaseStudyBlock =
  | { id: string; kind: "title"; text: string }
  | { id: string; kind: "paragraph"; text: string }
  | { id: string; kind: "quote"; text: string }
  | { id: string; kind: "numberedPoints"; points: CaseStudyNumberedPoint[] }
  | { id: string; kind: "table"; table: CaseStudyTable }
  | { id: string; kind: "callout"; callout: CaseStudyCallout }
  | { id: string; kind: "timeline"; timeline: CaseStudyTimeline }
  | { id: string; kind: "lessons"; lessons: CaseStudyLesson[] }
  | { id: string; kind: "selfTest"; selfTest: CaseStudySelfTest }
  | { id: string; kind: "sources"; sources: CaseStudySource[]; note?: string };

export type CaseStudyBlockKind = CaseStudyBlock["kind"];

export interface CaseStudySection {
  id: string;
  label: string;
  title: string;
  paragraphs: string[];
  quote?: string;
  numberedPoints?: CaseStudyNumberedPoint[];
  table?: CaseStudyTable;
  callout?: CaseStudyCallout;
  timeline?: CaseStudyTimeline;
  lessons?: CaseStudyLesson[];
  selfTest?: CaseStudySelfTest;
  sources?: CaseStudySource[];
  sourcesNote?: string;
  /** Ordered article body. Legacy sections without this are migrated on read. */
  blocks?: CaseStudyBlock[];
}

function slugify(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export const CASE_STUDIES: CaseStudyCard[] = (index as Array<{
  id: string;
  category: string;
  title: string;
  catchLine: string;
  description: string;
  readMinutes: number;
  status: string;
}>)
  .filter((c) => c.status === "published")
  .map((c) => {
    const slug = slugify(c.title);
    return {
      slug,
      id: c.id,
      category: c.category.replace(/&amp;/g, "&"),
      title: c.title,
      catchLine: c.catchLine,
      description: c.description,
      readMinutes: c.readMinutes,
      status: "published" as const,
      hasFullContent: Boolean((details as Record<string, CaseStudySection[]>)[slug]?.length),
    };
  });

export const CASE_STUDY_DETAILS = details as Record<string, CaseStudySection[]>;

export function getCaseStudy(slug: string) {
  const card = CASE_STUDIES.find((c) => c.slug === slug);
  if (!card) return null;
  const sections = CASE_STUDY_DETAILS[slug] || null;
  return { card, sections };
}
