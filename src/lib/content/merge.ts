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

/**
 * Fully CMS-owned list (stat rows, etc.). Once the admin saves rows, that array is the
 * source of truth — renaming a label, reordering, adding, or removing rows all stick.
 * Keyed merges must not be used here: they drop any row whose key the admin edited.
 */
export function resolveEditableList<T>(defaults: T[], cms?: T[]): T[] {
  return cms && cms.length > 0 ? cms : defaults;
}

const LEGACY_SALES_TRACK_SEED: { title: string; desc: string }[] = [
  { title: "Sales Nudges", desc: "Market Talking Points" },
  { title: "Prep Library", desc: "Bookmark the talking points prior meetings" },
  { title: "Account Intelligence Track", desc: "Link market talking points to specific accounts" },
  { title: "Mentor Connect", desc: "Ask practitioners your sales-prep questions, anonymously." },
  { title: "Desk Channel", desc: "Practitioner Q&As that show how desks frame commercial problems." },
  { title: "Market Role Movements", desc: "Track which firms are growing and hiring — your next target accounts." },
];

/** First accordion seed (title was Sales Nudges, caption was the tool name). */
export function resolveSalesTrackToolsFeatures(
  defaults: LandingContent["sales"]["trackTools"]["features"],
  cms?: LandingContent["sales"]["trackTools"]["features"]
): LandingContent["sales"]["trackTools"]["features"] {
  if (!cms?.length) return defaults;
  const isUneditedSeed =
    cms.length === LEGACY_SALES_TRACK_SEED.length &&
    cms.every(
      (row, i) =>
        row.title === LEGACY_SALES_TRACK_SEED[i]?.title &&
        row.desc === LEGACY_SALES_TRACK_SEED[i]?.desc
    );
  return isUneditedSeed ? defaults : cms;
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

/** Split legacy single-line headings ("What We Cover. Entire Market Spectrum.") into title + accent. */
export function normalizeChapterCoverageHeadline(input: {
  title?: string;
  titleAccent?: string;
  defaultTitle: string;
  defaultTitleAccent: string;
}): { title: string; titleAccent: string } {
  if (input.titleAccent?.trim()) {
    return {
      title: input.title?.trim() || input.defaultTitle,
      titleAccent: input.titleAccent.trim(),
    };
  }

  const title = input.title?.trim() || input.defaultTitle;
  const split = title.match(/^(.+?\.\s+)(.+)$/);
  if (split) {
    const accent = split[2].trim();
    return {
      title: split[1].trim(),
      titleAccent: accent.endsWith(".") ? accent : `${accent}.`,
    };
  }

  return { title, titleAccent: input.defaultTitleAccent };
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

/** Chapter coverage — CMS section copy wins; chapter rows are CMS-owned (add/remove/reorder). */
export function resolveChapterCoverage(
  defaults: LandingContent,
  cms?: Partial<LandingContent["chapterCoverage"]>
): LandingContent["chapterCoverage"] {
  const headline = normalizeChapterCoverageHeadline({
    title: cms?.title,
    titleAccent: cms?.titleAccent,
    defaultTitle: defaults.chapterCoverage.title,
    defaultTitleAccent: defaults.chapterCoverage.titleAccent,
  });
  return {
    eyebrow: cms?.eyebrow ?? defaults.chapterCoverage.eyebrow,
    title: headline.title,
    titleAccent: headline.titleAccent,
    description: cms?.description ?? defaults.chapterCoverage.description,
    footerNote: cmsString(cms?.footerNote, defaults.chapterCoverage.footerNote),
    chapters: resolveEditableList(defaults.chapterCoverage.chapters, cms?.chapters),
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
    // Keyed on `icon` (stable, not admin-editable) so editing a card title still saves.
    features: cms?.features?.length
      ? mergeByKey(defaults.whatsInside.features, cms.features, "icon")
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

/** Sales landing testimonials — fully CMS-editable (not code-locked). */
export function resolveSalesTestimonials(
  defaults: LandingContent,
  cms?: Partial<LandingContent["salesTestimonials"]>
): LandingContent["salesTestimonials"] {
  return {
    eyebrow: cms?.eyebrow ?? defaults.salesTestimonials.eyebrow,
    title: cms?.title ?? defaults.salesTestimonials.title,
    items: cms?.items?.length ? cms.items : defaults.salesTestimonials.items,
  };
}

/** Track picker captions on signup modals and related flows. */
export function resolveTrackSelection(
  defaults: LandingContent,
  cms?: Partial<LandingContent["trackSelection"]>
): LandingContent["trackSelection"] {
  return {
    career: {
      title: cms?.career?.title?.trim() || defaults.trackSelection.career.title,
      caption: cms?.career?.caption?.trim() || defaults.trackSelection.career.caption,
    },
    sales: {
      title: cms?.sales?.title?.trim() || defaults.trackSelection.sales.title,
      caption: cms?.sales?.caption?.trim() || defaults.trackSelection.sales.caption,
    },
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
    stats: resolveEditableList(defaults.sales.roi.stats, cmsRoi?.stats),
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
    heroStats: resolveEditableList(defaults.career.heroStats, cms?.heroStats),
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
    stats: resolveEditableList(defaults.sales.stats, cms?.stats),
    pricing: resolveSalesPricing(defaults, cms),
    comparison: {
      groups: resolveComparisonGroups(defaults.sales.comparison.groups, cms?.comparison?.groups),
    },
    roi: resolveSalesRoi(defaults, cms),
    whoSection: {
      label: cmsString(cms?.whoSection?.label, defaults.sales.whoSection.label),
      headline: cmsString(cms?.whoSection?.headline, defaults.sales.whoSection.headline),
    },
    learn: {
      eyebrow: cmsString(cms?.learn?.eyebrow, defaults.sales.learn.eyebrow),
      headline: cmsString(cms?.learn?.headline, defaults.sales.learn.headline),
      description: cmsString(cms?.learn?.description, defaults.sales.learn.description),
      items: resolveEditableList(defaults.sales.learn.items, cms?.learn?.items),
    },
    trackTools: {
      eyebrow: cmsString(cms?.trackTools?.eyebrow, defaults.sales.trackTools.eyebrow),
      headline: cmsString(cms?.trackTools?.headline, defaults.sales.trackTools.headline),
      description: cmsString(cms?.trackTools?.description, defaults.sales.trackTools.description),
      features: resolveSalesTrackToolsFeatures(
        defaults.sales.trackTools.features,
        cms?.trackTools?.features
      ),
    },
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
    linkedIn: override.linkedIn,
    location: override.location,
    role: override.role,
    commodityDesk: override.commodityDesk,
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
        linkedIn: override?.linkedIn ?? mentor.linkedIn,
        location: override?.location ?? mentor.location,
        role: override?.role ?? mentor.role,
        commodityDesk: override?.commodityDesk ?? mentor.commodityDesk,
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
  merged.salesTestimonials = resolveSalesTestimonials(defaults, cms.salesTestimonials);
  merged.trackSelection = resolveTrackSelection(defaults, cms.trackSelection);
  merged.mentorConnect = resolveMentorConnect(defaults, cms.mentorConnect);
  merged.career = resolveCareerContent(defaults, cms.career);

  merged.stats = resolveEditableList(defaults.stats, cms.stats);

  merged.sales = {
    ...resolveSalesContent(defaults, cms.sales),
    whoCards: cms.sales?.whoCards?.length
      ? mergeByKey(defaults.sales.whoCards, cms.sales.whoCards, "title")
      : defaults.sales.whoCards,
  };

  const legacyStrip = cms.membersStrip;
  merged.careerMembersStrip =
    cms.careerMembersStrip ?? legacyStrip ?? defaults.careerMembersStrip;
  merged.salesMembersStrip =
    cms.salesMembersStrip ?? legacyStrip ?? defaults.salesMembersStrip;

  return merged;
}
