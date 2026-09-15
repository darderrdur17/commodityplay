/** Reusable CMS blocks for member pages (hero strip + section headings). */

export interface CmsSimpleHero {
  eyebrow: string;
  title: string;
  description: string;
}

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

export function mergeCmsSimpleHero(
  defaults: CmsSimpleHero,
  saved?: Partial<CmsSimpleHero> | null
): CmsSimpleHero {
  const raw = saved ?? {};
  return {
    eyebrow: raw.eyebrow?.trim() || defaults.eyebrow,
    title: raw.title?.trim() || defaults.title,
    description: raw.description?.trim() || defaults.description,
  };
}

/** Replace `{token}` placeholders with live values (e.g. `{studyCount}`, `{roleCount}`). */
export function formatCmsHeroCopy(
  template: string,
  vars: Record<string, string | number>
): string {
  let out = template;
  for (const [key, value] of Object.entries(vars)) {
    out = out.replaceAll(`{${key}}`, String(value));
  }
  return out;
}

/** Allow in-app paths only (`/interview-questions`). Reject protocol-relative and absolute URLs. */
export function sanitizeMemberHref(href: string | undefined, fallback: string): string {
  const trimmed = (href ?? "").trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.includes("://")) {
    return fallback;
  }
  return trimmed;
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
