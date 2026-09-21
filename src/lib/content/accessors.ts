import type { PlaybookSection } from "@/data/playbook";
import type { CaseStudyCard } from "@/data/case-studies";
import type { DeskQA } from "@/data/desk-channel";
import { formatDeskChannelCopy } from "@/data/desk-channel-content";
import { normalizeDeskChannelPageCopy } from "@/lib/content/desk-channel-schema";
import { hydrateDeskQaDates, getDeskLibraryFreshness } from "@/lib/content/desk-channel-freshness";
import { BRAND_NAME } from "@/lib/brand";
import type { GlossaryTerm } from "@/data/glossary";
import {
  DEFAULT_GLOSSARY_PAGE_CONTENT,
  mergeGlossaryPageContent,
  type GlossaryPageContent,
} from "@/data/glossary-content";
import type { MentorOverridesPayload } from "@/data/mentors";
import { getPublishedPayload, tryReadPublishedPayload, getContentModulePayload } from "./repository";
import {
  caseStudyDisplayNumber,
  resolveCaseStudiesPayload,
  type CaseStudiesPayload,
} from "@/lib/content/case-studies-payload";
import { DESK_CATEGORIES, DESK_QA, mergeDeskCategories } from "@/data/desk-channel";
import { GLOSSARY_TERMS } from "@/data/glossary";
import {
  INTERVIEW_QUESTIONS,
  INTERVIEW_CATEGORIES,
  INTERVIEW_TABS,
  mergeInterviewQuestionsHero,
} from "@/data/interview-questions";
import {
  getActiveKnowledgeTestQuestions,
  getLiveKnowledgeTestSets,
  getUpcomingKnowledgeTestSets,
  memberKnowledgeTestHeroVars,
  mergeKnowledgeTestHero,
} from "@/lib/content/knowledge-test-payload";
import { RESUME_TEMPLATES } from "@/data/resume-templates";
import { JOB_OPENINGS, JOB_REGIONS, JOB_LEVELS, JOB_SEGMENTS } from "@/data/job-openings";
import { withHirerFallback } from "@/lib/job-openings-hirer";
import {
  DEFAULT_JOB_OPENINGS_HERO,
  mergeJobOpeningsHero,
} from "@/data/job-openings-content";
import { DEFAULT_LANDING_CONTENT, type LandingContent } from "@/data/landing-content";
import { DEFAULT_MEMBER_DASHBOARD_CONTENT, type MemberDashboardContent } from "@/data/member-dashboard";
import { normalizeMemberDashboardPayload } from "@/lib/content/member-dashboard-schema";
import {
  DEFAULT_SALES_MARKET_NUDGES_CONTENT,
  type SalesMarketNudgesContent,
} from "@/data/sales-market-nudges";
import {
  filterActiveSalesMarketNudgesContent,
  normalizeSalesMarketNudgesPayload,
} from "@/lib/content/sales-market-nudges-schema";
import {
  DEFAULT_ACCOUNT_INTELLIGENCE_CONTENT,
  type AccountIntelligenceContent,
} from "@/data/account-intelligence-content";
import { normalizeAccountIntelligencePayload } from "@/lib/content/account-intelligence-schema";
import {
  DEFAULT_MENTOR_CONNECT_CONTENT,
  type MentorConnectHero,
  type MentorConnectHowItWorks,
} from "@/data/mentor-connect-content";
import type { MentorApplyPageCopy } from "@/data/mentor-apply-content";
import { normalizeMentorConnectPayload } from "@/lib/content/mentor-connect-schema";
import { DEFAULT_FAQ_CONTENT, type FaqContent } from "@/data/faq";
import { normalizeBrandReferences } from "@/lib/brand";
import {
  STARTER_INFOGRAPHICS,
  type StarterInfographic,
  mergeStarterEmailDigest,
  mergeStarterPackHero,
  mergeStarterUpgradeCta,
  type StarterEmailDigest,
  type StarterPackHero,
  type StarterUpgradeCta,
} from "@/data/starter-pack";
import { DEFAULT_SITE_FOOTER, type SiteFooterContent } from "@/data/footer-content";
import { mergeSiteFooterContent } from "@/lib/content/footer-schema";
import type { ContentAttachment } from "./attachments";
import { mergeLandingContent, resolveMentorSegments } from "./merge";
import { hydrateLandingCaseStudyCards } from "./landing-case-study-preview";
import {
  defaultCareerEdgeNote,
  resolveSalesEdgeNote,
  resolveWeeklyEdgeNote,
  type LandingEdgeNotes,
  type WeeklyEdgeNote,
} from "./edge-notes";
import {
  MENTOR_SEGMENTS,
  UNASSIGNED_SEGMENT_ID,
  toPublicMentorProfile,
  type PublishedMentorSegment,
} from "@/data/mentors";
import type { PlaybookHubHeroCopy } from "@/data/playbook-hub-hero";
import { resolvePlaybookPayload } from "./playbook-payload";


