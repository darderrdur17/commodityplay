import type { FeatureComparisonGroup, LandingContent } from "@/data/landing-content";

type PlainObject = Record<string, unknown>;

function isPlainObject(value: unknown): value is PlainObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** CMS values win; defaults fill missing keys. */
export function deepMerge<T extends PlainObject>(defaults: T, overrides: Partial<T> | PlainObject): T {
  const result = { ...defaults };

  for (const key of Object.keys(overrides)) {
    const overrideVal = overrides[key];
    const defaultVal = defaults[key];

    if (overrideVal === undefined) continue;

    if (isPlainObject(overrideVal) && isPlainObject(defaultVal)) {
      result[key as keyof T] = deepMerge(
        defaultVal as PlainObject,
        overrideVal
      ) as T[keyof T];
      continue;
    }

    result[key as keyof T] = overrideVal as T[keyof T];
  }

  return result;
}

export function mergeByKey<T>(
  defaults: T[],
  overrides: T[],
  key: keyof T
): T[] {
  const overrideMap = new Map(overrides.map((item) => [String(item[key]), item]));
  return defaults.map((item) => {
    const match = overrideMap.get(String(item[key]));
    return match ? ({ ...item, ...match } as T) : item;
  });
}

/** Same as mergeByKey but repo defaults win over CMS on conflicting fields. */
export function mergeByKeyDefaultsWin<T>(
  defaults: T[],
  overrides: T[],
  key: keyof T
): T[] {
  const overrideMap = new Map(overrides.map((item) => [String(item[key]), item]));
  return defaults.map((item) => {
    const match = overrideMap.get(String(item[key]));
    return match ? ({ ...match, ...item } as T) : item;
  });
}

/** Repo-managed case study headers — code defaults always win over stale CMS copy. */
export function resolveCaseStudySample(
  defaults: LandingContent,
  cms?: Partial<LandingContent["caseStudySample"]>
): LandingContent["caseStudySample"] {
  return {
    eyebrow: defaults.caseStudySample.eyebrow,
    title: defaults.caseStudySample.title,
    titleAccent: defaults.caseStudySample.titleAccent,
    description: defaults.caseStudySample.description,
    categoryTags: defaults.caseStudySample.categoryTags,
    disclaimer: defaults.caseStudySample.disclaimer,
    viewMoreHref: defaults.caseStudySample.viewMoreHref,
    cards: mergeByKeyDefaultsWin(
      defaults.caseStudySample.cards,
      cms?.cards ?? [],
      "slug"
    ),
  };
}

/** Repo-managed chapter coverage headers — code defaults always win over stale CMS copy. */
export function resolveChapterCoverage(
  defaults: LandingContent,
  cms?: Partial<LandingContent["chapterCoverage"]>
): LandingContent["chapterCoverage"] {
  return {
    eyebrow: defaults.chapterCoverage.eyebrow,
    title: defaults.chapterCoverage.title,
    description: defaults.chapterCoverage.description,
    chapters: mergeByKeyDefaultsWin(
      defaults.chapterCoverage.chapters,
      cms?.chapters ?? [],
      "letter"
    ),
  };
}

/** Repo-managed What's Inside copy — headers from code; feature rows merge by title. */
export function resolveWhatsInside(
  defaults: LandingContent,
  cms?: Partial<LandingContent["whatsInside"]>
): LandingContent["whatsInside"] {
  return {
    titleLine1: defaults.whatsInside.titleLine1,
    titleLine2: defaults.whatsInside.titleLine2,
    description: defaults.whatsInside.description,
    features: mergeByKeyDefaultsWin(
      defaults.whatsInside.features,
      cms?.features ?? [],
      "title"
    ),
  };
}

/** Admin edits to a Feature Comparison table fully replace defaults once saved (full editorial control over cells). */
export function resolveComparisonGroups(
  defaultGroups: FeatureComparisonGroup[],
  cmsGroups?: FeatureComparisonGroup[]
): FeatureComparisonGroup[] {
  return cmsGroups && cmsGroups.length > 0 ? cmsGroups : defaultGroups;
}

/** Career track pricing — CMS edits (price, tiers, feature comparison) apply; code fills any missing tiers. */
export function resolvePricing(
  defaults: LandingContent,
  cms?: Partial<LandingContent["pricing"]>
): LandingContent["pricing"] {
  return {
    title: cms?.title || defaults.pricing.title,
    subtitle: cms?.subtitle || defaults.pricing.subtitle,
    tiers: cms?.tiers?.length ? mergeByKey(defaults.pricing.tiers, cms.tiers, "name") : defaults.pricing.tiers,
    comparison: {
      groups: resolveComparisonGroups(defaults.pricing.comparison.groups, cms?.comparison?.groups),
    },
  };
}

/** Sales track pricing — CMS edits (price, tiers) apply; code fills any missing tiers. */
export function resolveSalesPricing(
  defaults: LandingContent,
  cms?: Partial<LandingContent["sales"]>
): LandingContent["sales"]["pricing"] {
  return cms?.pricing?.length ? mergeByKey(defaults.sales.pricing, cms.pricing, "name") : defaults.sales.pricing;
}

