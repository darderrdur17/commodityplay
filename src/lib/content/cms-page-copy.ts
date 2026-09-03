/** Reusable CMS blocks for member pages (hero strip + section headings). */

export interface CmsPageHero {
  eyebrow: string;
  title: string;
  titleAccent: string;
  description: string;
  stats: { num: string; label: string }[];
}

export interface CmsSectionHeading {
  eyebrow: string;
  title: string;
  description: string;
}

export function mergeCmsPageHero(
  defaults: CmsPageHero,
  saved?: Partial<CmsPageHero> | null
): CmsPageHero {
  const raw = saved ?? {};
  const stats =
    Array.isArray(raw.stats) && raw.stats.length > 0
      ? raw.stats.map((stat, i) => ({
          num: stat.num?.trim() || defaults.stats[i]?.num || "",
          label: stat.label?.trim() || defaults.stats[i]?.label || "",
        }))
      : defaults.stats;
  return {
    eyebrow: raw.eyebrow?.trim() || defaults.eyebrow,
    title: raw.title?.trim() || defaults.title,
    titleAccent: raw.titleAccent?.trim() || defaults.titleAccent,
    description: raw.description?.trim() || defaults.description,
    stats,
  };
}

export function mergeCmsSectionHeading(
  defaults: CmsSectionHeading,
  saved?: Partial<CmsSectionHeading> | null
): CmsSectionHeading {
  const raw = saved ?? {};
  return {
    eyebrow: raw.eyebrow?.trim() || defaults.eyebrow,
    title: raw.title?.trim() || defaults.title,
    description: raw.description?.trim() || defaults.description,
  };
}
