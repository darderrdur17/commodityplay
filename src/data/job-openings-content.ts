import { JOB_REGIONS } from "@/data/job-openings";

export interface JobOpeningsHero {
  eyebrow: string;
  title: string;
  description: string;
  /** Supports `{count}` (job listings) and `{regions}` (region count). */
  statChips: string[];
}

export const DEFAULT_JOB_OPENINGS_HERO: JobOpeningsHero = {
  eyebrow: "Elite · Market Tracker",
  title: "Market Job Openings",
  description:
    "Curated roles across commodity trading firms — updated weekly. Filter by region, level, and segment.",
  statChips: ["{count} active roles", "{regions} regions"],
};

export function mergeJobOpeningsHero(
  cms: Partial<JobOpeningsHero> | null | undefined,
  defaults: JobOpeningsHero = DEFAULT_JOB_OPENINGS_HERO
): JobOpeningsHero {
  const raw = cms ?? {};
  const chips = raw.statChips?.map((c) => c.trim()).filter(Boolean);
  return {
    eyebrow: raw.eyebrow?.trim() || defaults.eyebrow,
    title: raw.title?.trim() || defaults.title,
    description: raw.description?.trim() || defaults.description,
    statChips: chips?.length ? chips : defaults.statChips,
  };
}

export function renderJobOpeningsStatChip(
  template: string,
  counts: { jobCount: number; regionCount: number }
): string {
  return template
    .replace(/\{count\}/g, String(counts.jobCount))
    .replace(/\{regions\}/g, String(counts.regionCount));
}

/** Region count excluding the "All" filter option when present. */
export function jobOpeningsRegionCount(regions: readonly string[]): number {
  const withoutAll = regions.filter((r) => r !== "All");
  return withoutAll.length || regions.length || JOB_REGIONS.filter((r) => r !== "All").length;
}