export async function getLandingContent(): Promise<LandingContent> {
  const cms = await tryReadPublishedPayload<Partial<LandingContent>>("landing");
  const merged =
    cms === null ? DEFAULT_LANDING_CONTENT : mergeLandingContent(DEFAULT_LANDING_CONTENT, cms);
  const studies = await getCaseStudiesList();
  return {
    ...merged,
    caseStudySample: {
      ...merged.caseStudySample,
      cards: hydrateLandingCaseStudyCards(merged.caseStudySample, studies),
    },
  };
}

type LandingPayload = Partial<LandingContent> & LandingEdgeNotes;

export async function getLandingEdgeNotes(): Promise<{
  career: WeeklyEdgeNote;
  sales: WeeklyEdgeNote;
}> {
  const cms = await tryReadPublishedPayload<LandingPayload>("landing");
  return {
    career: resolveWeeklyEdgeNote(cms?.careerEdgeNote, defaultCareerEdgeNote()),
    sales: resolveSalesEdgeNote(cms?.salesEdgeNote),
  };
}

/** Mentor Connect hero — CMS module `mentor-connect`, with landing fallback for eyebrow/title. */
export async function getMentorConnectHero(): Promise<MentorConnectHero> {
  const cms = await tryReadPublishedPayload<Partial<{ hero?: Partial<MentorConnectHero> }>>(
    "mentor-connect"
  );
  const landing = await getLandingContent();
  const hero = {
    ...DEFAULT_MENTOR_CONNECT_CONTENT.hero,
    ...cms?.hero,
  };
  return {
    eyebrow: hero.eyebrow || landing.mentorConnect.eyebrow,
    title: hero.title || landing.mentorConnect.title,
    subtitle: hero.subtitle || DEFAULT_MENTOR_CONNECT_CONTENT.hero.subtitle,
  };
}

/** Mentor Connect "How the session works" — CMS module `mentor-connect`. */
export async function getMentorConnectHowItWorks(): Promise<MentorConnectHowItWorks> {
  const cms = await tryReadPublishedPayload<Partial<{ howItWorks?: Partial<MentorConnectHowItWorks> }>>(
    "mentor-connect"
  );
  return normalizeMentorConnectPayload(cms ?? {}).howItWorks;
}

/** Public mentor application form copy — CMS module `mentor-connect`.application. */
export async function getMentorApplyPageCopy(): Promise<MentorApplyPageCopy> {
  const cms = await tryReadPublishedPayload("mentor-connect");
  return normalizeMentorConnectPayload(cms ?? {}).application;
}

export async function getMemberDashboardContent(): Promise<MemberDashboardContent> {
  const cms = await tryReadPublishedPayload<Partial<MemberDashboardContent>>("member-dashboard");
  const content =
    cms === null
      ? DEFAULT_MEMBER_DASHBOARD_CONTENT
      : normalizeMemberDashboardPayload(cms);

  if (!content.salesDeliverables.industryGuideForSales?.assetId) {
    const guides = await getNavigationGuides();
    if (guides.sales) {
      return {
        ...content,
        salesDeliverables: {
          ...content.salesDeliverables,
          industryGuideForSales: guides.sales,
        },
      };
    }
  }
  return content;
}

export async function getSalesMarketNudgesContent(): Promise<SalesMarketNudgesContent> {
  const cms = await tryReadPublishedPayload<Partial<SalesMarketNudgesContent>>("sales-market-nudges");
  if (cms === null) {
    return filterActiveSalesMarketNudgesContent(DEFAULT_SALES_MARKET_NUDGES_CONTENT);
  }
  return filterActiveSalesMarketNudgesContent(normalizeSalesMarketNudgesPayload(cms));
}