/** Repo-managed sales ROI copy — headers from code; stat rows merge by label. */
export function resolveSalesRoi(
  defaults: LandingContent,
  cms?: Partial<LandingContent["sales"]>
): LandingContent["sales"]["roi"] {
  return {
    eyebrow: defaults.sales.roi.eyebrow,
    title: defaults.sales.roi.title,
    titleAccent: defaults.sales.roi.titleAccent,
    description: defaults.sales.roi.description,
    quote: defaults.sales.roi.quote,
    quoteAuthor: defaults.sales.roi.quoteAuthor,
    quoteSubtitle: defaults.sales.roi.quoteSubtitle,
    stats: mergeByKeyDefaultsWin(
      defaults.sales.roi.stats,
      cms?.roi?.stats ?? [],
      "label"
    ),
  };
}

/** Career hero copy — repo defaults win over stale CMS seed data. */
export function resolveCareerContent(
  defaults: LandingContent,
  cms?: Partial<LandingContent["career"]>
): LandingContent["career"] {
  const base = cms ? { ...defaults.career, ...cms } : defaults.career;
  return {
    ...base,
    eyebrow: defaults.career.eyebrow,
    headline: defaults.career.headline,
    headlineAccent: defaults.career.headlineAccent,
    description: defaults.career.description,
    heroStats: mergeByKeyDefaultsWin(
      defaults.career.heroStats,
      cms?.heroStats ?? [],
      "label"
    ),
    ctaPrimary: defaults.career.ctaPrimary,
    ctaSecondary: defaults.career.ctaSecondary,
  };
}

/** Sales track sections that must stay in sync with repo deploys, not stale CMS seed data. */
export function resolveSalesContent(
  defaults: LandingContent,
  cms?: Partial<LandingContent["sales"]>
): LandingContent["sales"] {
  const base = cms ? { ...defaults.sales, ...cms } : defaults.sales;
  return {
    ...base,
    eyebrow: defaults.sales.eyebrow,
    headline: defaults.sales.headline,
    headlineAccent: defaults.sales.headlineAccent,
    description: defaults.sales.description,
    stats: mergeByKeyDefaultsWin(
      defaults.sales.stats,
      cms?.stats ?? [],
      "label"
    ),
    pricing: resolveSalesPricing(defaults, cms),
    comparison: {
      groups: resolveComparisonGroups(defaults.sales.comparison.groups, cms?.comparison?.groups),
    },
    roi: resolveSalesRoi(defaults, cms),
  };
}

/** Repo-managed ground-level section — not on landing today, but protected for CMS/admin parity. */
export function resolveGroundLevelView(
  defaults: LandingContent,
  cms?: Partial<LandingContent["groundLevelView"]>
): LandingContent["groundLevelView"] {
  return {
    eyebrow: defaults.groundLevelView.eyebrow,
    title: defaults.groundLevelView.title,
    description: defaults.groundLevelView.description,
    features: mergeByKeyDefaultsWin(
      defaults.groundLevelView.features,
      cms?.features ?? [],
      "title"
    ),
  };
}

/** Merge CMS landing copy over code defaults without losing new chapters/tiers from deploys. */
export function mergeLandingContent(
  defaults: LandingContent,
  cms: Partial<LandingContent>
): LandingContent {
  const merged = deepMerge(
    defaults as unknown as PlainObject,
    cms as PlainObject
  ) as unknown as LandingContent;

  // Repo-managed sections — code defaults always win for headers + structure
  merged.chapterCoverage = resolveChapterCoverage(defaults, cms.chapterCoverage);
  merged.caseStudySample = resolveCaseStudySample(defaults, cms.caseStudySample);
  merged.whatsInside = resolveWhatsInside(defaults, cms.whatsInside);
  merged.groundLevelView = resolveGroundLevelView(defaults, cms.groundLevelView);

  merged.pricing = resolvePricing(defaults, cms.pricing);

  if (cms.sales?.whoCards?.length) {
    merged.sales = {
      ...merged.sales,
      whoCards: mergeByKey(defaults.sales.whoCards, cms.sales.whoCards, "title"),
    };
  }

  if (cms.career?.heroStats?.length) {
    merged.career = {
      ...merged.career,
      ...cms.career,
      heroStats: mergeByKey(defaults.career.heroStats, cms.career.heroStats, "label"),
    };
  }

  // Repo-managed career CTAs stay in sync with deploys
  merged.career = {
    ...merged.career,
    ctaPrimary: defaults.career.ctaPrimary,
    ctaSecondary: defaults.career.ctaSecondary,
  };

  if (cms.stats?.length) {
    merged.stats = mergeByKey(defaults.stats, cms.stats, "label");
  }

  // Sales pricing, ROI, and hero stats — repo defaults win over stale CMS seed data.
  merged.sales = {
    ...merged.sales,
    ...resolveSalesContent(defaults, cms.sales),
    whoCards: merged.sales.whoCards,
  };

  return merged;
}
