import type { FeatureComparisonGroup, LandingContent } from "@/data/landing-content";
import type { MentorOverride, MentorProfile, MentorSegment } from "@/data/mentors";
import { UNASSIGNED_SEGMENT_ID } from "@/data/mentors";

/**
 * SERVER-ONLY merge helpers — used by getLandingContent(), mergeLandingContent(), and
 * deploy sync. Do not import these in client components; CMS copy is merged once on the
 * server so live pages reflect admin saves without a second pass over repo defaults.
 */

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

/** Case study sample — CMS copy wins; repo defaults fill structure and new cards. */
export function resolveCaseStudySample(
  defaults: LandingContent,
  cms?: Partial<LandingContent["caseStudySample"]>
): LandingContent["caseStudySample"] {
  return {
    eyebrow: cms?.eyebrow ?? defaults.caseStudySample.eyebrow,
    title: cms?.title ?? defaults.caseStudySample.title,
    titleAccent: cms?.titleAccent ?? defaults.caseStudySample.titleAccent,
    description: cms?.description ?? defaults.caseStudySample.description,
    categoryTags: cms?.categoryTags ?? defaults.caseStudySample.categoryTags,
    disclaimer: cms?.disclaimer ?? defaults.caseStudySample.disclaimer,
    viewMoreHref: cms?.viewMoreHref ?? defaults.caseStudySample.viewMoreHref,
    cards: cms?.cards?.length
      ? mergeByKey(defaults.caseStudySample.cards, cms.cards, "slug")
      : defaults.caseStudySample.cards,
  };
}

/** Chapter coverage — CMS section copy wins; chapter rows merge by letter. */
export function resolveChapterCoverage(
  defaults: LandingContent,
  cms?: Partial<LandingContent["chapterCoverage"]>
): LandingContent["chapterCoverage"] {
  return {
    eyebrow: cms?.eyebrow ?? defaults.chapterCoverage.eyebrow,
    title: cms?.title ?? defaults.chapterCoverage.title,
    description: cms?.description ?? defaults.chapterCoverage.description,
    chapters: cms?.chapters?.length
      ? mergeByKey(defaults.chapterCoverage.chapters, cms.chapters, "letter")
      : defaults.chapterCoverage.chapters,
  };
}

/** What's Inside — CMS section copy wins; feature rows merge by title. */
export function resolveWhatsInside(
  defaults: LandingContent,
  cms?: Partial<LandingContent["whatsInside"]>
): LandingContent["whatsInside"] {
  return {
    titleLine1: cms?.titleLine1 ?? defaults.whatsInside.titleLine1,
    titleLine2: cms?.titleLine2 ?? defaults.whatsInside.titleLine2,
    description: cms?.description ?? defaults.whatsInside.description,
    features: cms?.features?.length
      ? mergeByKey(defaults.whatsInside.features, cms.features, "title")
      : defaults.whatsInside.features,
  };
}

/** Admin edits to a Feature Comparison table fully replace defaults once saved (full editorial control over cells). */
export function resolveComparisonGroups(
  defaultGroups: FeatureComparisonGroup[],
  cmsGroups?: FeatureComparisonGroup[]
): FeatureComparisonGroup[] {
  return cmsGroups && cmsGroups.length > 0 ? cmsGroups : defaultGroups;
}

/** Career landing testimonials — fully CMS-editable (not code-locked). */
export function resolveTestimonials(
  defaults: LandingContent,
  cms?: Partial<LandingContent["testimonials"]>
): LandingContent["testimonials"] {
  return {
    eyebrow: cms?.eyebrow ?? defaults.testimonials.eyebrow,
    title: cms?.title ?? defaults.testimonials.title,
    items: cms?.items?.length ? cms.items : defaults.testimonials.items,
  };
}

/** Mentor Connect hero copy — fully CMS-editable (not code-locked). */
export function resolveMentorConnect(
  defaults: LandingContent,
  cms?: Partial<LandingContent["mentorConnect"]>
): LandingContent["mentorConnect"] {
  return {
    eyebrow: cms?.eyebrow ?? defaults.mentorConnect.eyebrow,
    title: cms?.title ?? defaults.mentorConnect.title,
  };
}