export async function getAccountIntelligenceContent(): Promise<AccountIntelligenceContent> {
  const cms = await tryReadPublishedPayload<Partial<AccountIntelligenceContent>>("account-intelligence");
  if (cms === null) {
    return DEFAULT_ACCOUNT_INTELLIGENCE_CONTENT;
  }
  return normalizeAccountIntelligencePayload(cms);
}

export async function getFaqContent(): Promise<FaqContent> {
  const data = await getPublishedPayload<Partial<FaqContent>>("faq");
  const items = data?.items?.length ? data.items : DEFAULT_FAQ_CONTENT.items;
  const footer = data?.footerCta ?? DEFAULT_FAQ_CONTENT.footerCta;
  return {
    hero: {
      ...DEFAULT_FAQ_CONTENT.hero,
      ...data?.hero,
      eyebrow: normalizeBrandReferences(data?.hero?.eyebrow ?? DEFAULT_FAQ_CONTENT.hero.eyebrow),
      title: normalizeBrandReferences(data?.hero?.title ?? DEFAULT_FAQ_CONTENT.hero.title),
      subtitle: normalizeBrandReferences(data?.hero?.subtitle ?? DEFAULT_FAQ_CONTENT.hero.subtitle),
    },
    items: items.map((item) => ({
      q: normalizeBrandReferences(item.q),
      a: normalizeBrandReferences(item.a),
    })),
    footerCta: {
      heading: normalizeBrandReferences(footer.heading ?? DEFAULT_FAQ_CONTENT.footerCta.heading),
      subtext: normalizeBrandReferences(footer.subtext ?? DEFAULT_FAQ_CONTENT.footerCta.subtext),
      email: footer.email?.trim() || DEFAULT_FAQ_CONTENT.footerCta.email,
      buttonLabel: normalizeBrandReferences(footer.buttonLabel ?? DEFAULT_FAQ_CONTENT.footerCta.buttonLabel),
    },
  };
}

type PlaybookCmsPayload = {
  chapters?: {
    id: string;
    sections?: { id: string; assets?: ContentAttachment[] }[];
  }[];
};

export async function getPlaybookChapterAssets(chapterId: string): Promise<Record<string, ContentAttachment[]>> {
  const data = await getPublishedPayload<PlaybookCmsPayload>("playbook");
  const chapter = data.chapters?.find((c) => c.id === chapterId);
  const map: Record<string, ContentAttachment[]> = {};

  const { PLAYBOOK_ASSETS, getSectionAssets } = await import("@/data/playbook-assets");
  const { ensurePlaybookSectionAssets } = await import("@/lib/content/playbook-section-assets");
  const sections = await getPlaybookSections(chapterId);
  const defaultSectionIds = Object.keys(PLAYBOOK_ASSETS[chapterId] ?? {});
  const cmsSectionIds = chapter?.sections?.map((s) => s.id) ?? [];
  const allSectionIds = [...new Set([...defaultSectionIds, ...cmsSectionIds])];

  for (const sectionId of allSectionIds) {
    const cmsSection = chapter?.sections?.find((s) => s.id === sectionId);
    const sectionTitle = sections.find((s) => s.id === sectionId)?.title ?? sectionId;
    const raw = cmsSection?.assets?.length
      ? cmsSection.assets
      : getSectionAssets(chapterId, sectionId).map((a) => ({
          ...a,
          delivery: "download" as const,
        }));
    map[sectionId] = ensurePlaybookSectionAssets(chapterId, sectionId, sectionTitle, raw);
  }

  return map;
}

function mergeStarterInfographics(
  defaults: StarterInfographic[],
  cms?: StarterInfographic[]
): StarterInfographic[] {
  if (!cms?.length) return defaults;
  const byId = new Map(cms.map((item) => [item.id, item]));
  return defaults.map((def) => {
    const edited = byId.get(def.id);
    if (!edited) return def;
    return {
      ...def,
      ...edited,
      fileKey: edited.fileKey || def.fileKey,
      thumbKey: edited.thumbKey || def.thumbKey,
    };
  });
}

function normalizeStarterDigestCms(data: {
  emailDigest?: Partial<StarterEmailDigest>;
  marketNote?: Partial<StarterEmailDigest> & { subscribed?: string };
}): Partial<StarterEmailDigest> | undefined {
  if (data.emailDigest) return data.emailDigest;
  if (!data.marketNote) return undefined;
  const { subscribed, ...rest } = data.marketNote;
  return {
    ...rest,
    confirmedText: data.marketNote.confirmedText ?? subscribed,
  };
}

