import { JOB_REGIONS } from "@/data/job-openings";

export interface JobOpeningsHero {
  eyebrow: string;
  title: string;
  description: string;
  /** Smaller muted line at the bottom of the navy strip (same pattern as Case Studies). */
  disclaimer: string;
  /** Supports `{count}` (job listings) and `{regions}` (region count). */
  statChips: string[];
}

export const DEFAULT_JOB_OPENINGS_DISCLAIMER =
  "Note: The live chat does not guarantee a job advancement or an interview, but this allows hirers to offer an initial meeting or conversation solely at their discretion.";

export const DEFAULT_JOB_OPENINGS_HERO: JobOpeningsHero = {
  eyebrow: "Elite · Market Tracker",
  title: "Market Job Openings",
  description:
    "Curated roles across commodity trading firms — updated weekly. Filter by region, level, and segment.",
  disclaimer: DEFAULT_JOB_OPENINGS_DISCLAIMER,
  statChips: ["{count} active roles", "{regions} regions"],
};

/** Pull an inline “Note:” / “Disclaimer:” block out of a CMS description. */
export function splitJobOpeningsHeroDisclaimer(description?: string | null): {
  description: string;
  disclaimer?: string;
} {
  const raw = description ?? "";
  const match = raw.match(/\s+((?:Note|Disclaimer):[\s\S]*)$/i);
  if (!match || match.index === undefined) {
    return { description: raw.trim() };
  }
  return {
    description: raw.slice(0, match.index).trim(),
    disclaimer: match[1].trim(),
  };
}

export function mergeJobOpeningsHero(
  cms: Partial<JobOpeningsHero> | null | undefined,
  defaults: JobOpeningsHero = DEFAULT_JOB_OPENINGS_HERO
): JobOpeningsHero {
  const raw = cms ?? {};
  const chips = raw.statChips?.map((c) => c.trim()).filter(Boolean);
  const split = splitJobOpeningsHeroDisclaimer(raw.description);
  return {
    eyebrow: raw.eyebrow?.trim() || defaults.eyebrow,
    title: raw.title?.trim() || defaults.title,
    description: split.description || defaults.description,
    disclaimer: raw.disclaimer?.trim() || split.disclaimer || defaults.disclaimer,
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