/** Career track pricing — CMS edits (price, tiers, feature comparison) apply; code fills any missing tiers. */
export function resolvePricing(
  defaults: LandingContent,
  cms?: Partial<LandingContent["pricing"]>
): LandingContent["pricing"] {
  return {
    title: cms?.title ?? defaults.pricing.title,
    subtitle: cms?.subtitle ?? defaults.pricing.subtitle,
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

/** Sales ROI — CMS copy wins; stat rows merge by label. */
export function resolveSalesRoi(
  defaults: LandingContent,
  cms?: Partial<LandingContent["sales"]>
): LandingContent["sales"]["roi"] {
  const cmsRoi = cms?.roi;
  return {
    eyebrow: cmsRoi?.eyebrow ?? defaults.sales.roi.eyebrow,
    title: cmsRoi?.title ?? defaults.sales.roi.title,
    titleAccent: cmsRoi?.titleAccent ?? defaults.sales.roi.titleAccent,
    description: cmsRoi?.description ?? defaults.sales.roi.description,
    quote: cmsRoi?.quote ?? defaults.sales.roi.quote,
    quoteAuthor: cmsRoi?.quoteAuthor ?? defaults.sales.roi.quoteAuthor,
    quoteSubtitle: cmsRoi?.quoteSubtitle ?? defaults.sales.roi.quoteSubtitle,
    stats: cmsRoi?.stats?.length
      ? mergeByKey(defaults.sales.roi.stats, cmsRoi.stats, "label")
      : defaults.sales.roi.stats,
  };
}

/** Prefer an explicit CMS string when the admin saved one (including empty overrides). */
function cmsString(cms: string | undefined, fallback: string): string {
  return cms !== undefined ? cms : fallback;
}

/** Career hero — CMS copy wins; repo defaults fill missing structure. */
export function resolveCareerContent(
  defaults: LandingContent,
  cms?: Partial<LandingContent["career"]>
): LandingContent["career"] {
  const base = cms ? { ...defaults.career, ...cms } : defaults.career;
  return {
    ...base,
    eyebrow: cmsString(cms?.eyebrow, defaults.career.eyebrow),
    headline: cmsString(cms?.headline, defaults.career.headline),
    headlineAccent: cmsString(cms?.headlineAccent, defaults.career.headlineAccent),
    description: cmsString(cms?.description, defaults.career.description),
    heroStats: cms?.heroStats?.length
      ? mergeByKey(defaults.career.heroStats, cms.heroStats, "label")
      : defaults.career.heroStats,
    ctaPrimary: cmsString(cms?.ctaPrimary, defaults.career.ctaPrimary),
    ctaSecondary: cmsString(cms?.ctaSecondary, defaults.career.ctaSecondary),
    ...resolveCareerFinalCta(defaults, cms),
  };
}

function resolveCareerFinalCta(
  defaults: LandingContent,
  cms?: Partial<LandingContent["career"]>
): Pick<LandingContent["career"], "finalCtaTitle" | "finalCtaAccent"> {
  const defaultTitle = defaults.career.finalCtaTitle;
  const defaultAccent = defaults.career.finalCtaAccent;

  let title = cmsString(cms?.finalCtaTitle, defaultTitle).trim();
  let accent = cms?.finalCtaAccent !== undefined ? cms.finalCtaAccent : defaultAccent;

  // Strip legacy combined copy so accent isn't duplicated on the page.
  title = title
    .split("\n")[0]
    ?.replace(/\s*join the desk community\.?\s*(today\.?)?\s*/gi, " ")
    .replace(/\s+/g, " ")
    .trim() || defaultTitle;

  if (!title) title = defaultTitle;

  return { finalCtaTitle: title, finalCtaAccent: accent };
}

/** Sales track — CMS copy wins; repo defaults fill missing structure. */
export function resolveSalesContent(
  defaults: LandingContent,
  cms?: Partial<LandingContent["sales"]>
): LandingContent["sales"] {
  const base = cms ? { ...defaults.sales, ...cms } : defaults.sales;
  return {
    ...base,
    eyebrow: cmsString(cms?.eyebrow, defaults.sales.eyebrow),
    headline: cmsString(cms?.headline, defaults.sales.headline),
    headlineAccent: cmsString(cms?.headlineAccent, defaults.sales.headlineAccent),
    description: cmsString(cms?.description, defaults.sales.description),
    ctaPrimary: cmsString(cms?.ctaPrimary, defaults.sales.ctaPrimary),
    ctaSecondary: cmsString(cms?.ctaSecondary, defaults.sales.ctaSecondary),
    stats: cms?.stats?.length
      ? mergeByKey(defaults.sales.stats, cms.stats, "label")
      : defaults.sales.stats,
    pricing: resolveSalesPricing(defaults, cms),
    comparison: {
      groups: resolveComparisonGroups(defaults.sales.comparison.groups, cms?.comparison?.groups),
    },
    roi: resolveSalesRoi(defaults, cms),
  };
}

/** Ground-level section — CMS copy wins; feature rows merge by title. */
export function resolveGroundLevelView(
  defaults: LandingContent,
  cms?: Partial<LandingContent["groundLevelView"]>
): LandingContent["groundLevelView"] {
  return {
    eyebrow: cms?.eyebrow ?? defaults.groundLevelView.eyebrow,
    title: cms?.title ?? defaults.groundLevelView.title,
    description: cms?.description ?? defaults.groundLevelView.description,
    features: cms?.features?.length
      ? mergeByKey(defaults.groundLevelView.features, cms.features, "title")
      : defaults.groundLevelView.features,
  };
}

/** Turn a brand-new mentor override (self-submitted application or admin-added mentor,
 * `isNew: true`) into a full `MentorProfile`-shaped row for the admin Mentors tab. */
function synthesizeMentorProfile(override: MentorOverride): MentorProfile {
  return {
    id: override.id,
    headline: override.headline ?? "",
    years: override.years ?? 0,
    bio: override.bio ?? "",
    sampleReply: override.sampleReply ?? "",
    tags: override.tags ?? [],
    name: override.name,
    email: override.email,
    company: override.company,
    track: override.track ?? "both",
    status: override.status ?? "pending",
    isNew: true,
  };
}

/**
 * Layer admin-saved mentor overrides (from the "mentors" CMS module) over the static
 * mentors.json defaults, keyed by mentor id. Only fields present on the override are
 * applied; anything omitted falls back to the static default. `track` defaults to
 * "both" for profiles that have never been given an explicit track. `name`/`email`/
 * `company` are admin-only identity fields and must never reach public-facing surfaces.
 *
 * Overrides with `isNew: true` don't match any static mentor — they're brand-new
 * entries (self-submitted applications via /mentor-apply, or admin-added mentors)
 * and are synthesized into full profile rows, grouped by `segmentId` into the segment
 * the applicant picked. Entries with no matching real segment (or `segmentId` unset /
 * `UNASSIGNED_SEGMENT_ID`) land in a synthetic "Unassigned" segment appended at the
 * end — this pseudo-segment exists only in the resolved output (admin Mentors tab),
 * never in the static defaults, so it's invisible to any public-facing consumer that
 * reads `MENTOR_SEGMENTS` directly.
 */
export function resolveMentorSegments(
  defaults: MentorSegment[],
  overrides: MentorOverride[]
): MentorSegment[] {
  const overrideMap = new Map(overrides.map((o) => [o.id, o]));
  const defaultIds = new Set(defaults.flatMap((s) => s.mentors.map((m) => m.id)));

  const resolved: MentorSegment[] = defaults.map((segment) => ({
    ...segment,
    mentors: segment.mentors.map((mentor): MentorProfile => {
      const override = overrideMap.get(mentor.id);
      return {
        ...mentor,
        headline: override?.headline ?? mentor.headline,
        years: override?.years ?? mentor.years,
        bio: override?.bio ?? mentor.bio,
        sampleReply: override?.sampleReply ?? mentor.sampleReply,
        tags: override?.tags ?? mentor.tags,
        name: override?.name ?? mentor.name,
        email: override?.email ?? mentor.email,
        company: override?.company ?? mentor.company,
        track: override?.track ?? mentor.track ?? "both",
        status: override?.status ?? mentor.status ?? "active",
      };
    }),
  }));

  const newOverrides = overrides.filter((o) => o.isNew && !defaultIds.has(o.id));
  const segmentIndexById = new Map(resolved.map((s, i) => [s.id, i] as const));
  const unassigned: MentorProfile[] = [];

  for (const override of newOverrides) {
    const profile = synthesizeMentorProfile(override);
    const targetIdx =
      override.segmentId && override.segmentId !== UNASSIGNED_SEGMENT_ID
        ? segmentIndexById.get(override.segmentId)
        : undefined;

    if (targetIdx !== undefined) {
      resolved[targetIdx] = {
        ...resolved[targetIdx],
        mentors: [...resolved[targetIdx].mentors, profile],
      };
    } else {
      unassigned.push(profile);
    }
  }

  if (unassigned.length > 0) {
    resolved.push({
      id: UNASSIGNED_SEGMENT_ID,
      num: "—",
      title: "Unassigned",
      blurb: "New applications awaiting segment assignment. Assign a real segment from the edit modal once reviewed.",
      mentors: unassigned,
    });
  }

  return resolved;
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

  merged.chapterCoverage = resolveChapterCoverage(defaults, cms.chapterCoverage);
  merged.caseStudySample = resolveCaseStudySample(defaults, cms.caseStudySample);
  merged.whatsInside = resolveWhatsInside(defaults, cms.whatsInside);
  merged.groundLevelView = resolveGroundLevelView(defaults, cms.groundLevelView);

  merged.pricing = resolvePricing(defaults, cms.pricing);
  merged.testimonials = resolveTestimonials(defaults, cms.testimonials);
  merged.mentorConnect = resolveMentorConnect(defaults, cms.mentorConnect);
  merged.career = resolveCareerContent(defaults, cms.career);

  if (cms.stats?.length) {
    merged.stats = mergeByKey(defaults.stats, cms.stats, "label");
  }

  merged.sales = {
    ...resolveSalesContent(defaults, cms.sales),
    whoCards: cms.sales?.whoCards?.length
      ? mergeByKey(defaults.sales.whoCards, cms.sales.whoCards, "title")
      : defaults.sales.whoCards,
  };

  return merged;
}