function mergeIndustryMap<T extends { zone: string }>(defaults: T[], cms?: T[]): T[] {
  if (!cms?.length) return defaults;
  const byZone = new Map(defaults.map((zone) => [zone.zone, zone]));
  for (const zone of cms) {
    const base = byZone.get(zone.zone);
    byZone.set(zone.zone, base ? { ...base, ...zone } : zone);
  }
  const defaultOrder = defaults.map((zone) => zone.zone);
  const extraZones = cms.map((zone) => zone.zone).filter((zone) => !defaultOrder.includes(zone));
  return [...defaultOrder, ...extraZones].map((zone) => byZone.get(zone)!);
}

export async function getStarterPackContent() {
  const data = await getPublishedPayload<{
    hero?: Partial<StarterPackHero>;
    infographics?: StarterInfographic[];
    emailDigest?: Partial<StarterEmailDigest>;
    marketNote?: Partial<StarterEmailDigest> & { subscribed?: string };
    chapterPreview?: typeof import("@/data/starter-pack").STARTER_CHAPTER_PREVIEW;
    upgradeCta?: Partial<StarterUpgradeCta>;
  }>("starter-pack");

  const { STARTER_CHAPTER_PREVIEW } = await import("@/data/starter-pack");

  return {
    hero: mergeStarterPackHero(data.hero),
    infographics: mergeStarterInfographics(STARTER_INFOGRAPHICS, data.infographics),
    emailDigest: mergeStarterEmailDigest(normalizeStarterDigestCms(data)),
    chapterPreview: data.chapterPreview ?? STARTER_CHAPTER_PREVIEW,
    upgradeCta: mergeStarterUpgradeCta(data.upgradeCta),
  };
}

export interface LibraryFilePublic {
  id: string;
  label: string;
  fileName: string;
  assetId: string;
  mimeType: string;
  delivery: "view-only" | "download";
  track: "career" | "sales" | "both";
  /** "free" = any logged-in member; "elite" = Elite tier required (default for legacy rows) */
  accessTier: "free" | "elite";
}

export interface FooterGuidePublic {
  label: string;
  fileName: string;
  assetId: string;
  mimeType: string;
}

export interface NavigationGuideAttachment {
  label: string;
  fileName: string;
  assetId: string;
  mimeType: string;
}

export async function getSiteFooterContent(): Promise<SiteFooterContent> {
  const data = await getPublishedPayload<Partial<SiteFooterContent>>("site-footer");
  return mergeSiteFooterContent(data);
}

export async function getFooterGuides(): Promise<{
  career: FooterGuidePublic | null;
  sales: FooterGuidePublic | null;
}> {
  const data = await getPublishedPayload<{
    careerGuide?: FooterGuidePublic | null;
    salesGuide?: FooterGuidePublic | null;
  }>("footer-guides");

  function resolve(guide?: FooterGuidePublic | null): FooterGuidePublic | null {
    if (!guide?.assetId || !guide.label) return null;
    return guide;
  }

  return {
    career: resolve(data.careerGuide),
    sales: resolve(data.salesGuide),
  };
}

export async function getNavigationGuides(): Promise<{
  career: NavigationGuideAttachment | null;
  sales: NavigationGuideAttachment | null;
}> {
  const data = await getPublishedPayload<{
    careerNavigationGuide?: NavigationGuideAttachment | null;
    salesNavigationGuide?: NavigationGuideAttachment | null;
    navigationGuides?: {
      id: string;
      label: string;
      fileName: string;
      assetId: string;
      track: "career" | "sales" | "both";
    }[];
  }>("career-roadmap");

  function resolve(guide?: NavigationGuideAttachment | null): NavigationGuideAttachment | null {
    if (!guide?.assetId || !guide.label) return null;
    return guide;
  }

  // Prefer fixed fields; fall back to legacy navigationGuides array
  let career = resolve(data.careerNavigationGuide);
  let sales = resolve(data.salesNavigationGuide);

  if (!career || !sales) {
    for (const g of data.navigationGuides ?? []) {
      if (!g.assetId || !g.label) continue;
      const attachment: NavigationGuideAttachment = {
        label: g.label,
        fileName: g.fileName,
        assetId: g.assetId,
        mimeType: "application/pdf",
      };
      if (!career && (g.track === "career" || g.track === "both")) career = attachment;
      if (!sales && (g.track === "sales" || g.track === "both")) sales = attachment;
    }
  }

  return { career, sales };
}

