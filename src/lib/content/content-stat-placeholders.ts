/** Live counts from published CMS (with code defaults). */
export interface ContentStatsSnapshot {
  chapterCount: number;
  sectionCount: number;
  templateCount: number;
  roleCount: number;
  interviewCount: number;
  knowledgeTestCount: number;
  caseStudyCount: number;
  deskQaCount: number;
  deskSegmentCount: number;
  mentorCount: number;
  segmentCount: number;
  jobCount: number;
  glossaryCount: number;
}

const PLACEHOLDER_MAP: Record<string, keyof ContentStatsSnapshot> = {
  chapterCount: "chapterCount",
  sectionCount: "sectionCount",
  templateCount: "templateCount",
  roleCount: "roleCount",
  interviewCount: "interviewCount",
  knowledgeTestCount: "knowledgeTestCount",
  caseStudyCount: "caseStudyCount",
  deskQaCount: "deskQaCount",
  qaCount: "deskQaCount",
  deskSegmentCount: "deskSegmentCount",
  segmentCount: "segmentCount",
  mentorCount: "mentorCount",
  jobCount: "jobCount",
  glossaryCount: "glossaryCount",
};

/** Client-safe placeholder docs — keep separate from server-only getContentStats(). */
export const CONTENT_STAT_PLACEHOLDER_HINT =
  "{chapterCount}, {sectionCount}, {templateCount}, {roleCount}, {interviewCount}, {knowledgeTestCount}, {caseStudyCount}, {deskQaCount}, {mentorCount}, {segmentCount}, {jobCount}, {glossaryCount}";

/** Replace `{chapterCount}`, `{templateCount}`, etc. Unknown tokens are left as-is. */
export function formatContentPlaceholders(
  template: string,
  stats: Partial<ContentStatsSnapshot>
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const statKey = PLACEHOLDER_MAP[key];
    if (!statKey || stats[statKey] === undefined) return match;
    return String(stats[statKey]);
  });
}

/** Recursively resolve placeholders in nested CMS objects (landing copy, etc.). */
export function formatContentPlaceholdersDeep<T>(value: T, stats: Partial<ContentStatsSnapshot>): T {
  if (typeof value === "string") {
    return formatContentPlaceholders(value, stats) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => formatContentPlaceholdersDeep(item, stats)) as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      out[key] = formatContentPlaceholdersDeep(nested, stats);
    }
    return out as T;
  }
  return value;
}
