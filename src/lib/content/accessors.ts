import type { PlaybookSection } from "@/data/playbook";
import type { CaseStudyCard, CaseStudySection } from "@/data/case-studies";
import type { DeskQA } from "@/data/desk-channel";
import type { GlossaryTerm } from "@/data/glossary";
import type { MentorOverridesPayload } from "@/data/mentors";
import { getPublishedPayload, tryReadPublishedPayload, getContentModulePayload } from "./repository";
import { CHAPTERS } from "@/data/playbook";
import { CASE_STUDIES, CASE_STUDY_DETAILS } from "@/data/case-studies";
import { DESK_CATEGORIES, DESK_QA } from "@/data/desk-channel";
import { GLOSSARY_TERMS } from "@/data/glossary";
import { INTERVIEW_QUESTIONS, INTERVIEW_CATEGORIES, INTERVIEW_TABS } from "@/data/interview-questions";
import { getActiveKnowledgeTestQuestions, getActiveKnowledgeTestSet } from "@/lib/content/knowledge-test-payload";
import { CAREER_ROLES } from "@/data/career-roadmap";
import { RESUME_TEMPLATES, PERSONA_QUIZ_QUESTIONS } from "@/data/resume-templates";
import { JOB_OPENINGS, JOB_REGIONS, JOB_LEVELS, JOB_SEGMENTS } from "@/data/job-openings";
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
import { normalizeMentorConnectPayload } from "@/lib/content/mentor-connect-schema";
import { DEFAULT_FAQ_CONTENT, type FaqContent } from "@/data/faq";
import { normalizeBrandReferences } from "@/lib/brand";
import {
  STARTER_INFOGRAPHICS,
  type StarterInfographic,
  mergeStarterEmailDigest,
  mergeStarterUpgradeCta,
  type StarterEmailDigest,
  type StarterUpgradeCta,
} from "@/data/starter-pack";
import { getSectionAssets } from "@/data/playbook-assets";
import type { ContentAttachment } from "./attachments";
import { mergeLandingContent, resolveMentorSegments } from "./merge";
import {
  defaultCareerEdgeNote,
  defaultSalesEdgeNote,
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
import playbookSections from "@/data/playbook-sections.json";

type PlaybookPayload = {
  chapters: typeof CHAPTERS;
  sections: typeof playbookSections;
};

type CaseStudiesPayload = {
  studies: CaseStudyCard[];
  details: Record<string, CaseStudySection[]>;
};

export async function getLandingContent(): Promise<LandingContent> {
  const cms = await tryReadPublishedPayload<Partial<LandingContent>>("landing");
  if (cms === null) {
    return DEFAULT_LANDING_CONTENT;
  }
  return mergeLandingContent(DEFAULT_LANDING_CONTENT, cms);
}

type LandingPayload = Partial<LandingContent> & LandingEdgeNotes;

export async function getLandingEdgeNotes(): Promise<{
  career: WeeklyEdgeNote;
  sales: WeeklyEdgeNote;
}> {
  const cms = await tryReadPublishedPayload<LandingPayload>("landing");
  return {
    career: resolveWeeklyEdgeNote(cms?.careerEdgeNote, defaultCareerEdgeNote()),
    sales: resolveWeeklyEdgeNote(cms?.salesEdgeNote, defaultSalesEdgeNote()),
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

export async function getMemberDashboardContent(): Promise<MemberDashboardContent> {
  const cms = await tryReadPublishedPayload<Partial<MemberDashboardContent>>("member-dashboard");
  if (cms === null) {
    return DEFAULT_MEMBER_DASHBOARD_CONTENT;
  }
  return normalizeMemberDashboardPayload(cms);
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

  const { PLAYBOOK_ASSETS } = await import("@/data/playbook-assets");
  const defaultSectionIds = Object.keys(PLAYBOOK_ASSETS[chapterId] ?? {});
  const cmsSectionIds = chapter?.sections?.map((s) => s.id) ?? [];
  const allSectionIds = [...new Set([...defaultSectionIds, ...cmsSectionIds])];

  for (const sectionId of allSectionIds) {
    const cmsSection = chapter?.sections?.find((s) => s.id === sectionId);
    if (cmsSection?.assets?.length) {
      map[sectionId] = cmsSection.assets;
      continue;
    }
    const defaults = getSectionAssets(chapterId, sectionId);
    if (defaults.length) {
      map[sectionId] = defaults.map((a) => ({ ...a, delivery: "download" as const }));
    }
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
    infographics?: StarterInfographic[];
    emailDigest?: Partial<StarterEmailDigest>;
    marketNote?: Partial<StarterEmailDigest> & { subscribed?: string };
    chapterPreview?: typeof import("@/data/starter-pack").STARTER_CHAPTER_PREVIEW;
    upgradeCta?: Partial<StarterUpgradeCta>;
  }>("starter-pack");

  const { STARTER_CHAPTER_PREVIEW } = await import("@/data/starter-pack");

  return {
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

export async function getLibraryContent(): Promise<{ files: LibraryFilePublic[] }> {
  const data = await getPublishedPayload<{ files?: (LibraryFilePublic & { accessTier?: "free" | "elite" })[] }>("library");
  return {
    files: (data.files ?? [])
      .filter((f) => f.assetId && f.label)
      .map((f) => ({
        ...f,
        accessTier: f.accessTier ?? "elite",
      })),
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
  const cms = await tryReadPublishedPayload<Partial<MentorOverridesPayload>>("mentors");
  const resolved = resolveMentorSegments(MENTOR_SEGMENTS, cms?.overrides ?? []);
  return resolved
    .filter((seg) => seg.id !== UNASSIGNED_SEGMENT_ID)
    .map((seg) => ({
      id: seg.id,
      num: seg.num,
      title: seg.title,
      blurb: seg.blurb,
      mentors: seg.mentors
        .filter((m) => (m.status ?? "active") === "active")
        .map(toPublicMentorProfile),
    }))
    .filter((seg) => seg.mentors.length > 0);
}

export async function getPlaybookChapters() {
  const data = await getPublishedPayload<PlaybookPayload>("playbook");
  return data.chapters ?? CHAPTERS;
}

export async function getPlaybookSections(chapterId: string): Promise<PlaybookSection[]> {
  const data = await getPublishedPayload<PlaybookPayload>("playbook");
  const sections = data.sections ?? playbookSections;
  const key = chapterId as keyof typeof sections;
  return (sections[key] as PlaybookSection[]) || [];
}

export async function getCaseStudiesList() {
  const data = await getPublishedPayload<CaseStudiesPayload>("case-studies");
  return data.studies ?? CASE_STUDIES;
}

export async function getCaseStudyBySlug(slug: string) {
  const data = await getPublishedPayload<CaseStudiesPayload>("case-studies");
  const studies = data.studies ?? CASE_STUDIES;
  const details = data.details ?? CASE_STUDY_DETAILS;
  const card = studies.find((c) => c.slug === slug);
  if (!card) return null;
  return { card, sections: details[slug] || null };
}

export async function getDeskChannelData() {
  const data = await getPublishedPayload<{
    categories: typeof DESK_CATEGORIES;
    questions: DeskQA[];
  }>("desk-channel");
  return {
    categories: data.categories ?? DESK_CATEGORIES,
    questions: data.questions ?? DESK_QA,
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

export async function getInterviewQuestionsData() {
  const data = await getPublishedPayload<{
    questions: typeof INTERVIEW_QUESTIONS;
    categories: typeof INTERVIEW_CATEGORIES;
    tabs?: typeof INTERVIEW_TABS;
  }>("interview-questions");
  return {
    questions: data.questions ?? INTERVIEW_QUESTIONS,
    categories: data.categories ?? INTERVIEW_CATEGORIES,
    tabs: data.tabs ?? INTERVIEW_TABS,
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
  const active = getActiveKnowledgeTestSet(data);
  return {
    questions: active.questions,
    activeSetLabel: active.label,
  };
}

export async function getCareerRoles() {
  const data = await getPublishedPayload<{
    roles: typeof CAREER_ROLES;
    functionMatrix?: typeof import("@/data/career-roadmap-extras").FUNCTION_MATRIX;
    timeline12Month?: typeof import("@/data/career-roadmap-extras").TIMELINE_12_MONTH;
    navigationGuide?: typeof import("@/data/career-roadmap-extras").NAVIGATION_GUIDE;
    compBenchmarks?: typeof import("@/data/career-roadmap-extras").COMP_BENCHMARKS;
  }>("career-roadmap");
  const {
    FUNCTION_MATRIX,
    TIMELINE_12_MONTH,
    NAVIGATION_GUIDE,
    COMP_BENCHMARKS,
  } = await import("@/data/career-roadmap-extras");
  return {
    roles: data.roles ?? CAREER_ROLES,
    functionMatrix: data.functionMatrix ?? FUNCTION_MATRIX,
    timeline12Month: data.timeline12Month ?? TIMELINE_12_MONTH,
    navigationGuide: data.navigationGuide ?? NAVIGATION_GUIDE,
    compBenchmarks: data.compBenchmarks ?? COMP_BENCHMARKS,
  };
}

export async function getResumeTemplatesData() {
  const data = await getPublishedPayload<{
    templates: typeof RESUME_TEMPLATES;
    quiz: typeof PERSONA_QUIZ_QUESTIONS;
    quizSteps?: typeof import("@/data/resume-templates").PERSONA_QUIZ_STEPS;
    industryMap?: typeof import("@/data/resume-templates").INDUSTRY_MAP;
    vettingSection?: Partial<import("@/data/resume-templates").ResumeVettingSection>;
  }>("resume-templates");
  const {
    PERSONA_QUIZ_STEPS,
    INDUSTRY_MAP,
    mergeResumeVettingSection,
  } = await import("@/data/resume-templates");
  return {
    templates: data.templates ?? RESUME_TEMPLATES,
    quiz: data.quiz ?? PERSONA_QUIZ_QUESTIONS,
    quizSteps: data.quizSteps ?? PERSONA_QUIZ_STEPS,
    industryMap: mergeIndustryMap(INDUSTRY_MAP, data.industryMap),
    vettingSection: mergeResumeVettingSection(data.vettingSection),
  };
}

export async function getJobOpeningsData() {
  const data = await getPublishedPayload<{
    jobs: typeof JOB_OPENINGS;
    regions: typeof JOB_REGIONS;
    levels: typeof JOB_LEVELS;
    segments: typeof JOB_SEGMENTS;
  }>("job-openings");
  return {
    jobs: data.jobs ?? JOB_OPENINGS,
    regions: data.regions ?? JOB_REGIONS,
    levels: data.levels ?? JOB_LEVELS,
    segments: data.segments ?? JOB_SEGMENTS,
  };
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