export async function getLibraryContent(): Promise<{
  files: LibraryFilePublic[];
  hero: import("./library-schema").LibraryHeroCopy;
  freeSection: import("./library-schema").LibrarySectionCopy;
  eliteSection: import("./library-schema").LibrarySectionCopy;
}> {
  const { normalizeLibraryPayload } = await import("./library-schema");
  const data = await getPublishedPayload<{ files?: (LibraryFilePublic & { accessTier?: "free" | "elite" })[] }>("library");
  const { files, hero, freeSection, eliteSection } = normalizeLibraryPayload(data);
  return {
    files: files
      .filter((f) => f.assetId && f.label)
      .map((f) => ({
        ...f,
        accessTier: f.accessTier ?? "elite",
      })),
    hero,
    freeSection,
    eliteSection,
  };
}

/**
 * Admin-only resolved mentor profile data — static defaults layered with any saved
 * "mentors" CMS overrides (headline/bio/years/tags/name/email/company/track/status), plus
 * any brand-new self-submitted applications (via /mentor-apply) synthesized into their
 * assigned segment (or a synthetic "Unassigned" segment). Intended for the admin
 * Mentors tab. Do NOT use this on any public-facing page: `name`/`email`/`company`
 * are for internal reference only, and `status: "pending"` rows are unreviewed
 * applications — neither must ever be exposed to end users.
 */
export async function getResolvedMentorSegments() {
  const data = await getContentModulePayload<Partial<MentorOverridesPayload>>("mentors");
  return resolveMentorSegments(MENTOR_SEGMENTS, data?.overrides ?? []);
}

/**
 * Mentor Connect page — CMS-resolved profiles that are approved (`status: "active"`)
 * only. Admin-only fields (name/email/company) and pending applications are excluded.
 * Respects the mentors module published flag — overrides are ignored when draft.
 */
export async function getPublishedMentorSegments(): Promise<PublishedMentorSegment[]> {
  const [mentorsCms, mentorConnectCms] = await Promise.all([
    tryReadPublishedPayload<Partial<MentorOverridesPayload>>("mentors"),
    tryReadPublishedPayload<Partial<{ segments?: { id: string; title: string; blurb: string }[] }>>(
      "mentor-connect"
    ),
  ]);
  const segmentCopy = normalizeMentorConnectPayload(mentorConnectCms ?? {}).segments;
  const copyById = new Map(segmentCopy.map((s) => [s.id, s]));
  const resolved = resolveMentorSegments(MENTOR_SEGMENTS, mentorsCms?.overrides ?? []);
  return resolved
    .filter((seg) => seg.id !== UNASSIGNED_SEGMENT_ID)
    .map((seg) => {
      const copy = copyById.get(seg.id);
      return {
        id: seg.id,
        num: seg.num,
        title: copy?.title ?? seg.title,
        blurb: copy?.blurb ?? seg.blurb,
        mentors: seg.mentors
          .filter((m) => (m.status ?? "active") === "active")
          .map(toPublicMentorProfile),
      };
    })
    .filter((seg) => seg.mentors.length > 0);
}

async function getResolvedPlaybook() {
  const data = await getPublishedPayload<unknown>("playbook");
  return resolvePlaybookPayload(data);
}

export async function getPlaybookChapters() {
  return (await getResolvedPlaybook()).chapters;
}

export async function getPlaybookHubHero(): Promise<PlaybookHubHeroCopy> {
  return (await getResolvedPlaybook()).hubHero;
}

export async function getPlaybookSections(chapterId: string): Promise<PlaybookSection[]> {
  const sections = (await getResolvedPlaybook()).sections;
  return sections[chapterId] ?? [];
}

export async function getCaseStudiesPageData() {
  const data = await getPublishedPayload<CaseStudiesPayload | CaseStudyCard[]>("case-studies");
  return resolveCaseStudiesPayload(data);
}

export async function getCaseStudiesList() {
  return (await getCaseStudiesPageData()).studies;
}

export async function getCaseStudyBySlug(slug: string) {
  const { studies, details } = await getCaseStudiesPageData();
  const index = studies.findIndex((c) => c.slug === slug);
  if (index < 0) return null;
  const card = studies[index]!;
  return {
    card,
    sections: details[slug] || null,
    displayNumber: caseStudyDisplayNumber(card, index),
  };
}

export async function getDeskChannelData() {
  const data = await getPublishedPayload<{
    categories: typeof DESK_CATEGORIES;
    questions: DeskQA[];
    pageCopy?: import("@/data/desk-channel-content").DeskChannelPageCopy;
    lastRefreshed?: string;
  }>("desk-channel");

  const questions = hydrateDeskQaDates(data.questions ?? DESK_QA);
  const categories = mergeDeskCategories(data.categories, questions);
  const deskSegmentCount = categories.filter((c) => c.id !== "all").length;
  const pageCopy = formatDeskChannelCopy(normalizeDeskChannelPageCopy(data.pageCopy), {
    deskQaCount: questions.length,
    deskSegmentCount,
    brandName: BRAND_NAME,
  });

  const lastRefreshed = typeof data.lastRefreshed === "string" ? data.lastRefreshed : undefined;
  const freshness = getDeskLibraryFreshness(questions, lastRefreshed);

  return {
    categories,
    questions,
    pageCopy,
    lastRefreshed,
    freshness,
  };
}

function isCompleteGlossary(terms: GlossaryTerm[] | undefined): terms is GlossaryTerm[] {
  if (!terms?.length) return false;
  if (terms.length !== GLOSSARY_TERMS.length) return false;
  return terms.every((t) => Boolean(t.term?.trim() && t.definition?.trim() && t.context?.trim() && t.category));
}

/** Returns glossary terms — source of truth: desk-glossary_updated_24.06.html via GLOSSARY_TERMS */
export async function getGlossaryTerms() {
  try {
    const data = await getPublishedPayload<{ terms: GlossaryTerm[] }>("glossary");
    if (isCompleteGlossary(data.terms)) return data.terms;
  } catch {
    // CMS unavailable — use static extract
  }
  return GLOSSARY_TERMS;
}

export async function getGlossaryPageContent(): Promise<GlossaryPageContent> {
  try {
    const data = await getPublishedPayload<Partial<GlossaryPageContent>>("glossary");
    return mergeGlossaryPageContent(data);
  } catch {
    return DEFAULT_GLOSSARY_PAGE_CONTENT;
  }
}

export async function getInterviewQuestionsData() {
  const data = await getPublishedPayload<{
    questions: typeof INTERVIEW_QUESTIONS;
    categories: typeof INTERVIEW_CATEGORIES;
    tabs?: typeof INTERVIEW_TABS;
    hero?: Partial<import("@/data/interview-questions").InterviewQuestionsHeroCopy>;
    lastRefreshed?: string;
  }>("interview-questions");
  return {
    questions: data.questions ?? INTERVIEW_QUESTIONS,
    categories: data.categories ?? INTERVIEW_CATEGORIES,
    tabs: data.tabs ?? INTERVIEW_TABS,
    hero: mergeInterviewQuestionsHero(data.hero),
    lastRefreshed: typeof data.lastRefreshed === "string" ? data.lastRefreshed : undefined,
  };
}

export async function getKnowledgeTestQuestions() {
  const data = await getPublishedPayload<import("@/lib/content/knowledge-test-payload").KnowledgeTestPayload>(
    "knowledge-test"
  );
  return getActiveKnowledgeTestQuestions(data);
}

export async function getKnowledgeTestPageData() {
  const data = await getPublishedPayload<import("@/lib/content/knowledge-test-payload").KnowledgeTestPayload>(
    "knowledge-test"
  );
  const liveSets = getLiveKnowledgeTestSets(data).map((set) => ({
    id: set.id,
    label: set.label,
    questions: set.questions,
  }));
  const upcomingSets = getUpcomingKnowledgeTestSets(data);
  const heroVars = memberKnowledgeTestHeroVars(liveSets);
  return {
    questions: liveSets[0]?.questions ?? [],
    activeSetLabel: heroVars.activeSetLabel,
    liveSets,
    upcomingSets,
    hero: mergeKnowledgeTestHero(data?.hero),
  };
}

export async function getCareerRoles() {
  const data = await getPublishedPayload<Record<string, unknown>>("career-roadmap");
  const { resolveCareerRoadmapPayload } = await import("./career-roadmap-payload");
  return resolveCareerRoadmapPayload(data);
}

export async function getResumeTemplatesData() {
  const data = await getPublishedPayload<import("./resume-payload").ResumeAdminPayload>("resume-templates");
  const { INDUSTRY_MAP, mergeResumeVettingSection } = await import("@/data/resume-templates");
  const { adminTemplatesToPublic, resolveEditorResumePayload, resolvePublicResumePageCopy } =
    await import("./resume-payload");
  const resolved = resolveEditorResumePayload(data);
  const pageCopy = resolvePublicResumePageCopy(resolved);
  return {
    templates: adminTemplatesToPublic(resolved.templates),
    quiz: resolved.quiz,
    quizSteps: resolved.quizSteps,
    personas: resolved.personas,
    industryMap: mergeIndustryMap(INDUSTRY_MAP, resolved.industryMap),
    vettingSection: mergeResumeVettingSection(resolved.vettingSection),
    ...pageCopy,
  };
}

export async function getJobOpeningsData() {
  const raw = await getPublishedPayload<unknown>("job-openings");
  let jobs = JOB_OPENINGS;
  let regions = JOB_REGIONS;
  let levels = JOB_LEVELS;
  let segments = JOB_SEGMENTS;

  if (Array.isArray(raw)) {
    jobs = raw.length ? (raw as typeof JOB_OPENINGS) : JOB_OPENINGS;
  } else if (raw && typeof raw === "object") {
    const data = raw as {
      hero?: Partial<typeof DEFAULT_JOB_OPENINGS_HERO>;
      jobs?: typeof JOB_OPENINGS;
      regions?: typeof JOB_REGIONS;
      levels?: typeof JOB_LEVELS;
      segments?: typeof JOB_SEGMENTS;
    };
    jobs = data.jobs?.length ? data.jobs : JOB_OPENINGS;
    regions = data.regions ?? JOB_REGIONS;
    levels = data.levels ?? JOB_LEVELS;
    segments = data.segments ?? JOB_SEGMENTS;
  }

  const hero = mergeJobOpeningsHero(
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as { hero?: Partial<typeof DEFAULT_JOB_OPENINGS_HERO> }).hero
      : undefined
  );

  const defaultById = new Map(JOB_OPENINGS.map((job) => [job.id, job]));
  jobs = jobs.map((job) => withHirerFallback(job, defaultById.get(job.id)));

  return { jobs, regions, levels, segments, hero };
}

export async function getContentTierForSlug(slug: string) {
  const { getModuleMeta } = await import("./modules");
  const meta = getModuleMeta(slug);
  try {
    const { prisma } = await import("@/lib/prisma");
    const row = await prisma.contentModule.findUnique({
      where: { slug },
      select: { requiredTier: true, published: true },
    });
    if (row?.published) return row.requiredTier;
  } catch {
    // fall through to module default
  }
  return meta?.requiredTier ?? "STARTER";
}

export async function getContentTiersMap() {
  const { CONTENT_MODULE_META } = await import("./modules");
  const entries = await Promise.all(
    CONTENT_MODULE_META.map(async (meta) => [meta.slug, await getContentTierForSlug(meta.slug)] as const)
  );
  return Object.fromEntries(entries) as Record<string, string>;
}

export async function getResumeTemplateAssetUrls() {
  const { getContentAssetUrlMap } = await import("./repository");
  const map = await getContentAssetUrlMap("resume-templates");
  const data = await getResumeTemplatesData();
  for (const t of data.templates) {
    const assetId = (t as { assetId?: string }).assetId;
    if (assetId) map[t.templateFile] = `/api/content/assets/${assetId}`;
  }
  return map;
}

export async function getPlaybookAssetUrls() {
  const { getContentAssetUrlMap } = await import("./repository");
  return getContentAssetUrlMap("playbook");
}

export async function getStarterPackAssetUrls() {
  const { getContentAssetUrlMap } = await import("./repository");
  const map = await getContentAssetUrlMap("starter-pack");
  const content = await getStarterPackContent();
  for (const info of content.infographics) {
    if (info.assetId) map[info.fileKey] = `/api/content/assets/${info.assetId}`;
    if (info.thumbAssetId && info.thumbKey) {
      map[info.thumbKey] = `/api/content/assets/${info.thumbAssetId}`;
    }
  }
  return map;
}
