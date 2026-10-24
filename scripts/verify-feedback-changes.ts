/**
 * Feedback + CMS fix verification — run with: npx tsx scripts/verify-feedback-changes.ts
 */
import { DEFAULT_LANDING_CONTENT } from "../src/data/landing-content";
import { splitFeatureLabel } from "../src/lib/feature-label";
import { mergeLandingContent } from "../src/lib/content/merge";
import { hydrateLandingCaseStudyCards } from "../src/lib/content/landing-case-study-preview";
import {
  prepareLandingContentForSave,
  formatLandingValidationErrors,
  landingContentSchema,
} from "../src/lib/content/landing-schema";
import { resolveMemberPersonaLabel } from "../src/lib/persona-display";
import {
  CLIENT_AD_TRACK_LABELS,
  clientAdInitials,
  selectClientAds,
} from "../src/lib/content/client-ads";
import { getDemoAccountDisplayPersona } from "../src/data/demo-accounts";
import { DEMO_ACCOUNTS } from "../src/data/demo-accounts";
import { canAccessInternalDemo, FRANCES_DEMO_LOGIN_EMAIL } from "../src/lib/demo-access";
import {
  CANONICAL_PUBLIC_HOST,
  canonicalPublicUrl,
  isNonCanonicalHost,
} from "../src/lib/canonical-host";
import {
  CANONICAL_ORIGIN,
  CANONICAL_PATHS,
  ORGANIZATION_ID,
  WEBSITE_ID,
  canonicalAlternates,
  siteJsonLd,
} from "../src/lib/seo";
import { BRAND_EMAIL_SUPPORT } from "../src/lib/brand";
import { CHAPTERS, PLAYBOOK_TOTAL_CHAPTERS } from "../src/data/playbook";
import playbookSections from "../src/data/playbook-sections.json";
import {
  PLAYBOOK_CHAPTER_FALLBACK_COLOR,
  playbookChapterHeroColor,
  resolvePlaybookPayload,
} from "../src/lib/content/playbook-payload";
import {
  DEFAULT_KNOWLEDGE_TEST_HERO,
  DEFAULT_KNOWLEDGE_TEST_SET_ID,
  createDefaultKnowledgeTestPayload,
  formatKnowledgeTestHeroCopy,
  formatKnowledgeTestReleaseCopy,
  formatKnowledgeTestWeekLabel,
  getLiveKnowledgeTestSets,
  getUpcomingKnowledgeTestSets,
  groupUpcomingKnowledgeTestSetsByWeek,
  mergeKnowledgeTestHero,
  normalizeKnowledgeTestPayload,
} from "../src/lib/content/knowledge-test-payload";
import {
  encodeKnowledgeTestGapAreas,
  latestKnowledgeTestResultsBySet,
} from "../src/lib/content/knowledge-test-results";
import { formatCmsHeroCopy, sanitizeMemberHref } from "../src/lib/content/cms-page-copy";
import {
  CASE_STUDY_HERO_STAT_BG,
  DEFAULT_CASE_STUDIES_HERO,
  caseStudyDisplayNumber,
  caseStudyPreviousPeer,
  isCaseStudyComingSoon,
  isCaseStudyPublished,
  formatCaseStudiesHeroCopy,
  formatCaseStudySourceLabel,
  mergeCaseStudiesHero,
  normalizeCaseStudyCard,
  normalizeCaseStudySection,
  parseCaseStudyInline,
  resolveCaseStudiesPayload,
  shouldShowCaseStudySidebar,
  visibleCallout,
  visibleCaseStudyBlocks,
  visibleCaseStudyStats,
  visibleCaseStudyTable,
  visibleLessons,
  visibleNumberedPoints,
  visibleSelfTest,
  visibleSources,
  visibleTimeline,
} from "../src/lib/content/case-studies-payload";
import {
  CASE_STUDY_CATEGORY_CAREER_HERO_STYLE,
  CASE_STUDY_CATEGORY_SALES_STYLE,
  caseStudyCategoryHeroStyle,
  caseStudyCategoryPreviewStyle,
} from "../src/lib/case-study-category-style";
import { JOB_OPENINGS } from "../src/data/job-openings";
import {
  DEFAULT_JOB_OPENINGS_DISCLAIMER,
  mergeJobOpeningsHero,
} from "../src/data/job-openings-content";
import { withHirerFallback } from "../src/lib/job-openings-hirer";
import { extractHirerReplyUrlFromLog, MAX_JOB_CHAT_EXCHANGES } from "../src/lib/job-chat";
import {
  buildDefaultResumeAdminPayload,
  mergeResumeAdminQuiz,
  resolveEditorResumePayload,
  resumeVettingArchetypeOptions,
} from "../src/lib/content/resume-payload";
import { PERSONA_QUIZ_STEPS } from "../src/data/resume-templates";
import {
  DEFAULT_CAREER_ROADMAP_BOTTOM_STRIP,
  mergeCareerRoadmapBottomStrip,
} from "../src/lib/content/career-roadmap-payload";
import {
  DEFAULT_INTERVIEW_QUESTIONS_HERO,
  INTERVIEW_QUESTIONS,
  formatInterviewHeroCopy,
  mergeInterviewQuestionsHero,
} from "../src/data/interview-questions";
import {
  countNewThisMonth,
  formatInterviewMemberDate,
  getBankLastRefreshedIso,
  getQuestionFreshnessBadge,
  parseFlexibleCalendarDate,
  parseIsoDateOnly,
  selectCurrentMarketQuestions,
  toIsoFromFlexibleDate,
} from "../src/lib/content/interview-questions-freshness";
import { getDeskLibraryFreshness, hydrateDeskQaDates } from "../src/lib/content/desk-channel-freshness";
import { DESK_QA, mergeDeskCategories, slugifyDeskCategoryId } from "../src/data/desk-channel";
import { KEY_POINTS_MAX } from "../src/data/prep-library";
import {
  isDashboardCardAccessible,
  isDashboardModuleVisible,
  memberMayAccessCareerPlaybook,
  partitionAccessibleFirst,
  dashboardAudienceFromPreview,
} from "../src/lib/dashboard-module-visibility";
import { LEGACY_SALES_TALKING_POINT_TITLES, SALES_MARKET_NOTE } from "../src/data/market-notes";
import { defaultSalesEdgeNote, resolveSalesTalkingPoints } from "../src/lib/content/edge-notes";
import { SALES_SECTION_MINT } from "../src/lib/sales-brand-colors";
import { mergeStarterEmailDigest, splitLegacyDigestTopicLine } from "../src/data/starter-pack";
import { formatCreditMonthLabel } from "../src/lib/mentor-credits";
import {
  computeMentorRewardProgress,
  mergeMentorRewardLadder,
  mergeMentorRewardRungs,
} from "../src/lib/mentor-reward-ladder";
import { normalizeMentorConnectPayload } from "../src/lib/content/mentor-connect-schema";
import { isPaymentsLive } from "../src/lib/payments";
import {
  DEFAULT_SALES_MARKET_NUDGES_CONTENT,
  formatBriefCardDate,
  formatBriefPeriodLabel,
  formatBriefUpdatedAt,
  groupBriefsByMonthYear,
} from "../src/data/sales-market-nudges";
import {
  normalizeSalesMarketNudgesPayload,
  parseSalesMarketNudgesPayload,
} from "../src/lib/content/sales-market-nudges-schema";
import { parseInlineBold } from "../src/lib/inline-bold";
import { parseMultilineText } from "../src/lib/multiline-text";
import {
  PDF_COPYRIGHT_FOOTER,
  formatMemberWatermarkLine,
  sanitizeWatermarkText,
  shouldStampPdfFooter,
  shouldWatermarkPaidPdf,
  stampPaidPdfWatermark,
} from "../src/lib/content/pdf-watermark";
import { PDFDocument } from "pdf-lib";
import {
  DEFAULT_DASHBOARD_RESOURCE_CARDS,
  DEFAULT_MEMBER_DASHBOARD_CONTENT,
  DEFAULT_SALES_DASHBOARD_RESOURCE_CARDS,
  DEFAULT_UNIFIED_DASHBOARD_RESOURCE_CARDS,
  resolveResourceCardTitle,
} from "../src/data/member-dashboard";
import { normalizeMemberDashboardPayload } from "../src/lib/content/member-dashboard-schema";
import { DEFAULT_SITE_FOOTER } from "../src/data/footer-content";
import { mergeSiteFooterContent } from "../src/lib/content/footer-schema";
import { DEFAULT_LIBRARY_HERO, normalizeLibraryPayload } from "../src/lib/content/library-schema";
import {
  isDashboardFileReady,
  resolveDashboardFileDownloadHref,
  type DashboardDeliverableKey,
} from "../src/lib/dashboard-file-deliverables";
import fs from "node:fs";
import path from "node:path";
import {
  CONSUMER_EMAIL_DOMAINS,
  UNIVERSITY_DOMAIN_SUFFIXES,
  classifyReferralAccount,
  isReferralEligible,
} from "../src/lib/referral-eligibility";
import {
  REFERRAL_CODE_PATTERN,
  generateReferralCode,
  normalizeReferralCode,
} from "../src/lib/referral-codes";
import {
  REFERRAL_REWARD_PENDING_MESSAGE,
  REFERRAL_REWARD_PLACEHOLDER,
  getReferralRewardConfig,
} from "../src/lib/referral-reward";
import { classifyExistingRedemption, isOwnPendingHold } from "../src/lib/referral-redemption";
import {
  PAYMENTS_STATUS_COPY,
  PAYMENTS_STATUS_LABEL,
  REQUIRED_PRICE_VARS,
  paymentsReadiness,
} from "../src/lib/payments";

let failed = 0;
function ok(name: string, pass: boolean, detail?: string) {
  if (pass) console.log(`✓ ${name}${detail ? ` — ${detail}` : ""}`);
  else {
    console.log(`✗ ${name}${detail ? ` — ${detail}` : ""}`);
    failed++;
  }
}

// ── Persona rules (Maya, Chris, Jamie) ─────────────────────────────────────
const maya = DEMO_ACCOUNTS.find((a) => a.email === "starter.fresh@demo.com")!;
const chris = DEMO_ACCOUNTS.find((a) => a.email === "starter.vendor@demo.com")!;
const jamie = DEMO_ACCOUNTS.find((a) => a.email === "pro.vendor@demo.com")!;

ok(
  "Maya demo card: no persona badge",
  getDemoAccountDisplayPersona(maya) === null
);
ok(
  "Chris demo card: Vendor / Supplier",
  getDemoAccountDisplayPersona(chris)?.label === "Vendor / Supplier"
);
ok(
  "Jamie demo card: Vendor / Supplier",
  getDemoAccountDisplayPersona(jamie)?.label === "Vendor / Supplier"
);
ok(
  "Maya DB display: blank until resume quiz",
  resolveMemberPersonaLabel("CAREER", "FRESH_GRAD", false) === null
);
ok(
  "Chris display: sales default Vendor",
  resolveMemberPersonaLabel("SALES", "VENDOR", false) === "Vendor / Supplier"
);
ok(
  "Career Pro after quiz shows persona",
  resolveMemberPersonaLabel("CAREER", "CAREER_SWITCHER", true) === "Career Switcher"
);

// ── Chapters = 9 ───────────────────────────────────────────────────────────
ok("PLAYBOOK_TOTAL_CHAPTERS is 9", PLAYBOOK_TOTAL_CHAPTERS === 9);

// ── Hero stats CMS-owned merge ─────────────────────────────────────────────
{
  const base = mergeLandingContent(DEFAULT_LANDING_CONTENT, {} as never);
  const heroStats = base.career.heroStats.map((s) =>
    s.label === "Full playbook chapters" ? { ...s, value: 12 } : s
  );
  const merged = mergeLandingContent(DEFAULT_LANDING_CONTENT, {
    career: { heroStats },
  } as never);
  ok(
    "Hero stat value edit persists on public merge",
    merged.career.heroStats.find((s) => s.label === "Full playbook chapters")?.value === 12
  );
}

// ── What's Inside save round-trip ──────────────────────────────────────────
{
  const base = mergeLandingContent(DEFAULT_LANDING_CONTENT, {} as never);
  const next = {
    ...base,
    whatsInside: {
      ...base.whatsInside,
      titleLine1: "Everything that Matters,",
      titleLine2: "Curated to the Essentials.",
    },
  };
  const save = prepareLandingContentForSave(next);
  ok("What's Inside save validates", save.success, save.success ? "" : formatLandingValidationErrors(save) ?? "");
  if (save.success) {
    const publicView = mergeLandingContent(DEFAULT_LANDING_CONTENT, {
      ...next,
      ...save.data,
    } as never);
    ok(
      "What's Inside titleLine1 on public site",
      publicView.whatsInside.titleLine1 === "Everything that Matters,"
    );
  }
}

// ── Trailing blank line no longer blocks whole save ────────────────────────
{
  const base = mergeLandingContent(DEFAULT_LANDING_CONTENT, {} as never);
  const next = {
    ...base,
    pricing: {
      ...base.pricing,
      tiers: base.pricing.tiers.map((t, i) =>
        i === 0 ? { ...t, features: [...t.features, ""] } : t
      ),
    },
  };
  const save = prepareLandingContentForSave(next);
  ok("Trailing blank feature line does not block save", save.success);
}

// ── Stat label rename persists ───────────────────────────────────────────────
{
  const base = mergeLandingContent(DEFAULT_LANDING_CONTENT, {} as never);
  const heroStats = base.career.heroStats.map((s) =>
    s.label === "Downloadable assets"
      ? { ...s, label: "Downloadable resources", value: 150 }
      : s
  );
  const merged = mergeLandingContent(DEFAULT_LANDING_CONTENT, {
    career: { heroStats },
  } as never);
  const row = merged.career.heroStats.find((s) => s.label === "Downloadable resources");
  ok("Stat label rename + value persist", row?.value === 150);
}

// ── Chapter Coverage heading style (matches Case Studies) ───────────────────
{
  const merged = mergeLandingContent(DEFAULT_LANDING_CONTENT, {} as never);
  ok(
    "Chapter Coverage has title + titleAccent",
    merged.chapterCoverage.title === "What We Cover." &&
      merged.chapterCoverage.titleAccent === "Entire Market Spectrum." &&
      merged.chapterCoverage.footerNote === "Playbook is updated on a periodic basis"
  );

  const legacy = mergeLandingContent(DEFAULT_LANDING_CONTENT, {
    chapterCoverage: {
      title: "What We Cover. Entire Market Spectrum.",
    },
  } as never);
  ok(
    "Legacy combined title splits into title + accent",
    legacy.chapterCoverage.title === "What We Cover." &&
      legacy.chapterCoverage.titleAccent === "Entire Market Spectrum."
  );

  const save = prepareLandingContentForSave({
    ...mergeLandingContent(DEFAULT_LANDING_CONTENT, {} as never),
    chapterCoverage: {
      ...DEFAULT_LANDING_CONTENT.chapterCoverage,
      title: "What We Cover.",
      titleAccent: "Full Market Coverage.",
    },
  });
  ok("Chapter Coverage save validates", save.success);

  const extraChapter = prepareLandingContentForSave({
    ...mergeLandingContent(DEFAULT_LANDING_CONTENT, {} as never),
    chapterCoverage: {
      ...DEFAULT_LANDING_CONTENT.chapterCoverage,
      chapters: [
        ...DEFAULT_LANDING_CONTENT.chapterCoverage.chapters,
        { letter: "J", title: "New Markets", desc: "Coverage for a tenth playbook chapter." },
      ],
    },
  });
  ok("Chapter Coverage allows more than the default chapter count", extraChapter.success);
  const withExtra = mergeLandingContent(DEFAULT_LANDING_CONTENT, {
    chapterCoverage: {
      ...DEFAULT_LANDING_CONTENT.chapterCoverage,
      chapters: [
        ...DEFAULT_LANDING_CONTENT.chapterCoverage.chapters,
        { letter: "J", title: "New Markets", desc: "Coverage for a tenth playbook chapter." },
      ],
    },
  } as never);
  ok(
    "Public landing renders CMS chapter coverage extras",
    withExtra.chapterCoverage.chapters.length ===
      DEFAULT_LANDING_CONTENT.chapterCoverage.chapters.length + 1 &&
      withExtra.chapterCoverage.chapters.at(-1)?.letter === "J"
  );
  const featuredFour = mergeLandingContent(DEFAULT_LANDING_CONTENT, {
    caseStudySample: {
      ...DEFAULT_LANDING_CONTENT.caseStudySample,
      featuredSlugs: [
        "the-inventory-divergence",
        "the-cargo-diversion-window",
        "when-the-dollar-spoke-first",
        "the-strait-that-repriced-everything",
      ],
    },
  } as never);
  const hydratedFour = hydrateLandingCaseStudyCards(featuredFour.caseStudySample, [
    {
      slug: "the-strait-that-repriced-everything",
      id: "cs-x",
      category: "Supply disruption",
      title: "The Strait That Repriced Everything",
      catchLine: "Quote",
      description: "Live excerpt from Case Studies CMS.",
      readMinutes: 12,
      status: "published",
      hasFullContent: true,
    },
    {
      slug: "the-inventory-divergence",
      id: "cs-1",
      category: "Physical arbitrage",
      title: "The Inventory Divergence",
      catchLine: "Live catch",
      description: "Live inventory excerpt.",
      readMinutes: 14,
      status: "published",
      hasFullContent: true,
    },
    {
      slug: "the-cargo-diversion-window",
      id: "cs-2",
      category: "Physical arbitrage",
      title: "The Cargo Diversion Window",
      catchLine: "Live cargo",
      description: "Live cargo excerpt.",
      readMinutes: 16,
      status: "published",
      hasFullContent: true,
    },
    {
      slug: "when-the-dollar-spoke-first",
      id: "cs-3",
      category: "Cross-market",
      title: "When the Dollar Spoke First",
      catchLine: "Live dollar",
      description: "Live dollar excerpt.",
      readMinutes: 18,
      status: "published",
      hasFullContent: true,
    },
  ]);
  const landingEditor = fs.readFileSync(
    path.join(process.cwd(), "src/app/admin/admin-landing-editor.tsx"),
    "utf8"
  );
  ok(
    "Career landing case studies featured list is CMS-owned (N, not a hardcoded trio)",
    featuredFour.caseStudySample.featuredSlugs?.length === 4 &&
      hydratedFour.length === 4 &&
      hydratedFour[0]?.title === "The Inventory Divergence" &&
      hydratedFour[3]?.title === "The Strait That Repriced Everything" &&
      hydratedFour[3]?.excerpt === "Live excerpt from Case Studies CMS." &&
      landingEditor.includes("Featured on Career landing") &&
      landingEditor.includes("Select from Case Studies CMS") &&
      mergeLandingContent(DEFAULT_LANDING_CONTENT, {} as never).caseStudySample.featuredSlugs?.length === 3
  );
}

// ── Starter Pack digest topic normalization ─────────────────────────────────
{
  const split = splitLegacyDigestTopicLine('Desk Truths — "what nobody tells you" insider tips');
  ok("Legacy topic line splits tag and caption", split.tag === "Desk Truths" && split.title.includes("insider"));
  const merged = mergeStarterEmailDigest({
    topics: ["Market Pulse — quick reads on live market dynamics"],
  } as never);
  ok(
    "CMS legacy string topics normalize for public display",
    merged.topics[0]?.tag === "Market Pulse" && merged.topics[0]?.title.includes("quick reads")
  );
  const corrupted = { "0": "D", "1": "e", "2": "s", "3": "k", "4": " ", "5": "T", "6": "r", "7": "u", "8": "t", "9": "h", "10": "s", "11": " ", "12": "—", "13": " ", "14": "c", "15": "a", "16": "p", "17": "t", "18": "i", "19": "o", "20": "n" };
  const recovered = mergeStarterEmailDigest({ topics: [corrupted] } as never);
  ok(
    "Corrupted char-index CMS topics recover on read",
    recovered.topics[0]?.tag === "Desk Truths" && recovered.topics[0]?.title === "caption"
  );
}

// ── Dashboard module track mapping ──────────────────────────────────────────
{
  const careerOnly = DEFAULT_DASHBOARD_RESOURCE_CARDS.filter((c) => c.track === "Career").map((c) => c.slug);
  const playbookCard = DEFAULT_DASHBOARD_RESOURCE_CARDS.find((c) => c.slug === "playbook");
  const briefCard = DEFAULT_DASHBOARD_RESOURCE_CARDS.find((c) => c.slug === "career-intelligence-brief");
  ok("Playbook is Both-track", playbookCard?.track === "Both");
  ok(
    "Career Intelligence Brief is an email digest (no file)",
    briefCard?.cardKind === "email-digest"
  );
  ok(
    "Industry Guide for Sales is a file download card",
    DEFAULT_SALES_DASHBOARD_RESOURCE_CARDS.find((c) => c.slug === "industry-guide-for-sales")
      ?.cardKind === "file"
  );
  const careerNavCard = DEFAULT_DASHBOARD_RESOURCE_CARDS.find(
    (c) => c.slug === "career-navigation-guide"
  );
  ok(
    "Career Navigation Guide is a Career Pro file card",
    Boolean(
      careerNavCard?.cardKind === "file" &&
        careerNavCard.track === "Career" &&
        careerNavCard.deliverableKey === "careerNavigationGuide"
    )
  );
  ok(
    "Career Navigation Guide card copy matches brief",
    Boolean(careerNavCard?.description.includes("PDF deliverable"))
  );
  ok(
    "Footer Career Track links to career landing (not roadmap)",
    DEFAULT_SITE_FOOTER.columns.contents.find((l) => l.label === "Career Track")?.href ===
      "/?track=career"
  );
  {
    const footer = mergeSiteFooterContent({});
    const access = footer.columns.access.map((l) => l.label);
    const mentorIdx = access.findIndex((l) => l === "Be a Mentor");
    const memberIdx = access.findIndex((l) => l === "Be a Member");
    ok(
      "Footer Be a Mentor sits directly under Be a Member",
      mentorIdx === memberIdx + 1 && footer.columns.access[mentorIdx]?.href === "/mentor-apply"
    );
    const cmsMentorAsContact = mergeSiteFooterContent({
      columns: {
        contents: DEFAULT_SITE_FOOTER.columns.contents,
        community: DEFAULT_SITE_FOOTER.columns.community,
        access: [
          { label: "Be a Member", href: "/pricing" },
          { label: "Be a Mentor", href: "#contact", action: "contact" },
          { label: "Be a Partner", href: "#contact", action: "contact" },
        ],
      },
    });
    const mentorLink = cmsMentorAsContact.columns.access.find((l) => l.label === "Be a Mentor");
    ok(
      "CMS Be a Mentor with contact action still routes to mentor sign-up",
      mentorLink?.href === "/mentor-apply" && mentorLink.action !== "contact"
    );
    ok(
      "Footer Privacy and Terms of Use stay on /privacy and /terms by default",
      footer.legal.privacy.href === "/privacy" &&
        footer.legal.terms.href === "/terms" &&
        footer.legal.privacy.label === "Privacy" &&
        footer.legal.terms.label === "Terms"
    );
    const legacyFooter = mergeSiteFooterContent({
      blurb: DEFAULT_SITE_FOOTER.blurb,
      newsletter: DEFAULT_SITE_FOOTER.newsletter,
      columns: DEFAULT_SITE_FOOTER.columns,
    });
    ok(
      "Published footer payloads without legal keys still show Privacy and Terms",
      legacyFooter.legal.privacy.href === "/privacy" &&
        legacyFooter.legal.terms.pageTitle === "Terms of Service" &&
        legacyFooter.legal.privacy.sections.length > 1 &&
        legacyFooter.legal.terms.sections.length > 1
    );
  }
  {
    const contactModal = fs.readFileSync(
      path.join(process.cwd(), "src/components/landing/contact-modal.tsx"),
      "utf8"
    );
    ok("Contact modal has no Or email fallback line", !contactModal.includes("Or email"));
  }
  {
    const mentorApplyCopy = fs.readFileSync(
      path.join(process.cwd(), "src/data/mentor-apply-content.ts"),
      "utf8"
    );
    ok("Mentor years placeholder is e.g. 20", mentorApplyCopy.includes('yearsPlaceholder: "e.g. 20"'));
    ok(
      "Mentor commodity focus placeholder lists Gasoil and Base Metals",
      mentorApplyCopy.includes("Primary commodity focus") &&
        mentorApplyCopy.includes("e.g. Gasoil, LNG, Power, Base Metals")
    );
    ok(
      "Mentor experience placeholder uses market background and desks / functions",
      mentorApplyCopy.includes("commodity market background") &&
        mentorApplyCopy.includes("desks / functions")
    );
    const adminContent = fs.readFileSync(
      path.join(process.cwd(), "src/app/admin/admin-content-tab.tsx"),
      "utf8"
    );
    ok(
      "Admin CMS has Mentor Application editor",
      adminContent.includes('label: "Mentor Application"') &&
        adminContent.includes('editorVariant: "mentor-apply"')
    );
  }
  {
    const adminClient = fs.readFileSync(
      path.join(process.cwd(), "src/app/admin/admin-client.tsx"),
      "utf8"
    );
    ok(
      "Admin customers/progress/billing/waitlist use shared AdminTableFilters",
      adminClient.includes("AdminTableFilters") &&
        adminClient.includes('activeTab === "users"') &&
        adminClient.includes('activeTab === "progress"') &&
        adminClient.includes('activeTab === "billing"') &&
        adminClient.includes('activeTab === "waitlist"')
    );
  }
  {
    const roadmapEditor = fs.readFileSync(
      path.join(process.cwd(), "src/app/admin/editors/career-roadmap-editor.tsx"),
      "utf8"
    );
    ok(
      "Career roadmap CMS supports per-role comp editing",
      roadmapEditor.includes("Compensation benchmarks (SGD)") &&
        roadmapEditor.includes('activeTab === "comp"')
    );
    const roadmapClient = fs.readFileSync(
      path.join(process.cwd(), "src/app/career-roadmap/career-roadmap-client.tsx"),
      "utf8"
    );
    const mergedBottom = mergeCareerRoadmapBottomStrip({});
    ok(
      "Career Roadmap top and bottom navy strips are CMS-editable",
      roadmapEditor.includes("Page hero strip") &&
        roadmapEditor.includes("Bottom blue strip") &&
        roadmapEditor.includes("Top blue strip") &&
        roadmapClient.includes("bottomStrip") &&
        roadmapClient.includes('href={btn.href}') &&
        roadmapClient.includes("outline-dark") &&
        mergedBottom.buttons[0]?.label === "Go to Questions Bank" &&
        mergedBottom.buttons[0]?.href === "/interview-questions" &&
        mergedBottom.buttons[1]?.label === "Go to Resume Building" &&
        mergedBottom.buttons[1]?.href === "/resume-templates" &&
        mergeCareerRoadmapBottomStrip({ title: "  " }).title ===
          DEFAULT_CAREER_ROADMAP_BOTTOM_STRIP.title &&
        sanitizeMemberHref("https://evil.example", "/interview-questions") ===
          "/interview-questions" &&
        sanitizeMemberHref("//evil.example", "/resume-templates") === "/resume-templates" &&
        sanitizeMemberHref("/resume-templates", "/interview-questions") === "/resume-templates"
    );
  }
  {
    const href = resolveDashboardFileDownloadHref("industryGuideForSales", {
      careerNavigationGuide: null,
      salesDeliverables: {
        salesEdgeNote: null,
        industryGuideForSales: {
          label: "Industry Guide",
          fileName: "guide.pdf",
          assetId: "asset-123",
          mimeType: "application/pdf",
        },
      },
    });
    ok(
      "Shared file deliverable resolver returns download href when asset exists",
      Boolean(href?.includes("/api/content/assets/asset-123") && href.includes("download"))
    );
    ok(
      "Shared file deliverable resolver reports not ready without asset",
      !isDashboardFileReady("careerNavigationGuide", {
        careerNavigationGuide: null,
        salesDeliverables: { salesEdgeNote: null, industryGuideForSales: null },
      })
    );
    ok(
      "Industry Guide for Sales is not ready without an uploaded PDF",
      !isDashboardFileReady("industryGuideForSales", {
        careerNavigationGuide: null,
        salesDeliverables: { salesEdgeNote: null, industryGuideForSales: null },
      })
    );
  }
  {
    const chapterClient = fs.readFileSync(
      path.join(process.cwd(), "src/app/playbook/[chapter]/chapter-client.tsx"),
      "utf8"
    );
    ok(
      "Playbook section files show Coming soon when no PDF is uploaded",
      chapterClient.includes("Coming soon") && !chapterClient.includes("Upload in admin CMS")
    );
    const slots = fs.readFileSync(
      path.join(process.cwd(), "src/lib/content/playbook-section-assets.ts"),
      "utf8"
    );
    ok(
      "Playbook sections always reserve three phased PDF slots",
      slots.includes("ensurePlaybookSectionAssets") && slots.includes("Infographic")
    );
  }
  ok(
    "Career Navigation Guide is a file download card",
    DEFAULT_DASHBOARD_RESOURCE_CARDS.find((c) => c.slug === "career-navigation-guide")?.cardKind === "file"
  );
  ok(
    "Career Navigation Guide is Career Pro track",
    DEFAULT_DASHBOARD_RESOURCE_CARDS.find((c) => c.slug === "career-navigation-guide")?.track === "Career"
  );
  ok(
    "Mentor credits month is MTH YEAR",
    formatCreditMonthLabel(new Date(2026, 8, 1)) === "Sep 2026"
  );
  ok(
    "Career Intelligence Brief is Career Pro+ (no Sales)",
    briefCard?.track === "Career" && !careerOnly.includes("playbook")
  );
  ok(
    "Sales Pro cannot see Career-only cards",
    !isDashboardModuleVisible("Career", "SALES") && isDashboardModuleVisible("Career", "CAREER")
  );
  ok("Sales sees Both modules", isDashboardModuleVisible("Both", "SALES"));
  ok("Career does not see Sales-only", !isDashboardModuleVisible("Sales", "CAREER"));
  ok(
    "Sales-only catalog tools default to Sales track",
    DEFAULT_SALES_DASHBOARD_RESOURCE_CARDS.every((c) => c.track === "Sales")
  );
  ok(
    "Unified resource catalog includes career and sales cards (N, not a hardcoded trio)",
    DEFAULT_UNIFIED_DASHBOARD_RESOURCE_CARDS.length ===
      DEFAULT_DASHBOARD_RESOURCE_CARDS.length + DEFAULT_SALES_DASHBOARD_RESOURCE_CARDS.length &&
      DEFAULT_UNIFIED_DASHBOARD_RESOURCE_CARDS.length > 3 &&
      DEFAULT_SALES_DASHBOARD_RESOURCE_CARDS.every((c) =>
        DEFAULT_UNIFIED_DASHBOARD_RESOURCE_CARDS.some((u) => u.slug === c.slug)
      )
  );
  ok(
    "Library Resources dashboard card opens /library for Elite",
    DEFAULT_UNIFIED_DASHBOARD_RESOURCE_CARDS.find((c) => c.slug === "library")?.href === "/library" &&
      DEFAULT_UNIFIED_DASHBOARD_RESOURCE_CARDS.find((c) => c.slug === "library")?.requiredTier === "ELITE" &&
      DEFAULT_UNIFIED_DASHBOARD_RESOURCE_CARDS.find((c) => c.slug === "library")?.track === "Both"
  );
  {
    const libraryEditor = fs.readFileSync(
      path.join(process.cwd(), "src/app/admin/editors/library-editor.tsx"),
      "utf8"
    );
    ok(
      "Library CMS editor explains /library, dashboard card, and Elite lock",
      libraryEditor.includes("/library") &&
        libraryEditor.includes("Library Resources") &&
        libraryEditor.includes("dashboard") &&
        libraryEditor.includes("Elite")
    );
    const many = Array.from({ length: 8 }, (_, i) => ({
      id: `lib-${i}`,
      label: `File ${i}`,
      fileName: `file-${i}.pdf`,
      assetId: `asset-${i}`,
      mimeType: "application/pdf",
      delivery: "view-only" as const,
      track: "both" as const,
      accessTier: i % 2 === 0 ? ("free" as const) : ("elite" as const),
    }));
    ok(
      "Library CMS accepts N files, not a 1–3 slot cap",
      normalizeLibraryPayload({ files: many }).files.length === 8 &&
        normalizeLibraryPayload(null).files.length === 0
    );
    ok(
      "Library CMS blue strip copy merges defaults when files are empty",
      normalizeLibraryPayload({ files: [] }).hero.title === DEFAULT_LIBRARY_HERO.title &&
        normalizeLibraryPayload({ files: [] }).hero.eyebrow === DEFAULT_LIBRARY_HERO.eyebrow &&
        normalizeLibraryPayload(null).hero.description === DEFAULT_LIBRARY_HERO.description &&
        normalizeLibraryPayload({
          files: [],
          hero: { eyebrow: "Elite files", title: "Desk Library", description: "Custom strip." },
        }).hero.title === "Desk Library" &&
        libraryEditor.includes('label="Kicker / eyebrow"') &&
        libraryEditor.includes('label="Title"') &&
        libraryEditor.includes('label="Description"') &&
        libraryEditor.includes("Page hero strip") &&
        libraryEditor.includes("/library")
    );
    const libraryClient = fs.readFileSync(
      path.join(process.cwd(), "src/app/library/library-client.tsx"),
      "utf8"
    );
    ok(
      "Live /library renders CMS hero copy fields, not hardcoded Resource Library title",
      libraryClient.includes("hero.eyebrow") &&
        libraryClient.includes("hero.title") &&
        libraryClient.includes("hero.description") &&
        !libraryClient.includes("Free reference files for all members, plus Elite bonus guides and desk materials.")
    );
    ok(
      "Library list headings Elite Resources and Free Resources are CMS-editable",
      libraryClient.includes("eliteSection.title") &&
        libraryClient.includes("eliteSection.description") &&
        libraryClient.includes("freeSection.title") &&
        libraryClient.includes("freeSection.description") &&
        !libraryClient.includes("Bonus guides and reference materials for Elite members.") &&
        libraryEditor.includes("Elite heading") &&
        libraryEditor.includes("Elite caption") &&
        normalizeLibraryPayload({ files: [] }).eliteSection.title === "Elite Resources" &&
        normalizeLibraryPayload({
          files: [],
          eliteSection: { title: "Desk extras", description: "Elite-only PDFs." },
        }).eliteSection.title === "Desk extras"
    );
  }
  {
    const titled = normalizeMemberDashboardPayload({
      ...DEFAULT_MEMBER_DASHBOARD_CONTENT,
      resourceCards: DEFAULT_UNIFIED_DASHBOARD_RESOURCE_CARDS.map((c) =>
        c.slug === "playbook" ? { ...c, title: "The Desk Playbook" } : c
      ),
    });
    ok(
      "CMS resource card title overlays the live dashboard copy",
      titled.resourceCards.find((c) => c.slug === "playbook")?.title === "The Desk Playbook"
    );
    const blankTitle = normalizeMemberDashboardPayload({
      ...DEFAULT_MEMBER_DASHBOARD_CONTENT,
      resourceCards: DEFAULT_UNIFIED_DASHBOARD_RESOURCE_CARDS.map((c) =>
        c.slug === "playbook" ? { ...c, title: "   " } : c
      ),
    });
    const playbook = blankTitle.resourceCards.find((c) => c.slug === "playbook")!;
    ok(
      "Blank CMS title falls back to catalog label",
      playbook.title === "Full Playbook" && resolveResourceCardTitle({ slug: "playbook", title: "" }) === "Full Playbook"
    );
    ok(
      "Job Openings dashboard card uses Live Chat Feature label",
      DEFAULT_UNIFIED_DASHBOARD_RESOURCE_CARDS.find((c) => c.slug === "job-openings")?.title ===
        "Job Openings - Live Chat Feature" &&
        normalizeMemberDashboardPayload({
          ...DEFAULT_MEMBER_DASHBOARD_CONTENT,
          resourceCards: DEFAULT_UNIFIED_DASHBOARD_RESOURCE_CARDS.map((c) =>
            c.slug === "job-openings" ? { ...c, title: "Job Openings" } : c
          ),
        }).resourceCards.find((c) => c.slug === "job-openings")?.title ===
          "Job Openings - Live Chat Feature"
    );
    const retargeted = normalizeMemberDashboardPayload({
      ...DEFAULT_MEMBER_DASHBOARD_CONTENT,
      resourceCards: DEFAULT_UNIFIED_DASHBOARD_RESOURCE_CARDS.map((c) =>
        c.slug === "resume-templates" ? { ...c, track: "Both" as const } : c
      ),
    });
    const resume = retargeted.resourceCards.find((c) => c.slug === "resume-templates")!;
    ok(
      "CMS track toggle is not product-hardcoded",
      resume.track === "Both" &&
        isDashboardModuleVisible(resume.track, "SALES") &&
        isDashboardModuleVisible(resume.track, "CAREER")
    );
    const legacySplit = normalizeMemberDashboardPayload({
      starterPack: DEFAULT_MEMBER_DASHBOARD_CONTENT.starterPack,
      upgradeToPro: DEFAULT_MEMBER_DASHBOARD_CONTENT.upgradeToPro,
      upgradeToElite: DEFAULT_MEMBER_DASHBOARD_CONTENT.upgradeToElite,
      resourceCards: DEFAULT_DASHBOARD_RESOURCE_CARDS.map((c) => ({
        slug: c.slug,
        title: c.title,
        description: c.description,
      })),
      salesResourceCards: DEFAULT_SALES_DASHBOARD_RESOURCE_CARDS.map((c) => ({
        slug: c.slug,
        title: "Legacy " + c.title,
        description: c.description,
        requiredTier: c.requiredTier,
        href: c.href,
      })),
    });
    ok(
      "Legacy salesResourceCards merge into the unified Resource cards list",
      legacySplit.resourceCards.some((c) => c.slug === "account-intelligence") &&
        legacySplit.resourceCards.find((c) => c.slug === "industry-guide-for-sales")?.title ===
          "Legacy Industry Guide for Sales" &&
        legacySplit.resourceCards.length === DEFAULT_UNIFIED_DASHBOARD_RESOURCE_CARDS.length
    );
    const reordered = normalizeMemberDashboardPayload({
      ...DEFAULT_MEMBER_DASHBOARD_CONTENT,
      resourceCards: [...DEFAULT_UNIFIED_DASHBOARD_RESOURCE_CARDS].reverse().map((c) => ({
        slug: c.slug,
        title: c.title,
        description: c.description,
        track: c.track,
      })),
    });
    ok(
      "CMS list order is preserved for N catalog cards",
      reordered.resourceCards[0]?.slug === DEFAULT_UNIFIED_DASHBOARD_RESOURCE_CARDS.at(-1)?.slug &&
        reordered.resourceCards.length === DEFAULT_UNIFIED_DASHBOARD_RESOURCE_CARDS.length
    );
  }
  ok(
    "Both-track members see Career, Sales, and Both cards",
    dashboardAudienceFromPreview({
      isAdmin: false,
      isMentorUser: false,
      isPreviewActive: false,
      effectiveTrack: "BOTH",
    }) === "ALL" &&
      isDashboardModuleVisible("Career", "ALL") &&
      isDashboardModuleVisible("Sales", "ALL")
  );

  const careerSlugs = DEFAULT_DASHBOARD_RESOURCE_CARDS.filter((c) => c.track === "Career").map((c) => c.slug);
  const bothSlugs = DEFAULT_DASHBOARD_RESOURCE_CARDS.filter((c) => c.track === "Both").map((c) => c.slug);
  for (const slug of careerSlugs) {
    ok(
      `Sales cannot see Career card ${slug}`,
      !isDashboardModuleVisible("Career", "SALES")
    );
  }
  for (const slug of bothSlugs) {
    ok(`Both card ${slug} visible to Sales`, isDashboardModuleVisible("Both", "SALES"));
    ok(`Both card ${slug} visible to Career`, isDashboardModuleVisible("Both", "CAREER"));
  }
  ok("Admin ALL sees Career-only cards", isDashboardModuleVisible("Career", "ALL"));
  ok("Admin ALL sees Sales tools", isDashboardModuleVisible("Sales", "ALL"));
  ok(
    "Sales member can open Both-track playbook",
    memberMayAccessCareerPlaybook({ track: "SALES", role: "USER" })
  );
  ok(
    "Career member can open playbook A–E",
    memberMayAccessCareerPlaybook({ track: "CAREER", role: "USER" })
  );
  ok(
    "Admin can open playbook even on Sales track",
    memberMayAccessCareerPlaybook({ track: "SALES", role: "ADMIN" })
  );
}

// ── Mentor credits month label ─────────────────────────────────────────────
{
  const label = formatCreditMonthLabel(new Date(2026, 8, 1));
  ok(
    "Mentor credits month is abbreviated (Sep 2026)",
    label === "Sep 2026"
  );
}

// ── Sales landing What You'll Learn is CMS-editable ────────────────────────
{
  const merged = mergeLandingContent(DEFAULT_LANDING_CONTENT, {
    sales: {
      learn: {
        eyebrow: "What You'll Learn",
        headline: "Edited commercial headline.",
        description: "Edited description for vendors.",
        items: [
          { num: "01", title: "Edited topic", desc: "Edited body copy for the accordion." },
        ],
      },
    },
  } as never);
  ok(
    "Sales What You'll Learn headline persists on public merge",
    merged.sales.learn.headline === "Edited commercial headline." &&
      merged.sales.learn.items[0]?.title === "Edited topic"
  );

  const problemMerged = mergeLandingContent(DEFAULT_LANDING_CONTENT, {
    sales: {
      problem: {
        eyebrow: "The Problem",
        headline: "Edited problem headline.",
        description: "Edited problem intro.",
        cards: [{ title: "Edited card", desc: "Edited card body." }],
      },
    },
  } as never);
  ok(
    "Sales The Problem headline persists on public merge",
    problemMerged.sales.problem.headline === "Edited problem headline." &&
      problemMerged.sales.problem.cards[0]?.title === "Edited card"
  );
  const problemLegacy = mergeLandingContent(DEFAULT_LANDING_CONTENT, {
    sales: { headline: "Legacy sales still loads" },
  } as never);
  ok(
    "Legacy landing JSON without problem still seeds The Problem cards",
    problemLegacy.sales.problem.cards.length === 3 &&
      problemLegacy.sales.problem.eyebrow === "The Problem"
  );

  const save = prepareLandingContentForSave(
    mergeLandingContent(DEFAULT_LANDING_CONTENT, {} as never)
  );
  ok(
    "Landing save still validates with What You'll Learn",
    save.success,
    save.success ? "" : formatLandingValidationErrors(save) ?? ""
  );
}

// ── Sales Track Only tools (Market Nudges feature list) ────────────────────
{
  const expectedTitles = [
    "Market Talking Points",
    "Prep Library",
    "Account Intelligence Track",
    "Mentor Connect",
    "Desk Channel",
    "Market Role Movements",
  ];
  const defaults = DEFAULT_LANDING_CONTENT.sales.trackTools;
  ok(
    "Default Sales Track tools has 6 features",
    defaults.eyebrow === "Sales Track Only" &&
      defaults.headline === "Sales Intelligence" &&
      defaults.features.length === 6 &&
      expectedTitles.every((title, i) => defaults.features[i]?.title === title)
  );
  ok(
    "Default Market Talking Points caption is the expandable desk line",
    defaults.features[0]?.desc.includes("client conversation")
  );

  const mergedEmpty = mergeLandingContent(DEFAULT_LANDING_CONTENT, {} as never);
  ok(
    "Empty CMS merge still seeds Sales Track tools",
    mergedEmpty.sales.trackTools.features.map((f) => f.title).join("|") ===
      expectedTitles.join("|")
  );

  const legacyPayload = {
    ...DEFAULT_LANDING_CONTENT,
    sales: {
      ...DEFAULT_LANDING_CONTENT.sales,
    },
  };
  delete (legacyPayload.sales as { trackTools?: unknown }).trackTools;
  const legacySave = prepareLandingContentForSave(legacyPayload);
  ok(
    "Legacy landing JSON without trackTools still validates",
    legacySave.success,
    legacySave.success ? "" : formatLandingValidationErrors(legacySave) ?? ""
  );

  const legacyMerge = mergeLandingContent(DEFAULT_LANDING_CONTENT, {
    sales: {
      headline: "Legacy headline still loads",
      description: "Legacy paragraph still loads.",
    },
  } as never);
  ok(
    "Legacy sales headline/paragraph load and tools default",
    legacyMerge.sales.headline === "Legacy headline still loads" &&
      legacyMerge.sales.description === "Legacy paragraph still loads." &&
      legacyMerge.sales.trackTools.features.length === 6
  );

  const edited = mergeLandingContent(DEFAULT_LANDING_CONTENT, {
    sales: {
      trackTools: {
        eyebrow: "Sales Track Only",
        features: [
          { title: "Sales Nudges", desc: "Edited talking points caption." },
        ],
      },
    },
  } as never);
  ok(
    "Sales Track tools list is fully CMS-owned (replace, not keyed merge)",
    edited.sales.trackTools.features.length === 1 &&
      edited.sales.trackTools.features[0]?.desc === "Edited talking points caption."
  );

  const uneditedSeed = mergeLandingContent(DEFAULT_LANDING_CONTENT, {
    sales: {
      trackTools: {
        eyebrow: "Sales Track Only",
        features: [
          { title: "Sales Nudges", desc: "Market Talking Points" },
          { title: "Prep Library", desc: "Bookmark the talking points prior meetings" },
          { title: "Account Intelligence Track", desc: "Link market talking points to specific accounts" },
          { title: "Mentor Connect", desc: "Ask practitioners your sales-prep questions, anonymously." },
          { title: "Desk Channel", desc: "Practitioner Q&As that show how desks frame commercial problems." },
          { title: "Market Role Movements", desc: "Track which firms are growing and hiring — your next target accounts." },
        ],
      },
    },
  } as never);
  ok(
    "Unedited first-seed tools list upgrades to accordion copy",
    uneditedSeed.sales.trackTools.headline === "Sales Intelligence" &&
      uneditedSeed.sales.trackTools.features[0]?.title === "Market Talking Points"
  );

  const landingEditor = fs.readFileSync(
    path.join(process.cwd(), "src/app/admin/admin-landing-editor.tsx"),
    "utf8"
  );
  ok(
    "Admin landing editor wires Sales Track tools headline + expandable captions",
    landingEditor.includes("Sales Track Only — Tools") &&
      landingEditor.includes("content.sales.trackTools") &&
      landingEditor.includes("Add feature") &&
      landingEditor.includes("Expandable caption") &&
      landingEditor.includes("trackTools.headline") &&
      landingEditor.includes("afterSalesTrackTools") &&
      landingEditor.includes("Sales Track — The Problem") &&
      landingEditor.includes("content.sales.problem")
  );
  const landingEditorWrap = fs.readFileSync(
    path.join(process.cwd(), "src/app/admin/editors/landing-editor.tsx"),
    "utf8"
  );
  ok(
    "Sales Talking Points sits under Sales Track Only — Tools in admin",
    landingEditorWrap.includes('title="Sales Talking Points"') &&
      landingEditorWrap.includes("afterSalesTrackTools") &&
      !landingEditorWrap.includes("Sales Market Strip")
  );

  const salesPanel = fs.readFileSync(
    path.join(process.cwd(), "src/components/landing/sales-landing-panel.tsx"),
    "utf8"
  );
  ok(
    "Public sales landing uses CMS trackTools, not the pipe headline",
    salesPanel.includes("content.trackTools.features") &&
      salesPanel.includes("content.trackTools.eyebrow") &&
      salesPanel.includes("content.trackTools.headline") &&
      !salesPanel.includes("Sales Market Nudges | Prep Library") &&
      salesPanel.includes("content.problem.cards") &&
      !salesPanel.includes("PAIN_POINTS")
  );
  ok(
    "See demo on Sales landing opens Contact Us",
    salesPanel.includes("demoOnClick: onOpenContactModal") &&
      !salesPanel.includes("SALES_DEMO_URL")
  );

  const marketStrip = fs.readFileSync(
    path.join(process.cwd(), "src/components/landing/market-note-strip.tsx"),
    "utf8"
  );
  ok(
    "Sales Track tools render as an accordion beside Recent Talking Points",
    marketStrip.includes("SalesTrackToolsCard") &&
      marketStrip.includes("aria-expanded") &&
      marketStrip.includes("SALES_SECTION_MINT") &&
      marketStrip.includes("topicsHeading") &&
      marketStrip.includes("TalkingPointRow")
  );
  const edgeEditor = fs.readFileSync(
    path.join(process.cwd(), "src/app/admin/editors/sales-edge-note-editor.tsx"),
    "utf8"
  );
  ok(
    "Admin can edit example talking point wordings including extra lines",
    edgeEditor.includes("Example talking points") &&
      edgeEditor.includes("extraLines") &&
      edgeEditor.includes("topicsHeading")
  );
  ok(
    "Sales talking points default to the seven-tag mockup and mint section",
    SALES_SECTION_MINT === "#F0FDF4" &&
      SALES_MARKET_NOTE.topicsHeading === "Recent Talking Points" &&
      SALES_MARKET_NOTE.topics.length === 7 &&
      defaultSalesEdgeNote().topics?.some((t) => (t.extraLines ?? []).length > 0) === true &&
      resolveSalesTalkingPoints(
        LEGACY_SALES_TALKING_POINT_TITLES.map((title) => ({ title }))
      ).length === 7 &&
      resolveSalesTalkingPoints([{ title: "Custom talking point" }])[0]?.title ===
        "Custom talking point" &&
      resolveSalesTalkingPoints([
        { title: "Custom talking point", extraLines: ["", "Second line"] },
      ])[0]?.extraLines?.includes("") === true
  );

  const siteChrome = fs.readFileSync(
    path.join(process.cwd(), "src/components/site-chrome.tsx"),
    "utf8"
  );
  const rootLayout = fs.readFileSync(path.join(process.cwd(), "src/app/layout.tsx"), "utf8");
  ok(
    "Mentor apply omits site header/footer via SiteChrome",
    siteChrome.includes('"/mentor-apply"') &&
      rootLayout.includes("SiteChrome") &&
      !rootLayout.includes("paddingTop: NAV_OFFSET")
  );
  const playbookHub = fs.readFileSync(
    path.join(process.cwd(), "src/app/playbook/playbook-hub-client.tsx"),
    "utf8"
  );
  const playbookChapter = fs.readFileSync(
    path.join(process.cwd(), "src/app/playbook/[chapter]/chapter-client.tsx"),
    "utf8"
  );
  const playbookEditor = fs.readFileSync(
    path.join(process.cwd(), "src/app/admin/editors/playbook-editor.tsx"),
    "utf8"
  );
  ok(
    "Playbook chapters do not show or edit read time",
    !playbookHub.includes("readTime") &&
      !playbookChapter.includes("readTime") &&
      !playbookEditor.includes("Read time") &&
      !playbookEditor.includes("ch.readTime")
  );
  ok(
    "Playbook hub lists releasing-soon chapters without a Read link",
    playbookHub.includes("Releasing soon") &&
      playbookHub.includes("isPlaybookChapterReleasingSoon") &&
      !playbookHub.includes('letter >= "F"') &&
      !playbookHub.includes("letter === \"F\"")
  );
  ok(
    "Playbook hub letter badges: live solid navy, releasing-soon light blue, not hardcoded to F–I",
    playbookHub.includes("bg-primary-soft") &&
      playbookHub.includes("text-primary-400") &&
      playbookHub.includes("bg-primary-800") &&
      playbookHub.includes("playbookChapterHeroColor") &&
      playbookHub.includes("chapter.letter") &&
      playbookHub.includes("releasingSoon") &&
      !playbookHub.includes('chapter.id === "f"') &&
      !playbookHub.includes("letter === \"G\"")
  );
  ok(
    "Playbook chapter page always paints the navy/blue hero strip (not gated on takeaways or status)",
    playbookChapter.includes("playbookChapterHeroColor") &&
      playbookChapter.includes("bg-primary-800") &&
      playbookChapter.includes("backgroundColor") &&
      playbookChapter.includes("Key Takeaways") &&
      playbookChapter.includes("keyTakeaways") &&
      !playbookChapter.includes("keyTakeaways?.length &&") &&
      !playbookChapter.includes("isPlaybookChapterReleasingSoon(chapter)")
  );
  ok(
    "Playbook admin can edit key takeaways for every chapter",
    playbookEditor.includes("Key takeaways") &&
      playbookEditor.includes("keyTakeaways") &&
      playbookEditor.includes("Keep **term** markers")
  );
  ok(
    "Playbook admin can publish or mark releasing soon per chapter",
    playbookEditor.includes("Hub listing") &&
      playbookEditor.includes("releasing-soon") &&
      playbookEditor.includes("Live — members can read")
  );
  const mobilePlaybookApi = fs.readFileSync(
    path.join(process.cwd(), "src/app/api/mobile/playbook/route.ts"),
    "utf8"
  );
  const mobilePlaybookHub = fs.readFileSync(
    path.join(process.cwd(), "mobile/app/(tabs)/playbook.tsx"),
    "utf8"
  );
  ok(
    "Mobile playbook sends a paint-able chapter color and light-blue unreleased letters",
    mobilePlaybookApi.includes("playbookChapterHeroColor") &&
      mobilePlaybookHub.includes("chapterLetterSoon") &&
      mobilePlaybookHub.includes("chapters.length") &&
      !mobilePlaybookHub.includes("5 chapters · 40 sections")
  );
  ok(
    "Admin landing Chapter Coverage can add chapters",
    landingEditor.includes("Add chapter") &&
      landingEditor.includes("chapterCoverage.chapters") &&
      landingEditor.includes("Describe what this chapter covers.")
  );
  const careerLanding = fs.readFileSync(
    path.join(process.cwd(), "src/components/landing/landing-page-client.tsx"),
    "utf8"
  );
  ok(
    "Public career landing does not include Chapter Coverage add controls",
    careerLanding.includes("chapterCoverage.chapters") &&
      !careerLanding.includes("Add chapter")
  );
  ok(
    "Career Chapter Coverage shows a CMS footer note under the accordion",
    careerLanding.includes("chapterCoverage.footerNote") &&
      landingEditor.includes("footerNote") &&
      DEFAULT_LANDING_CONTENT.chapterCoverage.footerNote ===
        "Playbook is updated on a periodic basis"
  );
}

{
  const emptyCms = {
    chapters: CHAPTERS.map((ch) => ({
      id: ch.id,
      letter: ch.letter,
      title: ch.title,
      subtitle: ch.subtitle,
      pages: ch.pages,
      sections: ch.sections,
    })),
  };
  const hydrated = resolvePlaybookPayload(emptyCms);
  const firstDefault = playbookSections.a[0];
  ok(
    "Playbook admin merge fills empty CMS section bodies from repo",
    hydrated.sections.a[0]?.hook === firstDefault.hook &&
      hydrated.sections.a[0]?.paragraphs[0] === firstDefault.paragraphs[0] &&
      hydrated.chapters[0]?.sections[0]?.hook === firstDefault.hook &&
      firstDefault.paragraphs.some((p) => p.includes("**"))
  );
  const edited = resolvePlaybookPayload({
    chapters: [
      {
        id: "a",
        letter: "A",
        title: "Edited",
        sections: [
          {
            id: "a1",
            hook: "",
            paragraphs: ["Frances edited this paragraph with **crack spread** still marked."],
          },
        ],
      },
    ],
  });
  ok(
    "Playbook save keeps edited paragraphs and empty-hook fallback",
    edited.sections.a[0]?.paragraphs[0]?.includes("Frances edited") === true &&
      edited.sections.a[0]?.hook === firstDefault.hook
  );
  const extraPlaybook = resolvePlaybookPayload({
    chapters: [
      ...CHAPTERS.map((ch) => ({ id: ch.id, letter: ch.letter, title: ch.title, pages: ch.pages })),
      { id: "j", letter: "J", title: "New Chapter", pages: 10, sections: [] },
    ],
  });
  ok(
    "Playbook merge is not hardcoded to a fixed chapter count",
    extraPlaybook.chapters.some((ch) => ch.id === "j") && extraPlaybook.chapters.length === CHAPTERS.length + 1
  );
  ok(
    "Playbook chapters without a CMS status flag default by letter (A–E live, F+ releasing soon)",
    extraPlaybook.chapters.find((ch) => ch.id === "a")?.status === "live" &&
      extraPlaybook.chapters.find((ch) => ch.id === "j")?.status === "releasing-soon"
  );
  const publishedF = resolvePlaybookPayload({
    chapters: [{ id: "f", letter: "F", title: "Trade Finance", status: "live", sections: [] }],
  });
  ok(
    "Admin live flag publishes a letter-F chapter",
    publishedF.chapters[0]?.status === "live"
  );
  const soonEarly = resolvePlaybookPayload({
    chapters: [{ id: "a", letter: "A", title: "Draft", status: "releasing-soon", sections: [] }],
  });
  ok(
    "Admin can mark an early chapter releasing soon",
    soonEarly.chapters[0]?.status === "releasing-soon"
  );
  const unreleasedTakeaways = resolvePlaybookPayload({
    chapters: [
      {
        id: "f",
        letter: "F",
        title: "Trade Finance & Credit",
        status: "releasing-soon",
        keyTakeaways: ["Letters of credit move title and payment risk", ""],
        sections: [],
      },
    ],
  });
  ok(
    "CMS key takeaways persist on releasing-soon chapters",
    unreleasedTakeaways.chapters[0]?.status === "releasing-soon" &&
      unreleasedTakeaways.chapters[0]?.keyTakeaways?.includes(
        "Letters of credit move title and payment risk"
      ) === true
  );
  const extraLetter = resolvePlaybookPayload({
    chapters: [{ id: "k", letter: "K", title: "Future Chapter", sections: [] }],
  });
  ok(
    "Future unreleased chapters default to releasing-soon without a hardcoded letter list",
    extraLetter.chapters[0]?.letter === "K" && extraLetter.chapters[0]?.status === "releasing-soon"
  );
  ok(
    "Unreleased CMS chapters without color still resolve to brand navy for the chapter strip",
    extraLetter.chapters[0]?.color === PLAYBOOK_CHAPTER_FALLBACK_COLOR &&
      unreleasedTakeaways.chapters[0]?.color === PLAYBOOK_CHAPTER_FALLBACK_COLOR
  );
  ok(
    "Chapter hero color falls back to brand navy when CMS omits or blanks color",
    playbookChapterHeroColor({}) === PLAYBOOK_CHAPTER_FALLBACK_COLOR &&
      playbookChapterHeroColor({ color: "  " }) === PLAYBOOK_CHAPTER_FALLBACK_COLOR &&
      playbookChapterHeroColor({ color: "transparent" }) === PLAYBOOK_CHAPTER_FALLBACK_COLOR &&
      playbookChapterHeroColor({ color: "#3280ff" }) === "#3280ff"
  );
}

{
  const caseEditor =
    fs.readFileSync(path.join(process.cwd(), "src/app/admin/editors/case-studies-editor.tsx"), "utf8") +
    fs.readFileSync(
      path.join(process.cwd(), "src/app/admin/editors/case-study-section-editor.tsx"),
      "utf8"
    );
  ok(
    "Case studies admin reads payload.studies not a top-level array",
    caseEditor.includes("studies: Array.isArray(data.studies)") &&
      caseEditor.includes("onChange({ ...data, ...next })")
  );
  const caseClient = fs.readFileSync(
    path.join(process.cwd(), "src/app/case-studies/case-studies-client.tsx"),
    "utf8"
  );
  ok(
    "Case Studies blue hero strip is CMS-editable",
    caseEditor.includes("Page hero strip") &&
      caseEditor.includes("{studyCount}") &&
      caseClient.includes("formatCaseStudiesHeroCopy") &&
      !caseClient.includes("Elite · {studies.length}") &&
      mergeCaseStudiesHero({}).title === DEFAULT_CASE_STUDIES_HERO.title &&
      mergeCaseStudiesHero({ title: "  " }).title === DEFAULT_CASE_STUDIES_HERO.title &&
      mergeCaseStudiesHero({ title: "Custom cases" }).title === "Custom cases" &&
      formatCaseStudiesHeroCopy(DEFAULT_CASE_STUDIES_HERO.eyebrow, 12) === "ELITE · 12 STUDIES" &&
      formatCmsHeroCopy("ELITE · {studyCount} STUDIES", { studyCount: 2 }) === "ELITE · 2 STUDIES"
  );
  ok(
    "Case Studies hero keeps a separate disclaimer below the description",
    caseEditor.includes('label="Disclaimer"') &&
      caseClient.includes("hero.disclaimer") &&
      caseClient.includes("text-white/70") &&
      mergeCaseStudiesHero({}).disclaimer.includes("illustrative and hypothetical") &&
      mergeCaseStudiesHero({ disclaimer: "  " }).disclaimer.includes("illustrative") &&
      mergeCaseStudiesHero({ disclaimer: "Custom legal line." }).disclaimer === "Custom legal line." &&
      !mergeCaseStudiesHero({
        description:
          "Study with commercial reasoning. Disclaimer: Case studies are hypothetical unless stated otherwise.",
      }).description.includes("Disclaimer:") &&
      mergeCaseStudiesHero({
        description:
          "Study with commercial reasoning. Disclaimer: Case studies are hypothetical unless stated otherwise.",
      }).disclaimer.includes("hypothetical") &&
      formatCaseStudiesHeroCopy("Built by {brandName}", 1).includes("CommodityPlay")
  );
  const caseDetail = fs.readFileSync(
    path.join(process.cwd(), "src/app/case-studies/[slug]/case-study-detail-client.tsx"),
    "utf8"
  );
  const sourceParts = parseCaseStudyInline("Before the strikes {{CNBC}} and **Brent** moved.");
  const fiveStats = visibleCaseStudyStats([
    { value: "$72", label: "A" },
    { value: "+51%", label: "B" },
    { value: "10%", label: "C" },
    { value: "x", label: "D" },
    { value: "", label: "" },
  ]);
  const emptySection = normalizeCaseStudySection({
    id: "s",
    label: "01 · Setup",
    title: "Setup",
    paragraphs: ["Hello {{IEA}}"],
  });
  const richSection = normalizeCaseStudySection({
    id: "s2",
    label: "02",
    title: "Markets",
    paragraphs: ["Intro"],
    quote: "A pull quote",
    numberedPoints: [
      { lead: "The crude price", body: "Less oil. {{IEA}}" },
      { lead: "Freight", body: "Rates rise." },
    ],
    table: {
      headers: ["Market", "Before", "After"],
      rows: [["Brent", "$72", "$120"], ["", "", ""]],
    },
    callout: { kicker: "Reading order", items: ["Check insurance", "Watch freight"] },
    timeline: {
      kicker: "Timeline",
      events: [
        { date: "28 Feb", body: "Strikes begin", tone: "negative" },
        { date: "", body: "   ", tone: "neutral" },
      ],
    },
    lessons: [
      { title: "Chokepoints", body: "More than crude." },
      { title: "", body: "" },
    ],
    selfTest: {
      kicker: "Four questions",
      questions: [
        { question: "Why insurance first?", answer: "Threat pricing." },
        { question: "", answer: "" },
      ],
    },
    sources: [
      { name: "IEA", detail: "Oil Market Report" },
      { name: "", detail: "" },
    ],
    sourcesNote: "Figures as of the cited dates.",
  });
  ok(
    "Case study member hero uses CMS kicker, optional stats, and hides empty stats",
    caseDetail.includes("Back to Case Studies") &&
      caseDetail.includes("Case Study {displayNumber}") &&
      caseEditor.includes("Hero body") &&
      caseEditor.includes("Key stats") &&
      caseStudyDisplayNumber({}, 0) === 1 &&
      caseStudyDisplayNumber({ number: 12 }, 0) === 12 &&
      caseStudyDisplayNumber({ number: 0 }, 4) === 5 &&
      visibleCaseStudyStats([]).length === 0 &&
      visibleCaseStudyStats(undefined).length === 0 &&
      fiveStats.length === 4 &&
      normalizeCaseStudyCard({
        slug: "x",
        id: "01",
        category: "Risk",
        title: "T",
        catchLine: "",
        description: "",
        readMinutes: 1,
        status: "published",
        hasFullContent: true,
      }).showSidebar === false
  );
  ok(
    "Case study sources use {{marker}} italic-blue parsing without colliding with **bold**",
    formatCaseStudySourceLabel("IEA") === "(IEA)" &&
      formatCaseStudySourceLabel("(CNBC)") === "(CNBC)" &&
      sourceParts.some((p) => p.kind === "source" && p.text === "CNBC") &&
      sourceParts.some((p) => p.kind === "strong" && p.text === "Brent") &&
      caseEditor.includes("{{IEA}}") &&
      caseDetail.includes("CaseStudyInline")
  );
  ok(
    "Case study sidebar is off unless Frances opts in",
    shouldShowCaseStudySidebar(undefined) === false &&
      shouldShowCaseStudySidebar(false) === false &&
      shouldShowCaseStudySidebar(true) === true &&
      caseEditor.includes("Show “In this case study” sidebar") &&
      caseEditor.includes("leave unchecked (default)") &&
      caseEditor.includes("checked={item.showSidebar === true}") &&
      caseDetail.includes("In this case study")
  );
  const afterList = normalizeCaseStudySection({
    id: "s3",
    label: "02",
    title: "",
    paragraphs: [],
    blocks: [
      { id: "b1", kind: "title", text: "The mechanism" },
      { id: "b2", kind: "paragraph", text: "Intro" },
      { id: "b3", kind: "numberedPoints", points: [{ lead: "A", body: "B" }] },
      { id: "b4", kind: "paragraph", text: "After the list" },
    ],
  });
  const afterListKinds = visibleCaseStudyBlocks(afterList.blocks).map((b) => b.kind);
  ok(
    "Case study section blocks scale to N and hide when empty",
    !emptySection.quote &&
      !emptySection.numberedPoints &&
      !emptySection.table &&
      !emptySection.callout &&
      !emptySection.timeline &&
      !emptySection.lessons &&
      !emptySection.selfTest &&
      !emptySection.sources &&
      emptySection.paragraphs[0] === "Hello {{IEA}}" &&
      (emptySection.blocks ?? []).some((b) => b.kind === "title") &&
      (emptySection.blocks ?? []).some((b) => b.kind === "paragraph") &&
      richSection.quote === "A pull quote" &&
      visibleNumberedPoints(richSection.numberedPoints).length === 2 &&
      (visibleCaseStudyTable(richSection.table)?.headers.length ?? 0) === 3 &&
      visibleCaseStudyTable({ headers: [], rows: [] }) === null &&
      visibleCaseStudyTable({ headers: ["MARKET", "BEFORE"], rows: [["", ""]] }) === null &&
      (visibleCallout(richSection.callout)?.items.length ?? 0) === 2 &&
      visibleCallout({ kicker: "", items: [] }) === null &&
      (visibleTimeline(richSection.timeline)?.events.length ?? 0) === 1 &&
      visibleLessons(richSection.lessons).length === 1 &&
      (visibleSelfTest(richSection.selfTest)?.questions.length ?? 0) === 1 &&
      visibleSelfTest({ kicker: "", questions: [] }) === null &&
      visibleSources(richSection.sources).length === 1 &&
      Boolean(richSection.sourcesNote?.includes("cited dates")) &&
      afterListKinds.join(",") === "title,paragraph,numberedPoints,paragraph" &&
      caseEditor.includes("Numbered mechanism list") &&
      caseEditor.includes("Add paragraph") &&
      caseEditor.includes("Add list") &&
      caseEditor.includes("Data table") &&
      caseEditor.includes("Career Feature Comparison") &&
      caseEditor.includes("Optional — skip if this section is text only.") &&
      caseEditor.includes("Add column") &&
      caseEditor.includes("Add row") &&
      caseEditor.includes("Add feature row") &&
      caseEditor.includes('placeholder="Cell"') &&
      caseEditor.includes("gridTemplateColumns") &&
      caseEditor.includes('title="Delete row"') &&
      caseEditor.includes("smallButtonClass") &&
      !caseEditor.includes("<table className=") &&
      !caseEditor.includes("Reset empty table") &&
      caseEditor.includes("Navy callout") &&
      caseEditor.includes("Sourced timeline") &&
      caseEditor.includes("Key lesson cards") &&
      caseEditor.includes("Self-test") &&
      caseEditor.includes("Sources list") &&
      caseDetail.includes("visibleCaseStudyBlocks") &&
      caseDetail.includes("Reveal Answers") &&
      Array.isArray(resolveCaseStudiesPayload(undefined).studies)
  );
  ok(
    "Case study article sections are collapsible in admin (N sections)",
    caseEditor.includes("defaultOpen={si === sections.length - 1}") &&
      caseEditor.includes("sectionSummary") &&
      caseEditor.includes("ChevronDown") &&
      caseEditor.includes("block{blocks.length === 1 ? \"\" : \"s\"}")
  );
  ok(
    "Case study hero stats use light mint cards for N stats",
    caseDetail.includes("CASE_STUDY_HERO_STAT_BG") &&
      caseDetail.includes("auto-fit") &&
      caseDetail.includes("text-primary-800") &&
      CASE_STUDY_HERO_STAT_BG === "#F0FDF4" &&
      !caseDetail.includes("bg-white/5")
  );
  ok(
    "Case study hero category uses a light blue pill",
    caseDetail.includes("caseStudyCategoryHeroStyle") &&
      caseDetail.includes("backgroundColor: categoryStyle.bg") &&
      CASE_STUDY_CATEGORY_CAREER_HERO_STYLE.bg === "#dbeafe" &&
      caseStudyCategoryHeroStyle("Cross-Market Intelligence").text === "#2563eb" &&
      caseStudyCategoryHeroStyle("Sales", "sales").bg === CASE_STUDY_CATEGORY_SALES_STYLE.bg &&
      caseStudyCategoryPreviewStyle("Cross-Market", "sales").text === CASE_STUDY_CATEGORY_SALES_STYLE.text &&
      normalizeCaseStudyCard({ slug: "x", id: "1", category: "T", title: "T", catchLine: "", description: "", readMinutes: 1, status: "published", hasFullContent: true, track: "sales" }).track === "sales"
  );
  ok(
    "Case studies admin can reorder list and order drives case study numbers",
    caseEditor.includes("function moveItem") &&
      caseEditor.includes("onMoveUp={() => moveItem(i, -1)}") &&
      caseEditor.includes("caseStudyDisplayNumber(item, i)")
  );
  ok(
    "Case study detail footer links to previous study and full library",
    caseDetail.includes("CaseStudyFooterNav") &&
      caseDetail.includes("previousStudy") &&
      fs.readFileSync(
        path.join(process.cwd(), "src/components/case-studies/case-study-footer-nav.tsx"),
        "utf8"
      ).includes("Back to the full library") &&
      caseStudyPreviousPeer(
        [
          { slug: "a", title: "A", status: "published" } as never,
          { slug: "b", title: "B", status: "published" } as never,
          { slug: "c", title: "C", status: "coming-soon" } as never,
        ],
        "b"
      )?.slug === "a" &&
      caseStudyPreviousPeer(
        [{ slug: "a", title: "A", status: "published" } as never],
        "a"
      ) === null
  );
  ok(
    "Coming-soon case studies show as coming soon on list and hide full breakdown",
    caseClient.includes("isCaseStudyComingSoon") &&
      caseClient.includes("Coming soon") &&
      caseClient.includes("if (comingSoon)") &&
      caseDetail.includes("isCaseStudyComingSoon") &&
      normalizeCaseStudyCard({
        slug: "x",
        id: "1",
        category: "Test",
        title: "T",
        catchLine: "",
        description: "",
        readMinutes: 1,
        status: "coming-soon",
        hasFullContent: true,
      }).hasFullContent === false &&
      isCaseStudyComingSoon({ status: "coming-soon" }) &&
      isCaseStudyPublished({ status: "published" })
  );
  const jobHeroEditor = fs.readFileSync(
    path.join(process.cwd(), "src/app/admin/editors/job-openings-editor.tsx"),
    "utf8"
  );
  const jobHeroClient = fs.readFileSync(
    path.join(process.cwd(), "src/app/job-openings/job-openings-client.tsx"),
    "utf8"
  );
  ok(
    "Job Openings navy strip has a Case Studies-style disclaimer at the bottom",
    jobHeroEditor.includes('label="Disclaimer"') &&
      jobHeroClient.includes("hero.disclaimer") &&
      jobHeroClient.includes("text-white/70") &&
      mergeJobOpeningsHero({}).disclaimer === DEFAULT_JOB_OPENINGS_DISCLAIMER &&
      mergeJobOpeningsHero({ disclaimer: "Custom note." }).disclaimer === "Custom note." &&
      !mergeJobOpeningsHero({
        description:
          "Only 3 questions per chat for Elite Members. Note: The live chat does not guarantee a job advancement.",
      }).description.includes("Note:") &&
      mergeJobOpeningsHero({
        description:
          "Only 3 questions per chat for Elite Members. Note: The live chat does not guarantee a job advancement.",
      }).disclaimer.includes("does not guarantee")
  );
  const jobChatApi = fs.readFileSync(path.join(process.cwd(), "src/app/api/job-chat/route.ts"), "utf8");
  const jobChatPanel = fs.readFileSync(
    path.join(process.cwd(), "src/components/job-openings/job-live-chat-panel.tsx"),
    "utf8"
  );
  const emailsApi = fs.readFileSync(path.join(process.cwd(), "src/app/api/admin/emails/route.ts"), "utf8");
  const seedHirer = JOB_OPENINGS[0]!;
  const editedFromTemplate = withHirerFallback(
    {
      ...seedHirer,
      title: "Senior Sales Specialist (Genfuels)",
      company: "Argus",
      hirerEmail: "frances.hirer@example.com",
      hirerName: "Frances Test",
    },
    seedHirer
  );
  const editedBlankHirer = withHirerFallback(
    { ...seedHirer, title: "Senior Sales Specialist (Genfuels)", company: "Argus", hirerEmail: "", hirerName: "" },
    seedHirer
  );
  const editedEmailOnly = withHirerFallback(
    {
      ...seedHirer,
      title: "Senior Sales Specialist (Genfuels)",
      company: "Argus",
      hirerEmail: "frances.hirer@example.com",
      hirerName: "",
    },
    seedHirer
  );
  const demoEmailLogSrc = fs.readFileSync(path.join(process.cwd(), "src/lib/demo-email-log.ts"), "utf8");
  const candidateUrlThenHirer =
    "Question 1 of 3:\nSee https://evil.example/phish\n\nReply here: https://app.example.com/job-chat/respond/abc123";
  ok(
    "Job live chat retest: reset this thread, copy hirer reply link, CMS hirer not stale template",
    MAX_JOB_CHAT_EXCHANGES === 3 &&
      jobChatApi.includes("export async function DELETE") &&
      jobChatApi.includes("hirerRespondUrl") &&
      jobChatApi.includes("listingHirer") &&
      jobChatApi.includes("userId: session.user.id, jobId") &&
      jobChatPanel.includes("Reset this chat") &&
      jobChatPanel.includes("Copy hirer reply link") &&
      jobHeroEditor.includes("Live chat testing") &&
      emailsApi.includes("hirerReplyUrl") &&
      demoEmailLogSrc.includes("isLiveChatLog") &&
      demoEmailLogSrc.includes("extractHirerReplyUrlFromLog") &&
      extractHirerReplyUrlFromLog(
        "Hirer reply link (demo testing only): https://app.example.com/job-chat/respond/abc123"
      ) === "https://app.example.com/job-chat/respond/abc123" &&
      extractHirerReplyUrlFromLog(candidateUrlThenHirer) ===
        "https://app.example.com/job-chat/respond/abc123" &&
      editedFromTemplate.hirerEmail === "frances.hirer@example.com" &&
      editedFromTemplate.hirerName === "Frances Test" &&
      editedEmailOnly.hirerEmail === "frances.hirer@example.com" &&
      !editedEmailOnly.hirerName &&
      !editedBlankHirer.hirerEmail &&
      withHirerFallback(seedHirer, seedHirer).hirerEmail === seedHirer.hirerEmail
  );
  ok(
    "Career Intelligence on the career landing uses bg-primary-soft, not sales mint",
    fs
      .readFileSync(path.join(process.cwd(), "src/components/landing/landing-page-client.tsx"), "utf8")
      .includes('sectionClassName="bg-primary-soft"') &&
      fs
        .readFileSync(path.join(process.cwd(), "src/components/landing/market-note-strip.tsx"), "utf8")
        .includes("sectionClassName") &&
      !fs
        .readFileSync(path.join(process.cwd(), "src/components/landing/landing-page-client.tsx"), "utf8")
        .includes("SALES_SECTION_MINT")
  );
  const adminPayload = fs.readFileSync(
    path.join(process.cwd(), "src/lib/content/admin-payload.ts"),
    "utf8"
  );
  ok(
    "Admin payload merge fills case-studies from repo defaults",
    adminPayload.includes('slug === "case-studies"') && adminPayload.includes("CASE_STUDIES")
  );
  ok(
    "Admin payload merge fills playbook section bodies from repo",
    adminPayload.includes('slug === "playbook"') && adminPayload.includes("resolvePlaybookPayload")
  );

  const seededResume = buildDefaultResumeAdminPayload();
  const sparseQuiz = resolveEditorResumePayload({
    quiz: [
      {
        id: "background",
        question: "What best describes your current background?",
        options: [{ id: "o1", label: "Banking", value: "switcher" }],
      },
    ],
  });
  ok(
    "Resume admin quiz merge seeds all default questions when CMS only has a stub",
    (sparseQuiz.quiz?.length ?? 0) >= PERSONA_QUIZ_STEPS.length &&
      sparseQuiz.quiz?.some((q) => q.question === "What best describes your current background?") === true &&
      PERSONA_QUIZ_STEPS.every((step) => sparseQuiz.quiz?.some((q) => q.id === step.id))
  );
  const editedQ1 = resolveEditorResumePayload({
    quiz: [
      { id: "q1", question: "Frances edited Q1", options: [{ id: "a", label: "A", value: "switcher" }] },
      { id: "extra", question: "Sixth question Frances added", options: [] },
    ],
  });
  ok(
    "Resume quiz merge keeps Q1 edits and extra questions beyond the default five",
    editedQ1.quiz?.some((q) => q.question === "Frances edited Q1") === true &&
      editedQ1.quiz?.some((q) => q.id === "extra") === true &&
      (editedQ1.quiz?.length ?? 0) > PERSONA_QUIZ_STEPS.length
  );
  const sixPersonas = resolveEditorResumePayload({
    personas: [
      ...(seededResume.personas ?? []),
      { id: "quant", name: "The Quant", label: "Extra path", desc: "Added by Frances" },
    ],
  });
  const vettingOpts = resumeVettingArchetypeOptions(sixPersonas.personas);
  ok(
    "Resume vetting archetype options come from merged CMS personas (N, not hardcoded to 5)",
    vettingOpts.length === (sixPersonas.personas?.length ?? 0) &&
      vettingOpts.length > 5 &&
      vettingOpts.some((o) => o.value === "quant") &&
      fs
        .readFileSync(path.join(process.cwd(), "src/app/resume-templates/resume-templates-client.tsx"), "utf8")
        .includes("resumeVettingArchetypeOptions") &&
      !fs
        .readFileSync(path.join(process.cwd(), "src/app/resume-templates/resume-templates-client.tsx"), "utf8")
        .includes("RESUME_VETTING_ARCHETYPE_OPTIONS")
  );
  ok(
    "Sparse CMS quiz list is filled from repo defaults without wiping later questions she adds",
    mergeResumeAdminQuiz(
      [{ id: "q1", question: "Edited", options: [] }],
      (seededResume.quiz ?? []).map((q) => ({ ...q, options: [...q.options] }))
    ).length === (seededResume.quiz?.length ?? 0)
  );

  const nudgesSection = fs.readFileSync(
    path.join(process.cwd(), "src/components/dashboard/sales-market-nudges-section.tsx"),
    "utf8"
  );
  ok(
    "Sales nudges member page filters by category and personal status",
    nudgesSection.includes("categoryFilter") &&
      nudgesSection.includes("statusFilter") &&
      nudgesSection.includes("Filter briefs by category")
  );
  const nudgesEditor = fs.readFileSync(
    path.join(process.cwd(), "src/app/admin/editors/sales-market-nudges-editor.tsx"),
    "utf8"
  );
  ok(
    "Admin Sales Nudges can manage brief categories",
    nudgesEditor.includes("Brief categories") && nudgesEditor.includes("briefCategories")
  );
  ok(
    "Weekly and briefs headings are CMS-editable",
    nudgesEditor.includes("weeklyHeading") &&
      nudgesEditor.includes("briefsHeading") &&
      nudgesSection.includes("content.weeklyHeading") &&
      nudgesSection.includes("content.briefsHeading") &&
      DEFAULT_SALES_MARKET_NUDGES_CONTENT.weeklyHeading === "This Week — Sales Nudges" &&
      DEFAULT_SALES_MARKET_NUDGES_CONTENT.briefsHeading === "Talking Points" &&
      !nudgesSection.includes("Intelligence Briefs") &&
      !nudgesSection.includes("This Week — Market Nudges")
  );
  ok(
    "Member briefs use card date helper, not Updated Mon",
    nudgesSection.includes("formatBriefCardDate") &&
      !nudgesSection.includes("updatedLabel") &&
      nudgesEditor.includes('type="date"')
  );

  ok(
    "Brief filter chips use short month (Aug 2026)",
    formatBriefPeriodLabel(8, 2026) === "Aug 2026" &&
      formatBriefPeriodLabel(7, 2026) === "Jul 2026" &&
      groupBriefsByMonthYear(DEFAULT_SALES_MARKET_NUDGES_CONTENT.intelligenceBriefs)[0]
        ?.label === "Aug 2026"
  );
  ok(
    "Brief card date formats as day + short month (3 Aug)",
    formatBriefUpdatedAt("2026-08-03") === "3 Aug" &&
      formatBriefUpdatedAt(undefined) === null &&
      formatBriefCardDate({ month: 8, year: 2026 }) === "3 Aug" &&
      formatBriefCardDate({ updatedAt: "2026-09-03", month: 8, year: 2026 }) === "3 Sep" &&
      formatBriefUpdatedAt("2026-09-03") === "3 Sep" &&
      DEFAULT_SALES_MARKET_NUDGES_CONTENT.intelligenceBriefs.every((b) => Boolean(b.updatedAt))
  );
  ok(
    "Legacy CMS without headings and blank headings still save and default",
    parseSalesMarketNudgesPayload(DEFAULT_SALES_MARKET_NUDGES_CONTENT).success &&
      parseSalesMarketNudgesPayload({
        ...DEFAULT_SALES_MARKET_NUDGES_CONTENT,
        weeklyHeading: "",
        briefsHeading: "",
      }).success &&
      normalizeSalesMarketNudgesPayload({
        eyebrow: "SALES MARKET NUDGES",
        title: DEFAULT_SALES_MARKET_NUDGES_CONTENT.title,
        description: DEFAULT_SALES_MARKET_NUDGES_CONTENT.description,
        weeklyNudges: DEFAULT_SALES_MARKET_NUDGES_CONTENT.weeklyNudges,
        intelligenceBriefs: DEFAULT_SALES_MARKET_NUDGES_CONTENT.intelligenceBriefs,
      }).weeklyHeading === "This Week — Sales Nudges" &&
      normalizeSalesMarketNudgesPayload({
        ...DEFAULT_SALES_MARKET_NUDGES_CONTENT,
        weeklyHeading: "   ",
        briefsHeading: "",
      }).briefsHeading === "Talking Points"
  );

  // ── Inline bold (**phrase**) — render-time only, markers stay in storage ──
  const inlineBoldModule = fs.readFileSync(
    path.join(process.cwd(), "src/lib/inline-bold.tsx"),
    "utf8"
  );
  const multiPair = parseInlineBold("**a** and **b**");
  ok(
    "Inline bold parses a **pair** into a bold run between plain runs",
    JSON.stringify(parseInlineBold("a **b** c")) ===
      JSON.stringify([
        { text: "a ", bold: false },
        { text: "b", bold: true },
        { text: " c", bold: false },
      ]) &&
      JSON.stringify(parseInlineBold("**b**")) ===
        JSON.stringify([{ text: "b", bold: true }]) &&
      multiPair.filter((s) => s.bold).length === 2 &&
      multiPair.length >= 3
  );
  ok(
    "Inline bold leaves unmatched / empty / newline markers literal",
    JSON.stringify(parseInlineBold("**b")) ===
      JSON.stringify([{ text: "**b", bold: false }]) &&
      JSON.stringify(parseInlineBold("****")) ===
        JSON.stringify([{ text: "****", bold: false }]) &&
      JSON.stringify(parseInlineBold("**a\nb**")) ===
        JSON.stringify([{ text: "**a\nb**", bold: false }]) &&
      JSON.stringify(parseInlineBold("plain text")) ===
        JSON.stringify([{ text: "plain text", bold: false }]) &&
      parseInlineBold("**a****b**").filter((s) => s.bold).length === 2 &&
      parseInlineBold("**a****b**").every((s) => s.text.length > 0)
  );
  ok(
    "Inline bold never drops characters (round-trip on unmatched input)",
    ["plain text", "**b", "****", "**a\nb**", "a * b ** c", "no markers here"].every(
      (input) => parseInlineBold(input).map((s) => s.text).join("") === input
    )
  );
  ok(
    "Inline bold helper is server-safe and never uses dangerouslySetInnerHTML",
    !inlineBoldModule.trimStart().startsWith('"use client"') &&
      !inlineBoldModule.includes('"use client";') &&
      !inlineBoldModule.includes("dangerouslySetInnerHTML=") &&
      inlineBoldModule.includes("export function parseInlineBold") &&
      inlineBoldModule.includes("export function renderInlineBold")
  );
  ok(
    "Member Sales Nudges page renders inline bold on the discovery cells",
    nudgesSection.includes("renderInlineBold") &&
      nudgesSection.includes("renderInlineBold(row.ask)") &&
      nudgesSection.includes("renderInlineBold(row.listenFor)") &&
      nudgesSection.includes("renderInlineBold(row.offer)") &&
      nudgesSection.includes("renderInlineBold(brief.description)") &&
      // `whyNow` moved from the single inline span to the multiline renderer (bullets,
      // owner request). The renderer feeds every line back through `renderInlineBold`,
      // so bold still applies — see the "renderMultilineText keeps **bold**" check.
      nudgesSection.includes("renderMultilineText(nudge.whyNow)") &&
      nudgesSection.includes("renderInlineBold(nudge.accountAction)")
  );
  ok(
    "Member Sales Nudges page leaves data keys (category, account names, titles) un-bolded",
    nudgesSection.includes("{brief.category}") &&
      nudgesSection.includes("nudge.accountNames.join") &&
      !nudgesSection.includes("renderInlineBold(brief.category)") &&
      !nudgesSection.includes("renderInlineBold(nudge.accountNames") &&
      !nudgesSection.includes("renderInlineBold(brief.title)") &&
      !nudgesSection.includes("renderInlineBold(nudge.title)")
  );
  ok(
    "Admin Sales Nudges editor shows a live inline-bold preview",
    nudgesEditor.includes("InlineBoldPreview") &&
      nudgesEditor.includes("renderInlineBold") &&
      nudgesEditor.includes("**double asterisks**")
  );
}

// ── Mentor reward ladder (answered questions → CMS rungs) ───────────────────
{
  const defaults = mergeMentorRewardRungs(null);
  ok(
    "Default mentor reward rungs are 50/100/150/200/250 with $160 at 250",
    defaults.length === 5 &&
      defaults[0]?.minQuestions === 50 &&
      defaults[4]?.minQuestions === 250 &&
      defaults[4]?.reward === "$160"
  );
  ok(
    "CMS can add N reward rungs, not hardcoded to five",
    mergeMentorRewardRungs([
      { id: "a", minQuestions: 25, label: "25 questions", reward: "Sticker" },
      { id: "b", minQuestions: 75, label: "75 questions", reward: "Lunch" },
      { id: "c", minQuestions: 125, label: "125 questions", reward: "Voucher" },
    ]).length === 3
  );
  ok(
    "Reward progress counts answered questions toward the next rung",
    computeMentorRewardProgress(0, defaults).nextRung?.minQuestions === 50 &&
      computeMentorRewardProgress(49, defaults).unlockedRung === null &&
      computeMentorRewardProgress(50, defaults).unlockedRung?.minQuestions === 50 &&
      computeMentorRewardProgress(250, defaults).unlockedRung?.reward === "$160" &&
      computeMentorRewardProgress(250, defaults).nextRung === null
  );
  const legacy = normalizeMentorConnectPayload({});
  ok(
    "Legacy mentor-connect CMS without rewardLadder still merges defaults",
    legacy.rewardLadder.rungs.length === 5 &&
      mergeMentorRewardLadder({ rungs: [] }).rungs.length === 5
  );
  const mentorEditor = fs.readFileSync(
    path.join(process.cwd(), "src/app/admin/editors/mentor-connect-editor.tsx"),
    "utf8"
  );
  const mentorInbox = fs.readFileSync(
    path.join(process.cwd(), "src/app/mentor-connect/inbox/mentor-inbox-client.tsx"),
    "utf8"
  );
  const adminClient = fs.readFileSync(
    path.join(process.cwd(), "src/app/admin/admin-client.tsx"),
    "utf8"
  );
  ok(
    "Frances edits reward rungs in Mentor Connect CMS; admin Mentors tab and inbox show progress",
    mentorEditor.includes("Mentor reward ladder") &&
      mentorEditor.includes("minQuestions") &&
      mentorEditor.includes("no Stripe") &&
      mentorInbox.includes("MentorRewardProgressDisplay") &&
      adminClient.includes("Reward ladder") &&
      adminClient.includes("MentorRewardProgressDisplay")
  );
}

// ── Paid PDF watermark policy ──────────────────────────────────────────────
{
  const member = { name: "Sarah Wong", email: "pro.switcher@demo.com" };
  ok(
    "Paid Pro PDF is watermarked for a signed-in member",
    shouldWatermarkPaidPdf({
      fileName: "career-navigation-guide.pdf",
      mimeType: "application/pdf",
      requiredTier: "PRO",
      isPublicUnpaid: false,
      byteLength: 1024,
      member,
    })
  );
  ok(
    "Starter / public PDFs are not watermarked",
    !shouldWatermarkPaidPdf({
      fileName: "career-guide.pdf",
      mimeType: "application/pdf",
      requiredTier: "STARTER",
      isPublicUnpaid: true,
      byteLength: 1024,
      member,
    })
  );
  const line = formatMemberWatermarkLine(member, new Date("2026-09-10T00:00:00.000Z"));
  ok(
    "Watermark line includes member identity",
    line.includes("Sarah Wong") && line.includes("pro.switcher@demo.com") && line.includes("2026-09-10")
  );
  ok(
    "Watermark text is WinAnsi-safe",
    sanitizeWatermarkText("Priya Sharma café").includes("Priya Sharma")
  );
  ok("PDF footer copy is Copyright reserved", PDF_COPYRIGHT_FOOTER === "Copyright reserved");
  ok(
    "Starter PDF still gets a copyright footer",
    shouldStampPdfFooter({
      fileName: "career-guide.pdf",
      mimeType: "application/pdf",
      byteLength: 1024,
    }) &&
      !shouldWatermarkPaidPdf({
        fileName: "career-guide.pdf",
        mimeType: "application/pdf",
        requiredTier: "STARTER",
        isPublicUnpaid: true,
        byteLength: 1024,
        member,
      })
  );
  ok(
    "Oversized PDFs skip stamping",
    !shouldStampPdfFooter({
      fileName: "huge.pdf",
      mimeType: "application/pdf",
      byteLength: 13 * 1024 * 1024,
    })
  );
  const stampSource = fs.readFileSync(
    path.join(process.cwd(), "src/lib/content/pdf-watermark.ts"),
    "utf8"
  );
  ok(
    "PDF stamp stays in the footer (no center diagonal)",
    !stampSource.includes("degrees(") && !stampSource.includes("rotate:")
  );
}

async function verifyPdfStampWrites() {
  const blank = await PDFDocument.create();
  blank.addPage();
  const raw = new Uint8Array(await blank.save());
  const copyrightOnly = await stampPaidPdfWatermark(
    raw,
    { name: null, email: null },
    new Date("2026-09-10T00:00:00.000Z"),
    { includeLicense: false }
  );
  ok(
    "Copyright-only stamp writes a new PDF",
    copyrightOnly.byteLength > 0 && copyrightOnly.byteLength !== raw.byteLength
  );
  const licensed = await stampPaidPdfWatermark(raw, {
    name: "Sarah Wong",
    email: "pro.switcher@demo.com",
  });
  ok(
    "Paid stamp is larger than copyright-only",
    licensed.byteLength > copyrightOnly.byteLength
  );
}

{
  ok(
    "Payment gateway stays closed unless NEXT_PUBLIC_PAYMENTS_ENABLED=true",
    isPaymentsLive() === (process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === "true")
  );
}

{
  ok("Interview date formats as day + short month + year", formatInterviewMemberDate("2026-09-08") === "8 Sep 2026");
  ok("Invalid interview dates do not throw", parseIsoDateOnly("not-a-date") === null && formatInterviewMemberDate(undefined) === null);
  ok(
    "Undated interview questions have no freshness badge",
    getQuestionFreshnessBadge({}, new Date("2026-09-14")) === null
  );
  ok(
    "Added within 30 days is New, not Revisit",
    getQuestionFreshnessBadge({ addedAt: "2026-09-01", updatedAt: "2026-09-10" }, new Date("2026-09-14")) === "new"
  );
  ok(
    "Updated but not newly added is Revisit",
    getQuestionFreshnessBadge({ addedAt: "2026-01-01", updatedAt: "2026-09-01" }, new Date("2026-09-14")) === "revisit"
  );
  ok(
    "New-this-month counts calendar month adds",
    countNewThisMonth([{ addedAt: "2026-09-08" }, { addedAt: "2026-08-01" }], new Date("2026-09-14")) === 1
  );

  const pod = selectCurrentMarketQuestions(INTERVIEW_QUESTIONS, new Date("2026-09-14"));
  ok("Current Market pod has 3 commercial questions", pod.length === 3 && pod.every((q) => q.tab === "commercial"));
  ok(
    "Flagged current-market questions fill the pod",
    pod.every((q) => q.currentMarket) && pod.some((q) => q.id === "iv-c-cm-01")
  );
  ok("Bank last refreshed uses latest ISO date", getBankLastRefreshedIso(INTERVIEW_QUESTIONS) === "2026-09-08");

  const extraFlagged = INTERVIEW_QUESTIONS.filter((q) => q.tab === "commercial").slice(0, 5).map((q, i) => ({
    ...q,
    currentMarket: true,
    id: `rot-${i}`,
  }));
  const sept = selectCurrentMarketQuestions(extraFlagged, new Date("2026-09-01")).map((q) => q.id).join(",");
  const oct = selectCurrentMarketQuestions(extraFlagged, new Date("2026-10-01")).map((q) => q.id).join(",");
  ok("Current Market pod rotates by calendar month when more than 3 are flagged", sept !== oct && sept.split(",").length === 3);

  const clientSrc = fs.readFileSync(
    path.join(__dirname, "../src/app/interview-questions/interview-questions-client.tsx"),
    "utf8"
  );
  ok(
    "Member interview page does not ship mockup simulate/reset controls",
    !clientSrc.includes("Simulate") && !clientSrc.includes("Reset to today")
  );
}

{
  ok("15 Sep 2026 formats without a leading zero on the day", formatInterviewMemberDate("2026-09-15") === "15 Sep 2026");
  ok(
    "Month-year desk dates parse to the 1st",
    toIsoFromFlexibleDate("May 2025") === "2025-05-01" && parseFlexibleCalendarDate("Apr 2025")?.getMonth() === 3
  );

  const deskNow = new Date("2026-09-15T12:00:00");
  const deskFresh = getDeskLibraryFreshness(DESK_QA, undefined, deskNow);
  const hydrated = hydrateDeskQaDates(DESK_QA);
  ok(
    "Desk Channel defaults hydrate addedAt from legacy month-year dates",
    hydrated.every((q) => Boolean(q.addedAt)) && hydrated.length === DESK_QA.length
  );
  ok(
    "Desk Channel freshness uses live question count, not a hardcoded 40/66",
    deskFresh.total === DESK_QA.length && deskFresh.total > 0
  );
  ok(
    "Desk Channel last refreshed is a member date, not blank",
    Boolean(deskFresh.lastRefreshedLabel) && deskFresh.lastRefreshedLabel !== "—"
  );
  ok(
    "Desk Channel new-this-month is derived from dates (Sep 2026 sample bank is not all-new)",
    deskFresh.newThisMonth ===
      hydrated.filter((q) => q.addedAt && q.addedAt.startsWith("2026-09")).length
  );

  const fiveNotes = Array.from({ length: 5 }, (_, i) => `Note ${i + 1}`);
  ok("Prep library notes are not capped at 3 or 4", KEY_POINTS_MAX >= 5 && fiveNotes.length === 5);

  const prepUi = fs.readFileSync(
    path.join(process.cwd(), "src/components/dashboard/prep-library-section.tsx"),
    "utf8"
  );
  const prepPatch = fs.readFileSync(
    path.join(process.cwd(), "src/app/api/prep-library/[id]/route.ts"),
    "utf8"
  );
  const prepCreate = fs.readFileSync(
    path.join(process.cwd(), "src/app/api/prep-library/route.ts"),
    "utf8"
  );
  ok(
    "Career and Sales prep cards can edit notes without dropping delete",
    prepUi.includes("Edit talking point") &&
      prepUi.includes("Delete talking point") &&
      prepUi.includes("TalkingPointEditor") &&
      prepUi.includes("handleUpdate") &&
      prepUi.includes('track="CAREER"') &&
      prepUi.includes('track="SALES"') &&
      prepUi.includes("KEY_POINTS_MAX")
  );
  ok(
    "Prep library PATCH persists title, notes, and chips",
    prepPatch.includes("keyPoints") &&
      prepPatch.includes("title") &&
      prepPatch.includes("category") &&
      prepPatch.includes("serializeTalkingPoint")
  );
  ok(
    "Prep library create accepts more than 4 notes",
    prepCreate.includes("KEY_POINTS_MAX") && !prepCreate.includes(".max(4)")
  );

  const deskClient = fs.readFileSync(
    path.join(process.cwd(), "src/app/desk-channel/desk-channel-client.tsx"),
    "utf8"
  );
  const deskEditor = fs.readFileSync(
    path.join(process.cwd(), "src/app/admin/editors/desk-channel-editor.tsx"),
    "utf8"
  );
  const freshnessStrip = fs.readFileSync(
    path.join(process.cwd(), "src/components/library-freshness-strip.tsx"),
    "utf8"
  );
  const mobileDesk = fs.readFileSync(
    path.join(process.cwd(), "mobile/app/community/desk-channel.tsx"),
    "utf8"
  );
  ok(
    "Desk Channel reuses the Interview bank freshness strip under the hero",
    deskClient.includes("LibraryFreshnessStrip") &&
      deskClient.includes("getDeskLibraryFreshness") &&
      freshnessStrip.includes("Bank last refreshed") &&
      freshnessStrip.includes("questions total")
  );
  ok(
    "Desk Channel CMS can set added/updated dates and last-refreshed override",
    deskEditor.includes("Added date") &&
      deskEditor.includes("Updated date") &&
      deskEditor.includes("Bank last refreshed") &&
      deskEditor.includes("addedAt")
  );
  ok(
    "Mobile Desk Channel shows the same freshness counts from the API",
    mobileDesk.includes("Bank last refreshed") && mobileDesk.includes("questions total")
  );
  ok(
    "Desk Channel admin can add categories beyond the five seed desks",
    deskEditor.includes("Add category") &&
      deskEditor.includes("slugifyDeskCategoryId") &&
      !deskEditor.includes('type DeskCategory = "trading"')
  );
  const sixCats = mergeDeskCategories(
    [
      ...["trading", "ops", "risk", "tools", "career"].map((id) => ({
        id,
        label: id,
        color: "#3280ff",
        count: 0,
      })),
      { id: "lng", label: "LNG & Shipping", color: "#0F766E", count: 0 },
    ],
    [{ ...DESK_QA[0], category: "lng", categoryLabel: "LNG & Shipping", categoryColor: "#0F766E" }]
  );
  ok(
    "Desk Channel category merge scales past five and keeps All Questions",
    sixCats.filter((c) => c.id !== "all").length === 6 &&
      sixCats[0]?.id === "all" &&
      sixCats.some((c) => c.id === "lng" && c.count === 1)
  );
  ok(
    "Desk Channel category ids stay unique when adding another New category",
    slugifyDeskCategoryId("New category", ["new-category"]) === "new-category-2"
  );
}

{
  const knowledgeClient = fs.readFileSync(
    path.join(process.cwd(), "src/app/knowledge-test/knowledge-test-client.tsx"),
    "utf8"
  );
  const knowledgeEditor = fs.readFileSync(
    path.join(process.cwd(), "src/app/admin/editors/knowledge-test-editor.tsx"),
    "utf8"
  );
  const interviewClient = fs.readFileSync(
    path.join(process.cwd(), "src/app/interview-questions/interview-questions-client.tsx"),
    "utf8"
  );
  const interviewEditor = fs.readFileSync(
    path.join(process.cwd(), "src/app/admin/editors/interview-editor.tsx"),
    "utf8"
  );
  ok(
    "Knowledge Test hero is CMS-backed with default merge",
    knowledgeClient.includes("formatKnowledgeTestHeroCopy") &&
      knowledgeEditor.includes("Page hero strip") &&
      mergeKnowledgeTestHero({}).title === DEFAULT_KNOWLEDGE_TEST_HERO.title &&
      mergeKnowledgeTestHero({ title: "  " }).title === DEFAULT_KNOWLEDGE_TEST_HERO.title &&
      mergeKnowledgeTestHero({ title: "Custom KT" }).title === "Custom KT" &&
      formatKnowledgeTestHeroCopy(DEFAULT_KNOWLEDGE_TEST_HERO.eyebrow, {
        questionCount: 20,
        activeSetLabel: "Default bank",
      }).includes("20") &&
      normalizeKnowledgeTestPayload({}).hero?.title === DEFAULT_KNOWLEDGE_TEST_HERO.title
  );
  {
    const q = [
      { id: "1", question: "Q", options: ["a", "b", "c", "d"], correctIndex: 0, explanation: "e", topic: "t" },
    ];
    const legacy = normalizeKnowledgeTestPayload({
      testSets: [
        { id: "a", label: "A", questions: q },
        { id: "b", label: "B", questions: q },
      ],
      activeTestSetId: "b",
    });
    const liveLegacy = getLiveKnowledgeTestSets(legacy);
    ok(
      "Legacy activeTestSetId still selects a single live bank",
      liveLegacy.length === 1 && liveLegacy[0]?.id === "b"
    );
    const multi = getLiveKnowledgeTestSets({
      testSets: [
        { id: "a", label: "A", questions: q, published: true },
        { id: "b", label: "B", questions: q, published: true },
        { id: "c", label: "C", questions: q, published: false },
      ],
      activeTestSetId: "a",
    });
    ok(
      "Frances can publish several knowledge test banks at once",
      multi.map((s) => s.id).join(",") === "a,b"
    );
  }
  ok(
    "Knowledge Test member UI and admin support multiple published sets",
    knowledgeClient.includes("liveSets") &&
      knowledgeClient.includes("Continue with another set") &&
      knowledgeEditor.includes("Publish as many banks") &&
      knowledgeEditor.includes("setPublished")
  );
  ok(
    "Interview Questions hero is CMS-backed with default merge",
    interviewClient.includes("formatInterviewHeroCopy") &&
      interviewEditor.includes("Page hero strip") &&
      interviewEditor.includes("Added date") &&
      interviewEditor.includes("Current market") &&
      interviewEditor.includes("Bank last refreshed") &&
      (interviewClient.includes("new this month") || interviewClient.includes("LibraryFreshnessStrip")) &&
      mergeInterviewQuestionsHero({}).title === DEFAULT_INTERVIEW_QUESTIONS_HERO.title &&
      mergeInterviewQuestionsHero({ description: "" }).description ===
        DEFAULT_INTERVIEW_QUESTIONS_HERO.description &&
      formatInterviewHeroCopy(DEFAULT_INTERVIEW_QUESTIONS_HERO.eyebrow, 50).includes("50")
  );

  const dashboardClient = fs.readFileSync(
    path.join(process.cwd(), "src/app/dashboard/dashboard-client.tsx"),
    "utf8"
  );
  const dashboardEditor = fs.readFileSync(
    path.join(process.cwd(), "src/app/admin/editors/member-dashboard-editor.tsx"),
    "utf8"
  );
  const sorted = partitionAccessibleFirst(
    [
      { id: "locked-elite", accessible: false },
      { id: "open-playbook", accessible: true },
      { id: "coming-soon", accessible: false },
      { id: "open-nudges", accessible: true },
    ],
    (item) => item.accessible
  );
  ok(
    "Dashboard sorts accessible cards before locked/coming-soon",
    sorted.map((c) => c.id).join(",") === "open-playbook,open-nudges,locked-elite,coming-soon" &&
      dashboardClient.includes("partitionAccessibleFirst") &&
      dashboardClient.includes("bg-gray-50") &&
      isDashboardCardAccessible({ unlocked: true }) === true &&
      isDashboardCardAccessible({ unlocked: true, pendingLabel: "Coming soon" }) === false &&
      isDashboardCardAccessible({ unlocked: false }) === false
  );
  ok(
    "Sales vs Career dashboard visibility is unchanged by card sort",
    isDashboardModuleVisible("Sales", "SALES") &&
      !isDashboardModuleVisible("Career", "SALES") &&
      isDashboardModuleVisible("Both", "SALES")
  );
  ok(
    "Member dashboard renders CMS titles from the unified resourceCards list",
    dashboardClient.includes("resolveResourceCardTitle") &&
      dashboardClient.includes("visibleResourceCards") &&
      dashboardClient.includes("filterByDashboardAudience(dashboardContent.resourceCards") &&
      !dashboardClient.includes("showSalesTrackCards") &&
      !dashboardClient.includes("visibleSalesCards")
  );
  ok(
    "Admin Member Dashboard CMS edits titles and Career/Sales/Both on one Resource cards list",
    dashboardEditor.includes('title="Resource cards"') &&
      dashboardEditor.includes("CMS-owned") &&
      dashboardEditor.includes('label="Title"') &&
      dashboardEditor.includes('label="Track"') &&
      dashboardEditor.includes('TRACK_OPTIONS') &&
      !dashboardEditor.includes("product-owned") &&
      !dashboardEditor.includes("Sales track resource cards")
  );
}

// ── Knowledge Test: multiple live sets ──────────────────────────────────────
{
  const def = createDefaultKnowledgeTestPayload();
  ok(
    "Default knowledge-test payload keeps Default bank live",
    def.testSets?.[0]?.id === DEFAULT_KNOWLEDGE_TEST_SET_ID &&
      def.testSets?.[0]?.published === true &&
      getLiveKnowledgeTestSets(def).length === 1
  );

  const legacy = normalizeKnowledgeTestPayload({
    activeTestSetId: "default",
    testSets: [
      { id: "default", label: "Default bank", questions: [{ id: "a" }] },
      { id: "set-2", label: "Test set 2", questions: [{ id: "b" }] },
    ],
  });
  const legacyLive = getLiveKnowledgeTestSets(legacy);
  ok(
    "Legacy activeTestSetId only publishes that one set",
    legacyLive.length === 1 &&
      legacyLive[0]?.id === "default" &&
      legacy.testSets?.find((s) => s.id === "set-2")?.published === false
  );

  const multi = normalizeKnowledgeTestPayload({
    hero: { title: "Frances hero" },
    activeTestSetId: "default",
    testSets: [
      { id: "default", label: "Default bank", published: true, questions: [{ id: "a" }] },
      { id: "set-2", label: "Test set 2", published: true, questions: [{ id: "b" }] },
      { id: "set-3", label: "Draft", published: false, questions: [{ id: "c" }] },
    ],
  });
  ok(
    "Multiple published sets are live; drafts stay hidden",
    getLiveKnowledgeTestSets(multi).map((s) => s.id).join(",") === "default,set-2" &&
      mergeKnowledgeTestHero(multi.hero).title === "Frances hero"
  );

  const nSets = normalizeKnowledgeTestPayload({
    testSets: Array.from({ length: 5 }, (_, i) => ({
      id: `set-${i}`,
      label: `Set ${i}`,
      published: i < 4,
      questions: [{ id: `q-${i}` }],
    })),
  });
  ok(
    "Live sets scale beyond two banks",
    getLiveKnowledgeTestSets(nSets).length === 4
  );

  const scheduled = normalizeKnowledgeTestPayload({
    testSets: [
      { id: "default", label: "Default bank", published: true, questions: [{ id: "a" }] },
      {
        id: "oct-w1a",
        label: "Oct Week 1",
        published: false,
        releaseDate: "2026-10-06",
        questions: [{ id: "b" }],
      },
      {
        id: "oct-w1b",
        label: "Oct Week 1 extra",
        published: false,
        releaseDate: "2026-10-08",
        questions: [{ id: "c" }],
      },
      {
        id: "oct-w2",
        label: "Oct Week 2",
        published: false,
        releaseDate: "2026-10-13",
        questions: [{ id: "d" }],
      },
      { id: "draft", label: "Draft", published: false, questions: [{ id: "e" }] },
      {
        id: "nov",
        label: "Nov Week 1",
        published: false,
        releaseDate: "2026-11-02",
        questions: [{ id: "f" }],
      },
    ],
  });
  const upcoming = getUpcomingKnowledgeTestSets(scheduled);
  const weekGroups = groupUpcomingKnowledgeTestSetsByWeek(upcoming);
  const sameWeek = weekGroups.find((g) => g.sets.length === 2);
  ok(
    "Unpublished sets with a release date list as upcoming, drafts without a date stay hidden",
    upcoming.map((s) => s.id).join(",") === "oct-w1a,oct-w1b,oct-w2,nov" &&
      !upcoming.some((s) => s.id === "draft") &&
      getLiveKnowledgeTestSets(scheduled).map((s) => s.id).join(",") === "default"
  );
  ok(
    "Two upcoming sets in the same calendar week both remain visible",
    Boolean(sameWeek) &&
      sameWeek!.sets.map((s) => s.id).join(",") === "oct-w1a,oct-w1b" &&
      sameWeek!.weekLabel === formatKnowledgeTestWeekLabel("2026-10-05") &&
      formatKnowledgeTestReleaseCopy("2026-10-06") === "Releasing 6 Oct 2026"
  );
  ok(
    "Upcoming listing scales to N scheduled banks and sorts by release date",
    upcoming.length === 4 &&
      weekGroups.length === 3 &&
      upcoming[0]?.releaseDate === "2026-10-06" &&
      upcoming[upcoming.length - 1]?.id === "nov"
  );
  ok(
    "Invalid or impossible release dates do not list as upcoming",
    getUpcomingKnowledgeTestSets(
      normalizeKnowledgeTestPayload({
        testSets: [
          { id: "bad", label: "Bad", published: false, releaseDate: "soon", questions: [{ id: "q" }] },
          { id: "leap", label: "Leap", published: false, releaseDate: "2026-02-31", questions: [{ id: "q" }] },
        ],
      })
    ).length === 0
  );
  ok(
    "ISO datetimes coerce to a calendar release date",
    getUpcomingKnowledgeTestSets(
      normalizeKnowledgeTestPayload({
        testSets: [
          {
            id: "iso",
            label: "ISO",
            published: false,
            releaseDate: "2026-10-06T00:00:00.000Z",
            questions: [{ id: "q" }],
          },
        ],
      })
    )[0]?.releaseDate === "2026-10-06"
  );
  ok(
    "Two unpublished banks on the same day both remain visible",
    groupUpcomingKnowledgeTestSetsByWeek(
      getUpcomingKnowledgeTestSets(
        normalizeKnowledgeTestPayload({
          testSets: [
            { id: "a", label: "A", published: false, releaseDate: "2026-10-06", questions: [{ id: "q1" }] },
            { id: "b", label: "B", published: false, releaseDate: "2026-10-06", questions: [{ id: "q2" }] },
          ],
        })
      )
    )[0]?.sets.map((s) => s.id).join(",") === "a,b"
  );
  ok(
    "Empty scheduled shells are kept (not replaced by the default question bank)",
    (() => {
      const shells = normalizeKnowledgeTestPayload({
        testSets: [
          { id: "default", label: "Default bank", published: true, questions: [] },
          { id: "oct", label: "Oct", published: false, releaseDate: "2026-10-06", questions: [] },
        ],
      });
      return (
        shells.testSets?.length === 2 &&
        shells.testSets[1]?.releaseDate === "2026-10-06" &&
        (shells.testSets[0]?.questions?.length ?? 0) === 0
      );
    })()
  );
  ok(
    "Published banks with a release date stay takeable, not upcoming",
    (() => {
      const mixed = normalizeKnowledgeTestPayload({
        testSets: [
          {
            id: "default",
            label: "Default bank",
            published: true,
            releaseDate: "2026-10-06",
            questions: [{ id: "a" }],
          },
        ],
      });
      return (
        getLiveKnowledgeTestSets(mixed).length === 1 && getUpcomingKnowledgeTestSets(mixed).length === 0
      );
    })()
  );
  ok(
    "Published banks without a release date stay takeable (legacy Default bank)",
    getLiveKnowledgeTestSets(
      normalizeKnowledgeTestPayload({
        testSets: [{ id: "default", label: "Default bank", published: true, questions: [{ id: "a" }] }],
      })
    ).length === 1
  );

  const encodedA = encodeKnowledgeTestGapAreas({
    testSetId: "default",
    answers: { q1: 0 },
    topics: ["Pricing"],
  });
  const encodedB = encodeKnowledgeTestGapAreas({
    testSetId: "set-2",
    answers: { q2: 1 },
    topics: ["LNG"],
  });
  const latest = latestKnowledgeTestResultsBySet(
    [
      { score: 12, totalQ: 20, gapAreas: encodedA, completedAt: "2026-01-01" },
      { score: 18, totalQ: 20, gapAreas: encodedB, completedAt: "2026-01-02" },
      { score: 14, totalQ: 20, gapAreas: encodedA, completedAt: "2026-01-03" },
    ],
    "default"
  );
  ok(
    "Knowledge test scores stay per-set and do not overwrite",
    latest.default?.score === 14 &&
      latest["set-2"]?.score === 18 &&
      latest.default?.answers.q1 === 0 &&
      latest["set-2"]?.answers.q2 === 1
  );

  const ktEditor = fs.readFileSync(
    path.join(process.cwd(), "src/app/admin/editors/knowledge-test-editor.tsx"),
    "utf8"
  );
  const ktClient = fs.readFileSync(
    path.join(process.cwd(), "src/app/knowledge-test/knowledge-test-client.tsx"),
    "utf8"
  );
  ok(
    "Admin can publish multiple knowledge-test sets independently",
    ktEditor.includes("setPublished") &&
      ktEditor.includes("Publish as many banks") &&
      ktEditor.includes("setReleaseDate") &&
      ktEditor.includes('type="date"') &&
      ktEditor.includes("preview only") &&
      !ktEditor.includes("Members only see the live set")
  );
  ok(
    "Members can continue with another live knowledge-test set",
    ktClient.includes("Continue with another set") &&
      ktClient.includes("liveSets") &&
      ktClient.includes("upcomingSets") &&
      ktClient.includes("Available now") &&
      ktClient.includes("Upcoming") &&
      ktClient.includes("/api/knowledge-test/results")
  );
  ok(
    "Knowledge Test blue hero strip remains CMS-editable",
    ktEditor.includes("Page hero strip") && ktClient.includes("formatKnowledgeTestHeroCopy")
  );
}

{
  const loginForm = fs.readFileSync(path.join(process.cwd(), "src/app/(auth)/login/login-form.tsx"), "utf8");
  const proxySrc = fs.readFileSync(path.join(process.cwd(), "src/proxy.ts"), "utf8");
  ok(
    "Public login hides the demo account list",
    !loginForm.includes("Demo accounts") &&
      !loginForm.includes("DEMO_ACCOUNTS") &&
      !loginForm.includes("quickDemoLogin")
  );
  const vercelRedirected = canonicalPublicUrl("https://commodityplay.vercel.app/?track=career");
  ok(
    "commodityplay.vercel.app is not a second public site",
    isNonCanonicalHost("commodityplay.ai") &&
      isNonCanonicalHost("commodityplay.ai:443") &&
      isNonCanonicalHost("commodityplay.ai.") &&
      isNonCanonicalHost("COMMODITYPLAY.AI") &&
      isNonCanonicalHost("commodityplay.vercel.app") &&
      !isNonCanonicalHost("www.commodityplay.ai") &&
      !isNonCanonicalHost("localhost") &&
      !isNonCanonicalHost(null) &&
      !isNonCanonicalHost("") &&
      vercelRedirected.hostname === CANONICAL_PUBLIC_HOST &&
      vercelRedirected.search === "?track=career" &&
      proxySrc.includes("isNonCanonicalHost") &&
      fs.readFileSync(path.join(process.cwd(), "vercel.json"), "utf8").includes(
        "commodityplay.vercel.app"
      )
  );
  ok(
    "Internal /demo is gated to Frances admin (not public)",
    proxySrc.includes('"/demo"') &&
      proxySrc.includes("src/app/demo/page.tsx") &&
      // Demo access is an identity, not a contact address. Frances's account and
      // the consolidated hello@ inbox both open the switcher, and the identity
      // literal is decoupled from BRAND_EMAIL_SUPPORT (which now points at hello@).
      FRANCES_DEMO_LOGIN_EMAIL === "frances@commodityplay.ai" &&
      canAccessInternalDemo({ role: "USER", email: FRANCES_DEMO_LOGIN_EMAIL }) &&
      !canAccessInternalDemo({ role: "ADMIN", email: "anyone@example.com" }) &&
      canAccessInternalDemo({ role: "USER", email: "frances@commodityplay.ai" }) &&
      canAccessInternalDemo({ role: "USER", email: "hello@commodityplay.ai" }) &&
      !canAccessInternalDemo({ role: "USER", email: "member@example.com" }) &&
      !canAccessInternalDemo(null)
  );
  const newsletterRoute = fs.readFileSync(
    path.join(process.cwd(), "src/app/api/newsletter/subscribe/route.ts"),
    "utf8"
  );
  const contactRoute = fs.readFileSync(path.join(process.cwd(), "src/app/api/contact/route.ts"), "utf8");
  const mentorApplyRoute = fs.readFileSync(
    path.join(process.cwd(), "src/app/api/mentor-apply/route.ts"),
    "utf8"
  );
  const registerRoute = fs.readFileSync(path.join(process.cwd(), "src/app/api/auth/register/route.ts"), "utf8");
  ok(
    "Operator leads email Support (newsletter, contact, mentor apply, starter signup)",
    BRAND_EMAIL_SUPPORT === "hello@commodityplay.ai" &&
      fs.readFileSync(path.join(process.cwd(), "src/lib/email.ts"), "utf8").includes(
        "getOperatorNotifyEmails"
      ) &&
      newsletterRoute.includes("notifyOperatorLead") &&
      contactRoute.includes("notifyOperatorLead") &&
      mentorApplyRoute.includes("notifyOperatorLead") &&
      registerRoute.includes("notifyOperatorLead")
  );
  const footerMerged = mergeSiteFooterContent({});
  // Custom list uses arbitrary addresses on purpose: this fixture tests that a
  // hand-entered operator list is normalised and preserved, not that those
  // addresses are the live contacts. The default (footerMerged) follows
  // BRAND_EMAIL_SUPPORT, which is now the consolidated hello@ inbox.
  const footerCustom = mergeSiteFooterContent({
    operatorNotifyEmails: ["support@commodityplay.ai", "frances@commodityplay.ai"],
  });
  const footerCapped = mergeSiteFooterContent({
    operatorNotifyEmails: Array.from({ length: 25 }, (_, i) => `desk${i}@commodityplay.ai`),
  });
  const emailSrc = fs.readFileSync(path.join(process.cwd(), "src/lib/email.ts"), "utf8");
  ok(
    "Footer CMS defaults operator alerts to Support and keeps extra inboxes",
    footerMerged.operatorNotifyEmails.join(",") === BRAND_EMAIL_SUPPORT &&
      footerCustom.operatorNotifyEmails.includes("support@commodityplay.ai") &&
      footerCustom.operatorNotifyEmails.includes("frances@commodityplay.ai") &&
      footerCapped.operatorNotifyEmails.length === 20 &&
      !emailSrc.includes('from "@/lib/content/accessors"') &&
      emailSrc.includes("tryReadPublishedPayload")
  );
  const forgotPage = fs.readFileSync(
    path.join(process.cwd(), "src/app/(auth)/forgot-password/page.tsx"),
    "utf8"
  );
  const resetPage = fs.readFileSync(
    path.join(process.cwd(), "src/app/(auth)/reset-password/page.tsx"),
    "utf8"
  );
  const forgotApi = fs.readFileSync(
    path.join(process.cwd(), "src/app/api/auth/forgot-password/route.ts"),
    "utf8"
  );
  const resetApi = fs.readFileSync(
    path.join(process.cwd(), "src/app/api/auth/reset-password/route.ts"),
    "utf8"
  );
  ok(
    "Admin database browser lists Prisma table counts and user search",
    fs.existsSync(path.join(process.cwd(), "src/app/admin/database/page.tsx")) &&
      fs.readFileSync(path.join(process.cwd(), "src/lib/admin-database.ts"), "utf8").includes(
        "loadAdminDatabasePage"
      ) &&
      fs.readFileSync(path.join(process.cwd(), "src/app/admin/admin-client.tsx"), "utf8").includes(
        'href="/admin/database"'
      )
  );
  ok(
    "Forgot password can set a password and Google is hidden unless configured",
    forgotPage.includes("Send reset link") &&
      resetPage.includes("Choose a password") &&
      forgotApi.includes("createPasswordResetToken") &&
      resetApi.includes("passwordHash") &&
      loginForm.includes("useGoogleSignInAvailable") &&
      loginForm.includes("/forgot-password") &&
      fs.existsSync(path.join(process.cwd(), "src/app/api/auth/google-status/route.ts"))
  );
}

// ── Pricing feature rows: smaller type, bold heading only ───────────────────
{
  const tierGrid = fs.readFileSync(
    path.join(process.cwd(), "src/components/pricing/pricing-tier-grid.tsx"),
    "utf8"
  );

  const playbook = splitFeatureLabel("Full Playbook — all 9 chapters");
  ok(
    "Plan feature labels split into a heading and its caption",
    playbook.heading === "Full Playbook" &&
      playbook.separator === " — " &&
      playbook.caption === "all 9 chapters"
  );
  ok(
    "A plan label with no dash is all heading, with no caption",
    JSON.stringify(splitFeatureLabel("Persona Analysis Quiz")) ===
      JSON.stringify({ heading: "Persona Analysis Quiz", separator: null, caption: null }) &&
      splitFeatureLabel("Market Scenarios & Case Studies").caption === null
  );
  ok(
    "Hyphens inside a word are never read as the heading/caption separator",
    splitFeatureLabel("General Job Board — auto-inclusion on upcoming feature").heading ===
      "General Job Board" &&
      splitFeatureLabel("General Job Board — auto-inclusion on upcoming feature").caption ===
        "auto-inclusion on upcoming feature" &&
      splitFeatureLabel("Resume Templates & Vetting — practitioner-vetted").caption ===
        "practitioner-vetted"
  );
  ok(
    "A dash with nothing on one side leaves the label whole",
    splitFeatureLabel("— caption only").heading === "— caption only" &&
      splitFeatureLabel("— caption only").caption === null &&
      splitFeatureLabel("heading —").caption === null &&
      splitFeatureLabel("heading — ").caption === null
  );
  ok(
    "Splitting a plan label never drops a character",
    [
      "Full Playbook — all 9 chapters",
      "Persona Analysis Quiz",
      "Market Scenarios & Case Studies",
      "Career Roadmap with role blueprints & industry compensation bands",
      "General Job Board — auto-inclusion on upcoming feature",
    ].every((label) => {
      const parts = splitFeatureLabel(label);
      return `${parts.heading}${parts.separator ?? ""}${parts.caption ?? ""}` === label;
    })
  );
  ok(
    "Pricing feature rows are 14/16px with a bold heading span",
    tierGrid.includes("text-sm sm:text-base") &&
      !tierGrid.includes("text-base sm:text-lg") &&
      tierGrid.includes('<span className="font-semibold">{label.heading}</span>') &&
      tierGrid.includes("{label.separator}") &&
      tierGrid.includes("{label.caption}")
  );

  // ── Account menu + Billing card (owner request, 20 Oct 2026) ──────────────
  // "My Account" and "Settings" were two dropdown entries pointing at the same
  // /account route — a pure duplicate. The Billing card also lost its
  // monthly/annually toggle and now hands the plan choice to /pricing.
  {
    const navSrc = fs.readFileSync(path.join(process.cwd(), "src/components/nav.tsx"), "utf8");

    ok(
      "Account dropdown has no duplicate Settings entry",
      // Matches a JSX text node only, so an unrelated comment or import named
      // "Settings" would not fail this, and re-adding the menu item would.
      !/>\s*Settings\s*</.test(navSrc)
    );

    // One /account link in the desktop dropdown, one in the mobile menu. The
    // duplicate made this three; a removed mobile entry would make it one.
    ok(
      "Account menu has exactly one /account link per menu (desktop + mobile)",
      (navSrc.match(/href="\/account"/g) ?? []).length === 2
    );

    const billingSrc = fs.readFileSync(
      path.join(process.cwd(), "src/components/account/account-billing-section.tsx"),
      "utf8"
    );

    // Structural, not a loose substring: the label must sit inside a Link to
    // /pricing. Changing the href, the label, or reverting to an onClick breaks it.
    ok(
      "Billing card's upgrade CTA is a Link to /pricing labelled Upgrade Plan",
      // An explanatory JSX comment may sit between the <Link> and its <Button>,
      // so the gap is not whitespace-only.
      /<Link\s+href="\/pricing"[^>]*>\s*(?:\{\/\*[\s\S]*?\*\/\}\s*)?<Button[^>]*>\s*Upgrade Plan/.test(
        billingSrc
      )
    );

    ok(
      "Billing card no longer renders the monthly/annually term selector",
      !billingSrc.includes("PlanTermSelector")
    );

    ok(
      "Billing card no longer starts checkout itself — /pricing owns it",
      !billingSrc.includes("startCheckout")
    );

    // The old helper text promised cancellation "from this page", which stopped
    // being true once the button only navigates.
    ok(
      "Billing card no longer claims you can cancel from this page",
      !billingSrc.includes("Cancel anytime from this page")
    );
  }

  // ── Account buttons carry the landing CTA treatment (owner request, 20 Oct 2026) ─
  // The owner asked that "Save profile" (both the member and mentor variants) and
  // the billing card's "Upgrade Plan" get the same round shape and green->blue
  // hover gradient as every CTA on the landing pages. The shared constant is
  // `LANDING_CTA` in `src/lib/landing-cta.ts`, so the correct implementation is to
  // import it — not to re-spell `rounded-full hover:from-emerald-500 ...` inline,
  // which would silently fork if the landing treatment ever changes.
  {
    const memberSettingsSrc = fs.readFileSync(
      path.join(process.cwd(), "src/components/account/member-account-settings.tsx"),
      "utf8"
    );
    const mentorSettingsSrc = fs.readFileSync(
      path.join(process.cwd(), "src/components/account/mentor-account-settings.tsx"),
      "utf8"
    );

    // Both submit buttons must import the constant AND pass it as className —
    // importing without using it would compile and render nothing.
    for (const [name, src] of [
      ["member", memberSettingsSrc],
      ["mentor", mentorSettingsSrc],
    ] as const) {
      ok(
        `${name[0].toUpperCase()}${name.slice(1)} "Save profile" imports LANDING_CTA`,
        src.includes('from "@/lib/landing-cta"')
      );
      ok(
        `${name[0].toUpperCase()}${name.slice(1)} "Save profile" applies LANDING_CTA`,
        /<Button[^>]*type="submit"[^>]*className=\{LANDING_CTA\}/.test(src)
      );
    }

    // The Upgrade Plan button, which was reworked earlier today. Its class goes
    // on the <Button>, not the wrapping <Link> — the pill shape is the button's.
    const billingSrc = fs.readFileSync(
      path.join(process.cwd(), "src/components/account/account-billing-section.tsx"),
      "utf8"
    );
    ok(
      "Billing card's Upgrade Plan button applies LANDING_CTA",
      /<Button[^>]*className=\{LANDING_CTA\}/.test(billingSrc)
    );

    // Both buttons must render at the SAME size (owner request, 20 Oct 2026:
    // "both buttons to be same size"). Upgrade Plan used to carry size="sm",
    // which made it visibly smaller than "Save profile" on the Personal info
    // card. The strongest form of this check is that the <Button> carries NO
    // size attribute at all — so it falls through to the default variant, the
    // same one "Save profile" relies on. That fails if a size override is
    // re-added, or if "Save profile" is given one.
    const upgradeBtn = billingSrc.match(/<Button[^>]*>\s*Upgrade Plan/);
    ok(
      "Upgrade Plan has no size override — it matches Save profile's default size",
      upgradeBtn !== null && !/\ssize=/.test(upgradeBtn[0])
    );

    for (const src of [memberSettingsSrc, mentorSettingsSrc]) {
      const saveBtn = src.match(/<Button[^>]*>\s*Save profile/);
      if (saveBtn !== null) {
        ok(
          "Save profile has no size override — it keeps the default size",
          !/\ssize=/.test(saveBtn[0])
        );
      }
    }
  }
}

// ───────────────────────────────────────────────────────────────────────────
// Country field + Job Board Waitlist CMS + CSV export (feat/country-and-waitlist-cms)
//
// Kept in its OWN function at the very end of the file so it never collides with
// edits to the middle of this harness.
// ───────────────────────────────────────────────────────────────────────────
async function verifyCountryWaitlistCms() {
  // ── PART 1: Job Board Waitlist copy is CMS-editable ──────────────────────
  const waitlistDefault = DEFAULT_LANDING_CONTENT.waitlist;
  const mergedWaitlist = mergeLandingContent(DEFAULT_LANDING_CONTENT, {
    waitlist: { ...waitlistDefault, title: "Custom waitlist title" },
  });
  ok(
    "waitlist copy resolves from the landing module",
    mergedWaitlist.waitlist.title === "Custom waitlist title" &&
      mergedWaitlist.waitlist.pill === waitlistDefault.pill &&
      mergedWaitlist.waitlist.benefits.length === waitlistDefault.benefits.length
  );

  // The `.default()` on the waitlist group is the load-bearing bit: without it a
  // payload saved before the group existed fails validation on the next save of
  // ANY other landing field. Assert it explicitly.
  const schemaSrc = fs.readFileSync(
    path.join(process.cwd(), "src/lib/content/landing-schema.ts"),
    "utf8"
  );
  ok(
    "landing schema's waitlist group carries a .default() (the CMS save trap)",
    /\.default\(\s*\(\)\s*=>\s*DEFAULT_LANDING_CONTENT\.waitlist\s*\)/.test(schemaSrc)
  );

  const waitlistPage = fs.readFileSync(
    path.join(process.cwd(), "src/app/waitlist/page.tsx"),
    "utf8"
  );
  const waitlistClient = fs.readFileSync(
    path.join(process.cwd(), "src/app/waitlist/waitlist-client.tsx"),
    "utf8"
  );
  ok(
    "the 'Alerts will go to' line is removed from the waitlist page",
    !`${waitlistPage}\n${waitlistClient}`.includes("Alerts will go to")
  );
  ok(
    "the waitlist route is a server component that renders the client",
    !waitlistPage.includes('"use client"') && waitlistPage.includes("WaitlistClient")
  );

  // ── PART 2: Country on signup ────────────────────────────────────────────
  const { COUNTRIES } = await import("../src/data/countries");
  ok("the country list starts with Singapore", COUNTRIES[0]?.name === "Singapore");
  const remainder = COUNTRIES.slice(1).map((country) => country.name);
  ok(
    "every country after Singapore is in alphabetical order",
    JSON.stringify(remainder) === JSON.stringify([...remainder].sort())
  );
  ok("the country list is a full standard list", COUNTRIES.length >= 150);

  const prismaSchema = fs.readFileSync(path.join(process.cwd(), "prisma/schema.prisma"), "utf8");
  ok(
    "User.country exists in prisma/schema.prisma",
    /model User\s*\{[\s\S]*?country\s+String\?/.test(prismaSchema)
  );

  const migrationSrc = fs.readFileSync(
    path.join(process.cwd(), "src/lib/db-schema-migrations.ts"),
    "utf8"
  );
  ok(
    "User.country is added by CORE_MIGRATION_SQL",
    migrationSrc.includes('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "country" TEXT;')
  );

  const signupSrc = fs.readFileSync(
    path.join(process.cwd(), "src/app/(auth)/signup/page.tsx"),
    "utf8"
  );
  ok(
    "the signup form registers a required country field",
    signupSrc.includes('register("country")') && signupSrc.includes("country: z")
  );

  const registerSrc = fs.readFileSync(
    path.join(process.cwd(), "src/app/api/auth/register/route.ts"),
    "utf8"
  );
  ok(
    "the register API validates and persists country",
    // `refine(isCountryName` (not just the import) proves the value is actually
    // checked against the country list, and the multi-line `track,\n country,`
    // proves it reaches the create data rather than only the destructure.
    registerSrc.includes("refine(isCountryName") &&
      registerSrc.includes("country: z") &&
      registerSrc.includes("track,\n        country,")
  );

  // ── PART 3: Country in both admin lists ──────────────────────────────────
  const adminUsersSrc = fs.readFileSync(
    path.join(process.cwd(), "src/app/api/admin/users/route.ts"),
    "utf8"
  );
  ok("the admin users API selects country", adminUsersSrc.includes("country: true"));

  const adminDatabaseSrc = fs.readFileSync(
    path.join(process.cwd(), "src/lib/admin-database.ts"),
    "utf8"
  );
  ok(
    "the admin database members query selects and maps country",
    adminDatabaseSrc.includes("country: true") &&
      adminDatabaseSrc.includes("country: user.country")
  );

  const adminClientSrc = fs.readFileSync(
    path.join(process.cwd(), "src/app/admin/admin-client.tsx"),
    "utf8"
  );
  ok("the Customers table shows a Country column", adminClientSrc.includes(">Country<"));
  ok(
    "the Customers tab has an Export CSV control",
    adminClientSrc.includes("Export CSV") && adminClientSrc.includes("/api/admin/users/export")
  );

  const adminDatabasePageSrc = fs.readFileSync(
    path.join(process.cwd(), "src/app/admin/database/page.tsx"),
    "utf8"
  );
  ok(
    "the database members table shows a Country column",
    adminDatabasePageSrc.includes(">Country<") && adminDatabasePageSrc.includes("user.country")
  );

  // ── PART 4: CSV export route ─────────────────────────────────────────────
  const exportPath = path.join(process.cwd(), "src/app/api/admin/users/export/route.ts");
  const exportExists = fs.existsSync(exportPath);
  ok("the customers CSV export route exists", exportExists);
  if (exportExists) {
    const exportSrc = fs.readFileSync(exportPath, "utf8");
    ok(
      "the CSV export route is gated by requireSoleAdmin (403)",
      // ⚠️ Assert the GUARD CALL, not just the identifier. The `import` line and
      // the doc comment both contain "requireSoleAdmin" and "403", so a bare
      // substring test still passes with the entire guard block deleted — which
      // is exactly how this check first false-passed. Verified by deleting the
      // guard and confirming this line goes red.
      exportSrc.includes("await requireSoleAdmin()") && exportSrc.includes("status: 403")
    );
    ok(
      "the CSV export sets a CSV download header",
      exportSrc.includes("text/csv") && exportSrc.includes("Content-Disposition")
    );
    ok(
      "the CSV export escapes embedded quotes and commas",
      exportSrc.includes('replace(/"/g') && exportSrc.includes("csvEscape")
    );
    ok("the CSV export includes the Country column", exportSrc.includes('"Country"'));
    ok(
      "the CSV export supports a members scope",
      exportSrc.includes('"members"') && exportSrc.includes("searchAdminDatabaseUsers")
    );
    ok(
      "the CSV export members branch includes Mentor and Has password columns",
      exportSrc.includes('"Mentor"') && exportSrc.includes('"Has password"')
    );
  }

  ok(
    "the Members view has an Export CSV button",
    adminDatabasePageSrc.includes("Export CSV") &&
      adminDatabasePageSrc.includes('scope: "members"') &&
      adminDatabasePageSrc.includes("membersExportHref")
  );
}

/**
 * Sales Market Nudges tweaks (owner requests from Frances, 21 Oct 2026):
 *
 *   1. Talking points collapse into accordions — a `CATEGORY / title / date` row that
 *      opens on click, so a month folder is scannable instead of a long card wall.
 *   2. A brief set to expired/archive stays reachable inside its month folder; only
 *      Active is featured. The briefs therefore need their own status tabs, defaulting
 *      to All, separate from the weekly-nudge chips.
 *   3. The weekly nudge "Now" field takes 2000 characters and renders bullets.
 *
 * The pure-function checks pin the multiline parser and the schema cap (the cap is the
 * silent-save trap: a textarea that allows more than the schema accepts makes Save look
 * like a no-op). The source greps pin the decisions that need a DOM to exercise —
 * native `<details>`, the single-column list, and the matching textarea cap.
 */
async function verifySalesNudgesTweaks() {
  // ── PART 1: multiline text (paragraphs + bullets) ────────────────────────
  const bulletBlocks = parseMultilineText("- Diesel cracks widened\n- ARA stocks at a 5-year low");
  ok(
    "Multiline text groups consecutive '- ' lines into one bullets block and strips the marker",
    bulletBlocks.length === 1 &&
      bulletBlocks[0]?.kind === "bullets" &&
      JSON.stringify(bulletBlocks[0]?.lines) ===
        JSON.stringify(["Diesel cracks widened", "ARA stocks at a 5-year low"])
  );

  const boldBullets = parseMultilineText("- **Diesel** cracks widened\n- ARA stocks low");
  ok(
    "Multiline text keeps **bold** markers in the bullet text for the inline-bold pass",
    boldBullets[0]?.lines[0] === "**Diesel** cracks widened" &&
      parseInlineBold(boldBullets[0]?.lines[0] ?? "").some((segment) => segment.bold)
  );

  const separated = parseMultilineText("Diesel cracks widened.\n\n- ARA stocks low\n- Gasoil tight");
  ok(
    "Multiline text treats a blank line as a block separator",
    separated.length === 2 &&
      separated[0]?.kind === "paragraph" &&
      separated[1]?.kind === "bullets" &&
      separated[1]?.lines.length === 2
  );

  const prose = parseMultilineText("Diesel cracks widened this week.");
  ok(
    "Multiline text leaves unmarked prose as one paragraph (bullets never swallow plain lines)",
    prose.length === 1 &&
      prose[0]?.kind === "paragraph" &&
      prose[0]?.lines.join(" ") === "Diesel cracks widened this week."
  );

  const mixedKinds = parseMultilineText("- a\nplain line\n- b");
  ok(
    "Multiline text starts a new block when the kind changes (bullets, paragraph, bullets)",
    mixedKinds.map((block) => block.kind).join(",") === "bullets,paragraph,bullets"
  );

  // ── PART 2: the 2000-character "Now" cap ─────────────────────────────────
  const firstNudge = DEFAULT_SALES_MARKET_NUDGES_CONTENT.weeklyNudges[0]!;
  const longWhyNow = "Diesel cracks widened on Russian export bans. ".repeat(26).trim();
  const nudgesWithWhyNow = (whyNow: string) => ({
    ...DEFAULT_SALES_MARKET_NUDGES_CONTENT,
    weeklyNudges: [{ ...firstNudge, whyNow }],
  });

  ok(
    "The schema accepts a ~1200-character 'Now' value (the old 500 cap is gone)",
    longWhyNow.length > 500 &&
      longWhyNow.length < 2000 &&
      parseSalesMarketNudgesPayload(nudgesWithWhyNow(longWhyNow)).success
  );
  ok(
    "The schema still rejects a 'Now' value over 2000 characters",
    !parseSalesMarketNudgesPayload(nudgesWithWhyNow("y".repeat(2001))).success
  );
  ok(
    "The legacy `text` alias shares the 2000 cap so one long row cannot poison the payload",
    parseSalesMarketNudgesPayload({
      ...DEFAULT_SALES_MARKET_NUDGES_CONTENT,
      weeklyNudges: [{ id: firstNudge.id, text: longWhyNow }],
    }).success === true &&
      !parseSalesMarketNudgesPayload({
        ...DEFAULT_SALES_MARKET_NUDGES_CONTENT,
        weeklyNudges: [{ id: firstNudge.id, text: "y".repeat(2001) }],
      }).success
  );
  ok(
    "Normalising keeps a bulleted 'Now' string byte-for-byte (no trim, filter or reshape)",
    normalizeSalesMarketNudgesPayload(
      nudgesWithWhyNow("- **Diesel** cracks widened\n- ARA stocks low")
    ).weeklyNudges[0]?.whyNow === "- **Diesel** cracks widened\n- ARA stocks low"
  );

  // ── PART 3: source greps ─────────────────────────────────────────────────
  const nudgesSectionSrc = fs.readFileSync(
    path.join(process.cwd(), "src/components/dashboard/sales-market-nudges-section.tsx"),
    "utf8"
  );
  const nudgesEditorSrc = fs.readFileSync(
    path.join(process.cwd(), "src/app/admin/editors/sales-market-nudges-editor.tsx"),
    "utf8"
  );
  const multilineModuleSrc = fs.readFileSync(
    path.join(process.cwd(), "src/lib/multiline-text.tsx"),
    "utf8"
  );

  ok(
    "The admin 'Now' textarea is 6 rows and maxLength={2000}, matching the schema cap",
    /rows=\{6\}[\s\S]{0,80}maxLength=\{2000\}[\s\S]{0,80}value=\{nudge\.whyNow\}/.test(nudgesEditorSrc)
  );
  ok(
    "The multiline helper is server-safe and never uses dangerouslySetInnerHTML",
    // The doc comment *mentions* `"use client"` to explain why it is absent, so this
    // asserts the directive form (leading position / trailing semicolon) rather than a
    // bare substring — the same distinction the inline-bold check makes.
    !multilineModuleSrc.trimStart().startsWith('"use client"') &&
      !multilineModuleSrc.includes('"use client";') &&
      !multilineModuleSrc.includes("dangerouslySetInnerHTML=") &&
      multilineModuleSrc.includes("export function parseMultilineText") &&
      multilineModuleSrc.includes("renderInlineBold(line)")
  );
  ok(
    "Member briefs render as native <details>/<summary> accordions with a rotating chevron",
    nudgesSectionSrc.includes("<details") &&
      nudgesSectionSrc.includes("<summary") &&
      nudgesSectionSrc.includes("group-open:rotate-180") &&
      nudgesSectionSrc.includes("[&::-webkit-details-marker]:hidden")
  );
  ok(
    "A bookmark deep-link forces the collapsed brief open (open={highlighted || undefined})",
    nudgesSectionSrc.includes("open={highlighted || undefined}") &&
      nudgesSectionSrc.includes("BOOKMARK_HIGHLIGHT_RING") &&
      nudgesSectionSrc.includes("marketNudgeElementId(brief.id)")
  );
  ok(
    "Talking Points is a single-column list, not the ragged sm:grid-cols-2 grid",
    !nudgesSectionSrc.includes("sm:grid-cols-2") &&
      !nudgesSectionSrc.includes("grid-cols-1 sm:grid") &&
      nudgesSectionSrc.includes("monthBriefs.map(")
  );
  ok(
    "Briefs have their own status tabs defaulting to All, separate from the weekly chips",
    nudgesSectionSrc.includes('useState<BriefStatusFilter>("all")') &&
      nudgesSectionSrc.includes('label="Filter briefs by status"') &&
      nudgesSectionSrc.includes('label="Filter weekly nudges by status"') &&
      nudgesSectionSrc.includes('{ id: "all", label: "All", count: content.intelligenceBriefs.length }')
  );
  ok(
    "Expired and archived briefs sort after Active inside a month folder",
    /const BRIEF_STATUS_ORDER[\s\S]{0,200}active: 0[\s\S]{0,80}expired: 1[\s\S]{0,80}archive: 2/.test(
      nudgesSectionSrc
    ) && nudgesSectionSrc.includes('BRIEF_STATUS_ORDER[a.status ?? "active"]')
  );
  ok(
    "Only Active briefs are featured — expired/archive rows dim and carry a status pill",
    nudgesSectionSrc.includes('!isFeatured && "opacity-75"') &&
      nudgesSectionSrc.includes("BRIEF_STATUS_PILL_CLASS[status]") &&
      nudgesSectionSrc.includes("MEMBER_NUDGE_STATUS_LABELS.EXPIRED") &&
      nudgesSectionSrc.includes("MEMBER_NUDGE_STATUS_LABELS.ARCHIVED")
  );
}

/**
 * Referral codes (feat/referral-codes).
 *
 * The feature has three moving parts that must not drift:
 *
 *   1. ELIGIBILITY is derived from the member's email domain (university and
 *      corporate are eligible, consumer mailboxes are not). Pure function, so it
 *      is pinned directly.
 *   2. The REWARD is deliberately undecided — a placeholder plus a coupon id in
 *      `STRIPE_REFERRAL_COUPON_ID`. `configured` must be false while that is
 *      unset, or the feature would try to attach a coupon that does not exist.
 *   3. SINGLE-USE is enforced by two UNIQUE indexes, not by application code.
 *      Those are schema/SQL decisions that no unit test can execute here, so they
 *      are pinned as source assertions — along with the two rules that would be a
 *      production incident if broken: the checkout route must never send
 *      `allow_promotion_codes` together with `discounts`, and nothing may ever
 *      create a coupon/price/product in Stripe.
 */
async function verifyReferralCodes() {
  // ── PART 1: eligibility from the email domain ────────────────────────────
  ok(
    "Referral: a .edu address classifies as UNIVERSITY",
    classifyReferralAccount("maya@mit.edu") === "UNIVERSITY"
  );
  ok(
    "Referral: a .edu SUBDOMAIN still classifies as UNIVERSITY",
    classifyReferralAccount("maya@mail.mit.edu") === "UNIVERSITY"
  );
  ok(
    "Referral: .edu.sg classifies as UNIVERSITY (the Singapore case)",
    classifyReferralAccount("maya@nus.edu.sg") === "UNIVERSITY"
  );
  ok(
    "Referral: an .edu.sg subdomain classifies as UNIVERSITY",
    classifyReferralAccount("maya@student.nus.edu.sg") === "UNIVERSITY"
  );
  ok(
    "Referral: .ac.uk classifies as UNIVERSITY",
    classifyReferralAccount("maya@imperial.ac.uk") === "UNIVERSITY"
  );
  ok(
    "Referral: an .ac.uk subdomain classifies as UNIVERSITY",
    classifyReferralAccount("maya@mail.imperial.ac.uk") === "UNIVERSITY"
  );
  ok(
    "Referral: .ac.nz classifies as UNIVERSITY",
    classifyReferralAccount("maya@auckland.ac.nz") === "UNIVERSITY"
  );
  ok(
    "Referral: gmail.com classifies as PERSONAL",
    classifyReferralAccount("maya@gmail.com") === "PERSONAL"
  );
  ok(
    "Referral: a gmail.com SUBDOMAIN is PERSONAL — it must never sneak through as corporate",
    classifyReferralAccount("maya@mail.gmail.com") === "PERSONAL"
  );
  ok(
    "Referral: a real corporate domain classifies as CORPORATE",
    classifyReferralAccount("maya@glencore.com") === "CORPORATE"
  );
  ok(
    "Referral: a malformed string is PERSONAL (fail closed)",
    classifyReferralAccount("not-an-email") === "PERSONAL"
  );
  ok(
    "Referral: an address with no domain is PERSONAL",
    classifyReferralAccount("maya@") === "PERSONAL"
  );
  ok(
    "Referral: an address with two @ is PERSONAL",
    classifyReferralAccount("maya@@mit.edu") === "PERSONAL"
  );
  ok(
    "Referral: classification is case- and whitespace-insensitive",
    classifyReferralAccount("  MAYA@NUS.EDU.SG  ") === "UNIVERSITY"
  );
  ok(
    "Referral: the consumer mailbox list is exported and covers the majors",
    ["gmail.com", "outlook.com", "yahoo.com", "hotmail.com", "icloud.com"].every((domain) =>
      CONSUMER_EMAIL_DOMAINS.includes(domain)
    )
  );
  ok(
    "Referral: the academic suffix list is exported and includes .edu.sg and .ac.uk",
    UNIVERSITY_DOMAIN_SUFFIXES.includes(".edu.sg") &&
      UNIVERSITY_DOMAIN_SUFFIXES.includes(".ac.uk")
  );
  ok(
    "Referral: university and corporate are eligible, consumer is not",
    isReferralEligible("maya@nus.edu.sg") &&
      isReferralEligible("maya@glencore.com") &&
      !isReferralEligible("maya@gmail.com")
  );
  ok("Referral: a malformed address is never eligible", !isReferralEligible("nope"));

  // ── PART 2: code normalisation and generation ────────────────────────────
  ok(
    "Referral: normalise uppercases a lowercase code",
    normalizeReferralCode("cp-ab12-cd34") === "CP-AB12-CD34"
  );
  ok(
    "Referral: normalise strips whitespace and punctuation",
    normalizeReferralCode("  cp ab12/cd34!  ") === "CPAB12CD34"
  );
  ok(
    "Referral: normalise returns an empty string when nothing usable is left",
    normalizeReferralCode("") === "" && normalizeReferralCode("   ") === ""
  );
  ok(
    "Referral: normalise collapses repeated hyphens and trims the edges",
    normalizeReferralCode("--cp--ab12--") === "CP-AB12"
  );

  const sampleCode = generateReferralCode();
  ok(
    "Referral: generateReferralCode matches REFERRAL_CODE_PATTERN",
    REFERRAL_CODE_PATTERN.test(sampleCode),
    sampleCode
  );

  const generated = Array.from({ length: 200 }, () => generateReferralCode());
  ok(
    "Referral: 200 generated codes are all unique",
    new Set(generated).size === 200,
    `${new Set(generated).size} unique`
  );
  ok(
    "Referral: generated codes never contain 0, O, 1 or I (members retype them by hand)",
    generated.every((code) => !/[0O1I]/.test(code))
  );
  ok(
    "Referral: the pattern rejects an ambiguous code of the right length",
    !REFERRAL_CODE_PATTERN.test("CP-0000-0000") && !REFERRAL_CODE_PATTERN.test("CP-OOOO-IIII")
  );

  // ── PART 3: the reward is a placeholder until the coupon exists ───────────
  const savedCouponId = process.env.STRIPE_REFERRAL_COUPON_ID;
  delete process.env.STRIPE_REFERRAL_COUPON_ID;
  const unconfigured = getReferralRewardConfig();
  ok(
    "Referral: the reward is NOT configured while STRIPE_REFERRAL_COUPON_ID is unset",
    unconfigured.configured === false && unconfigured.couponId === null
  );
  ok(
    "Referral: the placeholder reward carries no decided value",
    REFERRAL_REWARD_PLACEHOLDER.value === null
  );

  process.env.STRIPE_REFERRAL_COUPON_ID = "coupon_referral_test";
  const configured = getReferralRewardConfig();
  ok(
    "Referral: the reward is configured once a coupon id is present",
    configured.configured === true && configured.couponId === "coupon_referral_test"
  );
  if (savedCouponId === undefined) delete process.env.STRIPE_REFERRAL_COUPON_ID;
  else process.env.STRIPE_REFERRAL_COUPON_ID = savedCouponId;

  // ── PART 4: source assertions for the decisions that need a runtime ──────
  const readSrc = (relativePath: string): string =>
    fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

  const checkoutSrc = readSrc("src/app/api/stripe/checkout/route.ts");
  const referralValidationSrc = readSrc("src/lib/referral-validation.ts");
  const referralValidateRouteSrc = readSrc("src/app/api/referral/validate/route.ts");
  const adminCreateSrc = readSrc("src/app/api/admin/referral-codes/route.ts");
  const adminIdSrc = readSrc("src/app/api/admin/referral-codes/[id]/route.ts");
  const schemaSrc = readSrc("prisma/schema.prisma");
  const migrationSrc = readSrc("src/lib/db-schema-migrations.ts");
  const checkoutPageSrc = readSrc("src/app/checkout/page.tsx");
  const checkoutClientSrc = readSrc("src/app/checkout/checkout-client.tsx");
  const adminClientSrc = readSrc("src/app/admin/admin-client.tsx");
  const adminTabSrc = readSrc("src/app/admin/referral-codes-tab.tsx");
  const webhookSrc = readSrc("src/app/api/stripe/webhook/route.ts");
  const rateLimitSrc = readSrc("src/lib/rate-limit.ts");
  const rateLimitSharedSrc = readSrc("src/lib/rate-limit-shared.ts");

  ok(
    "Referral: the checkout route accepts an optional referralCode",
    checkoutSrc.includes("referralCode: z.string().max(64).optional()")
  );
  ok(
    "Referral: the checkout route re-validates the code server-side (it never calls /validate)",
    // Assert the CALL, not the identifier: the route's own comment explains why it
    // does not rely on /api/referral/validate, so a bare substring test would fail
    // on the documentation alone.
    checkoutSrc.includes("validateReferralCodeForMember(") &&
      !checkoutSrc.includes('fetch("/api/referral/validate"')
  );
  ok(
    "Referral: the eligibility check itself runs server-side, not only in /validate",
    referralValidationSrc.includes("isReferralEligible(input.email)") &&
      referralValidationSrc.includes("classifyReferralAccount(input.email)")
  );
  // 🔴 The two gates must read the SAME email. `PATCH /api/account/profile` changes
  // the address without re-verification and the JWT keeps the old one until it is
  // refreshed, so a session-supplied email let a member whose STORED address is a
  // gmail inbox pass checkout while /validate refused them (QA reproduced exactly
  // that). The domain is what decides eligibility, so it has to come from the row.
  ok(
    "Referral: checkout derives the eligibility email from the DB row, never the JWT",
    checkoutSrc.includes("email: true") &&
      !checkoutSrc.includes("const email = session.user.email!") &&
      /select: \{ track: true, email: true \}/.test(checkoutSrc) &&
      /const email = row\?\.email \?\? session\.user\.email!/.test(checkoutSrc)
  );
  ok(
    "Referral: the two gates read the email the same way (DB first, session as fallback)",
    /const email = row\?\.email \?\? session\.user\.email!/.test(checkoutSrc) &&
      /if \(row\?\.email\) email = row\.email/.test(referralValidateRouteSrc)
  );
  ok(
    "Referral: a failed session create RELEASES the reservation instead of burning the code",
    // The window is generous because the release is preceded by a long comment
    // explaining WHEN releasing is correct (see the guarded-release check below).
    /catch \(err\) \{[\s\S]{0,1400}releaseReferralReservation\(referralReservationId\)[\s\S]{0,140}throw err;/.test(
      checkoutSrc
    )
  );
  ok(
    "Referral: stale RESERVED rows are cleared BEFORE the new reservation is inserted",
    // Order, not distance: the cleanup must run first, and the comments between the
    // two calls are long enough that a fixed-width window is the wrong assertion.
    checkoutSrc.indexOf("releaseStaleReferralReservations(userId)") >= 0 &&
      checkoutSrc.indexOf("referralRedemption.create") >
        checkoutSrc.indexOf("releaseStaleReferralReservations(userId)")
  );
  ok(
    "Referral: a P2002 race on the reserve INSERT becomes a 409",
    checkoutSrc.includes("isUniqueViolation(err)") &&
      checkoutSrc.includes("This referral code has just been used") &&
      checkoutSrc.includes("{ status: 409 }")
  );
  ok(
    "Referral: allow_promotion_codes is set in exactly ONE place — the no-discount branch",
    (checkoutSrc.match(/allow_promotion_codes: true/g) ?? []).length === 1 &&
      checkoutSrc.includes("{ discounts: [effectiveDiscount] }")
  );
  ok(
    "Referral: the referral discount replaces the promo-code field, never both",
    /\.\.\.\(effectiveDiscount\s*\?\s*\{ discounts: \[effectiveDiscount\] \}\s*:\s*\{ allow_promotion_codes: true \}\)/.test(
      checkoutSrc
    )
  );
  ok(
    "Referral: referralCodeId rides in BOTH session and subscription metadata",
    (checkoutSrc.match(/\.\.\.referralMetadata/g) ?? []).length === 2
  );
  ok(
    "Referral: 🔴 nothing in the checkout route creates a coupon, price or product in Stripe",
    !checkoutSrc.includes("coupons.create") &&
      !checkoutSrc.includes("prices.create") &&
      !checkoutSrc.includes("products.create") &&
      !referralValidationSrc.includes("coupons.create")
  );
  ok(
    "Referral: /api/referral/validate requires auth and is rate limited",
    referralValidateRouteSrc.includes("status: 401") &&
      referralValidateRouteSrc.includes("RATE_LIMITS.referralValidate")
  );
  ok(
    "Referral: the admin create route GENERATES the code server-side",
    adminCreateSrc.includes("code: generateReferralCode()")
  );
  ok(
    "Referral: both admin referral routes are guarded by the ADMIN_EMAILS allowlist",
    adminCreateSrc.includes("await requireSoleAdmin()") &&
      adminCreateSrc.includes("status: 403") &&
      adminIdSrc.includes("await requireSoleAdmin()") &&
      adminIdSrc.includes("status: 403")
  );
  ok(
    "Referral: a redeemed code cannot be deleted (the redemption is the audit trail)",
    adminIdSrc.includes("existing.redemption") && adminIdSrc.includes("{ status: 409 }")
  );
  ok(
    "Referral: ReferralRedemption carries BOTH unique constraints in schema.prisma",
    /model ReferralRedemption \{[\s\S]*?@@unique\(\[referralCodeId\]\)[\s\S]*?@@unique\(\[userId\]\)[\s\S]*?\}/.test(
      schemaSrc
    )
  );
  ok(
    "Referral: CORE_MIGRATION_SQL creates both unique indexes (production has no migrations dir)",
    migrationSrc.includes('"ReferralRedemption_referralCodeId_key"') &&
      migrationSrc.includes('"ReferralRedemption_userId_key"') &&
      migrationSrc.includes('CREATE TABLE IF NOT EXISTS "ReferralCode"') &&
      migrationSrc.includes('CREATE TABLE IF NOT EXISTS "ReferralRedemption"')
  );
  ok(
    "Referral: the /checkout page exists, is auth-gated and renders the client step",
    checkoutPageSrc.includes('redirect(`/login?callbackUrl=') &&
      checkoutPageSrc.includes("<CheckoutClient")
  );
  ok(
    "Referral: the /checkout client starts the Stripe session with the code",
    checkoutClientSrc.includes('from "@/lib/start-checkout"') &&
      checkoutClientSrc.includes("startCheckout(plan, term, cadence, code.trim() || undefined)")
  );
  ok(
    "Referral: the /checkout page shows no Pay button while payments are not live",
    checkoutClientSrc.includes("paymentsLive ?") && checkoutClientSrc.includes("<ContactModal")
  );
  ok(
    "Referral: the admin tab is wired into admin-client as its own tab",
    adminClientSrc.includes('"referrals"') &&
      adminClientSrc.includes("<ReferralCodesTab />") &&
      adminClientSrc.includes('["referrals", "Referral Codes", Tag]')
  );
  ok(
    "Referral: the admin tab is a client component",
    adminTabSrc.trimStart().startsWith('"use client"')
  );
  ok(
    "Referral: the webhook CONFIRMS a paid reservation (so it is never swept as stale)",
    webhookSrc.includes("await confirmReferralRedemption(session)") &&
      webhookSrc.includes('status: "CONFIRMED"')
  );

  /* ── PART 6: the three post-deploy hardening fixes ─────────────────────────
   * Each of these guards a failure that is invisible in normal use:
   *   1. a rate limit that is really "limit x warm lambdas",
   *   2. an admin list that grows without bound,
   *   3. a payable session that outlives the reservation it was priced under.
   */

  // 1. Distributed rate limiting.
  ok(
    "Rate limit: a Postgres-backed shared store exists (not just per-instance memory)",
    rateLimitSrc.includes("async function checkPostgres(") &&
      rateLimitSrc.includes('windowResult(Number(row.count), Number(row.ttl), rule, "postgres")')
  );
  ok(
    "Rate limit: the shared store is tried BEFORE the in-memory fallback",
    rateLimitSrc.indexOf("const postgres = await checkPostgres(") > 0 &&
      rateLimitSrc.indexOf("const postgres = await checkPostgres(") <
        rateLimitSrc.indexOf("return checkMemory(key, rule, now)")
  );
  ok(
    "Rate limit: the counter increment is ONE atomic upsert, not read-then-write",
    // A SELECT-then-UPDATE would let two lambdas both read 3 and both write 4.
    rateLimitSharedSrc.includes('ON CONFLICT ("key") DO UPDATE') &&
      rateLimitSharedSrc.includes('"RateLimitCounter"."count" + 1') &&
      !/SELECT[\s\S]{0,200}?FROM "RateLimitCounter"/i.test(rateLimitSharedSrc)
  );
  ok(
    "Rate limit: CORE_MIGRATION_SQL creates RateLimitCounter (no migrations dir)",
    migrationSrc.includes('CREATE TABLE IF NOT EXISTS "RateLimitCounter"') &&
      schemaSrc.includes("model RateLimitCounter {")
  );
  ok(
    "Rate limit: every result reports WHICH store answered, and degradation is flagged",
    rateLimitSharedSrc.includes('export type RateLimitStore = "redis" | "postgres" | "memory"') &&
      rateLimitSharedSrc.includes("degraded: true") &&
      rateLimitSrc.includes("function warnDegraded(")
  );
  ok(
    "Rate limit: referralValidate FAILS CLOSED when no shared store is available",
    // The 20/15min cap is the anti-guessing control; an inflated cap is not it.
    referralValidateRouteSrc.includes('onSharedStoreUnavailable: "deny"') &&
      referralValidateRouteSrc.includes("rateLimitUnavailableResponse(limit)") &&
      rateLimitSrc.includes('export function rateLimitUnavailableResponse(')
  );
  ok(
    "Rate limit: a degraded refusal is 503, not a false 429 'too many attempts'",
    /status: 503[\s\S]{0,200}RATE_LIMIT_UNAVAILABLE|RATE_LIMIT_UNAVAILABLE[\s\S]{0,200}status: 503/.test(
      rateLimitSrc
    )
  );

  // 2. Bounded admin list.
  ok(
    "Referral admin list: paginated with a HARD page-size cap",
    adminCreateSrc.includes("const MAX_PAGE_SIZE = 100") &&
      adminCreateSrc.includes("take: pageSize") &&
      adminCreateSrc.includes("skip: (safePage - 1) * pageSize") &&
      adminCreateSrc.includes("Math.min(MAX_PAGE_SIZE, Math.max(1, requestedSize))")
  );
  ok(
    "Referral admin list: no per-row redemption join (batched queries instead)",
    !adminCreateSrc.includes("redemption: {") &&
      adminCreateSrc.includes("referralRedemption.findMany(") &&
      adminCreateSrc.includes("referralCodeId: { in: codeIds }")
  );
  ok(
    "Referral admin list: the member lookup is batched and only for referenced ids",
    // `prisma.user.findMany` over the distinct ids the page's redemptions point
    // at — not a `user` include hanging off every code row.
    adminCreateSrc.includes("select: { id: true, email: true, name: true }") &&
      adminCreateSrc.includes("id: { in: userIds }") &&
      adminCreateSrc.includes("new Set(redemptions.map((row) => row.userId))")
  );
  ok(
    "Referral admin list: response envelope still feeds the tab's row shape",
    adminCreateSrc.includes("items,") &&
      adminCreateSrc.includes("totalPages,") &&
      adminTabSrc.includes("data.items") &&
      adminTabSrc.includes("row.redemption.user.email")
  );

  // 3. Session expiry vs reservation TTL.
  ok(
    "Checkout: the Stripe session carries expires_at derived from the session TTL",
    checkoutSrc.includes("expires_at: Math.floor((Date.now() + REFERRAL_SESSION_TTL_MS) / 1000)")
  );
  ok(
    "Checkout: REFERRAL_SESSION_TTL_MS is within Stripe's 30min–24h window",
    (() => {
      const minutes = Number(
        /export const REFERRAL_SESSION_TTL_MS = (\d+) \* 60 \* 1000;/.exec(referralValidationSrc)?.[1]
      );
      return Number.isFinite(minutes) && minutes >= 30 && minutes <= 24 * 60;
    })()
  );
  ok(
    "Checkout: the reservation TTL is STRICTLY greater than the session TTL",
    // 🔴 This ordering is the whole fix. If the reservation is released first, a
    // stale session can still be paid after its row is gone — discount honoured,
    // single-use code unclaimed, redeemable again.
    (() => {
      const session = Number(
        /export const REFERRAL_SESSION_TTL_MS = (\d+) \* 60 \* 1000;/.exec(referralValidationSrc)?.[1]
      );
      const reservation = Number(
        /export const REFERRAL_RESERVATION_TTL_MS = (\d+) \* 60 \* 1000;/.exec(
          referralValidationSrc
        )?.[1]
      );
      return Number.isFinite(session) && Number.isFinite(reservation) && reservation > session;
    })()
  );

  // ── PART 5: an abandoned checkout must not block the member ──────────────
  // Regression guard. The first version rejected on ANY existing row, so a member
  // who reached Stripe and clicked "back" was told "You have already used a
  // referral code on this account" for 30 minutes — false, on a payment page, for
  // the most common user action. A RESERVED row is the member's own pending hold
  // and must be REUSED, not treated as a prior use.
  ok(
    "Referral: a member's own RESERVED hold is REUSED, never treated as a prior use",
    classifyExistingRedemption({ status: "RESERVED" }) === "REUSE"
  );
  ok(
    "Referral: a CONFIRMED redemption still blocks the member permanently",
    classifyExistingRedemption({ status: "CONFIRMED" }) === "BLOCKED"
  );
  ok(
    "Referral: no existing row means nothing to reuse and nothing to block",
    classifyExistingRedemption(null) === "NONE" &&
      classifyExistingRedemption(undefined) === "NONE"
  );
  ok(
    "Referral: an unknown redemption status fails CLOSED (blocks)",
    classifyExistingRedemption({ status: "SOMETHING_NEW" }) === "BLOCKED"
  );
  // The per-CODE half of the rule. Without this exception the validator rejects at
  // step 4 ("that code has already been used") BEFORE the per-member check, so a
  // same-code retry — the dominant case — would still be blocked and the whole
  // reuse path would be unreachable.
  ok(
    "Referral: a code held by THIS member's own pending hold is not 'already redeemed'",
    isOwnPendingHold({ userId: "u1", status: "RESERVED" }, "u1") === true
  );
  ok(
    "Referral: a code held by ANOTHER member is still 'already redeemed'",
    isOwnPendingHold({ userId: "u2", status: "RESERVED" }, "u1") === false
  );
  ok(
    "Referral: this member's own CONFIRMED redemption is not a reusable hold",
    isOwnPendingHold({ userId: "u1", status: "CONFIRMED" }, "u1") === false
  );
  ok(
    "Referral: an unheld code is not anybody's hold",
    isOwnPendingHold(null, "u1") === false && isOwnPendingHold(undefined, "u1") === false
  );
  ok(
    "Referral: the validator applies that exception at the per-code step",
    referralValidationSrc.includes("isOwnPendingHold(row.redemption, input.userId)") &&
      /if \(row\.redemption && !heldByThisMember\) return reject\("ALREADY_REDEEMED"\)/.test(
        referralValidationSrc
      )
  );
  ok(
    "Referral: the validator consults that verdict instead of blocking on any row",
    referralValidationSrc.includes("classifyExistingRedemption(existing)") &&
      !referralValidationSrc.includes('if (existing) return reject("ALREADY_USED_BY_MEMBER")')
  );
  ok(
    "Referral: the validator hands back the reusable reservation id",
    referralValidationSrc.includes("reservationId: string | null") &&
      referralValidationSrc.includes("reservationId: verdict === \"REUSE\"")
  );
  ok(
    "Referral: checkout reassigns a reused hold with ONE updateMany (no delete-then-insert)",
    checkoutSrc.includes("referralRedemption.updateMany(") &&
      // Formatting-tolerant: the `where` block is multi-line now that the lock
      // condition lives in it.
      /referralRedemption\.updateMany\(\{[\s\S]{0,400}?where: \{[\s\S]{0,200}?id: check\.reservationId,[\s\S]{0,200}?status: "RESERVED"/.test(
        checkoutSrc
      ) &&
      /referralCodeId,\s*reservedAt: new Date\(\),\s*stripeSessionId: null/.test(checkoutSrc) &&
      !checkoutSrc.includes("referralRedemption.deleteMany({ where: { id: check.reservationId")
  );
  ok(
    "Referral: a zero-count reassignment (concurrently confirmed) becomes a 409",
    /if \(count === 0\)[\s\S]{0,400}CHECKOUT_IN_PROGRESS[\s\S]{0,80}\{ status: 409 \}/.test(
      checkoutSrc
    )
  );
  // The optimistic lock. Without it two concurrent submits from the same member
  // each reassign the same row and each open a discounted session, so a single-use
  // code would be applied twice — a real leak of "can only be redeemed once".
  ok(
    "Referral: reuse is conditional on the hold being older than the 10s lock window",
    checkoutSrc.includes("REFERRAL_REUSE_LOCK_MS = 10_000") &&
      /referralRedemption\.updateMany\(\{[\s\S]{0,400}reservedAt: \{ lt: lockCutoff \}/.test(
        checkoutSrc
      )
  );
  ok(
    "Referral: the lock is computed from the current time, not a fixed date",
    /const lockCutoff = new Date\(Date\.now\(\) - REFERRAL_REUSE_LOCK_MS\)/.test(checkoutSrc)
  );
  ok(
    "Referral: CHECKOUT_IN_PROGRESS exists in the one message map, with member-facing copy",
    /CHECKOUT_IN_PROGRESS:\s*\n?\s*"A checkout is already in progress for this code\. Wait a moment and try again\."/.test(
      referralValidationSrc
    )
  );
  ok(
    "Referral: the lock rejection never falls through to applying the discount unreserved",
    /if \(count === 0\) \{[\s\S]{0,600}return NextResponse\.json/.test(checkoutSrc) &&
      /count === 0[\s\S]{0,600}\{ status: 409 \}/.test(checkoutSrc)
  );
  ok(
    "Referral: the Pay button cannot fire a second POST while one is in flight",
    checkoutClientSrc.includes("const payInFlight = useRef(false)") &&
      checkoutClientSrc.includes("if (payInFlight.current) return") &&
      /loading=\{paying\}/.test(checkoutClientSrc)
  );
  ok(
    "Referral: a failed session create only releases a hold THIS request created",
    /if \(!reusedReservation\) await releaseReferralReservation\(referralReservationId\)/.test(
      checkoutSrc
    )
  );

  // ── PART 6: the UI must not overstate an undecided reward ────────────────
  ok(
    "Referral: the pending-reward copy never claims a discount was applied",
    !/has been applied/i.test(REFERRAL_REWARD_PENDING_MESSAGE) &&
      /No discount is applied to this order yet/.test(REFERRAL_REWARD_PENDING_MESSAGE)
  );
  ok(
    "Referral: /checkout says 'accepted' for the code, and only claims a discount when one exists",
    checkoutClientSrc.includes("{result.code} accepted.") &&
      /rewardConfigured[\s\S]{0,140}Your referral discount will be applied on your first invoice\./.test(
        checkoutClientSrc
      ) &&
      checkoutClientSrc.includes(": rewardPendingMessage")
  );
}

/**
 * Payments gate.
 *
 * The rule under test: paid checkout may only be reachable when the deployment can
 * actually charge. "The flag is set" is NOT the same as "chargeable" — production was
 * in exactly that state, flag true with all eight price vars absent, so a member could
 * press Pay and get a generic "Checkout failed" from a path that had never been
 * configured. Worse, adding price vars alone would have gone live with no deliberate
 * flip, because the flag was already true.
 *
 * These checks are pure (they pass an env literal) so they never depend on the
 * developer's own environment, and they never print a value.
 */
function verifyPaymentsGate() {
  const read = (relativePath: string) =>
    fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

  const paymentsSrc = read("src/lib/payments.ts");
  const stripeSrc = read("src/lib/stripe.ts");
  const checkoutSrc = read("src/app/api/stripe/checkout/route.ts");

  const ALL: Record<string, string> = {
    NEXT_PUBLIC_PAYMENTS_ENABLED: "true",
    STRIPE_SECRET_KEY: "sk_test_fixture",
    ...Object.fromEntries(REQUIRED_PRICE_VARS.map((key) => [key, "price_fixture"])),
  };

  ok(
    "Payments: a fully configured environment is ready",
    paymentsReadiness(ALL).ready === true
  );

  ok(
    "Payments: the intent flag plus a secret is NOT enough on its own",
    // This is the exact production state that made Pay button a dead end.
    paymentsReadiness({
      NEXT_PUBLIC_PAYMENTS_ENABLED: "true",
      STRIPE_SECRET_KEY: "sk_test_fixture",
    }).ready === false
  );

  ok(
    "Payments: flag false closes checkout even when everything else is set",
    paymentsReadiness({ ...ALL, NEXT_PUBLIC_PAYMENTS_ENABLED: "false" }).ready === false
  );

  ok(
    "Payments: the flag must be the literal string 'true'",
    paymentsReadiness({ ...ALL, NEXT_PUBLIC_PAYMENTS_ENABLED: "1" }).ready === false
  );

  ok(
    "Payments: a missing secret closes checkout",
    paymentsReadiness({ ...ALL, STRIPE_SECRET_KEY: "" }).ready === false
  );

  ok(
    "Payments: every missing price var is reported by name (never by value)",
    (() => {
      const r = paymentsReadiness({
        NEXT_PUBLIC_PAYMENTS_ENABLED: "true",
        STRIPE_SECRET_KEY: "sk_test_fixture",
      });
      return (
        r.missingPriceVars.length === REQUIRED_PRICE_VARS.length &&
        r.missingPriceVars.every((name) => REQUIRED_PRICE_VARS.includes(name as never))
      );
    })()
  );

  ok(
    "Payments: one missing ANNUAL price var still closes checkout",
    // The half-configured launch: monthly would sell, annual would 503 in front of a
    // paying member. Fail closed instead.
    (() => {
      const env = { ...ALL };
      delete env.STRIPE_PRICE_CAREER_PRO_ANNUAL;
      const r = paymentsReadiness(env);
      return (
        r.ready === false &&
        r.missingPriceVars.join() === "STRIPE_PRICE_CAREER_PRO_ANNUAL"
      );
    })()
  );

  ok(
    "Payments: eight price vars are required, exactly four of them annual",
    REQUIRED_PRICE_VARS.length === 8 &&
      REQUIRED_PRICE_VARS.filter((key) => key.endsWith("_ANNUAL")).length === 4
  );

  ok(
    "Payments: the required var names are the ones stripe.ts actually reads",
    // A rename on one side only would silently disable checkout at launch.
    REQUIRED_PRICE_VARS.every((key) => stripeSrc.includes(`process.env.${key}`))
  );

  ok(
    "Payments: isCheckoutConfigured is the readiness verdict, not a second rule",
    /export function isCheckoutConfigured\(\): boolean \{\s*return paymentsReadiness\(\)\.ready;/.test(
      paymentsSrc
    )
  );

  ok(
    "Payments: isPaymentsLive reads the env literally so Next can inline it",
    // Next only replaces a STATIC member expression. Routing this through a helper or a
    // destructured `process.env` leaves the lookup dynamic and the client bundle gets
    // `undefined` — which would silently close checkout no matter what Vercel says.
    /export function isPaymentsLive\(\): boolean \{\s*return process\.env\.NEXT_PUBLIC_PAYMENTS_ENABLED === "true";/.test(
      paymentsSrc
    )
  );

  ok(
    "Payments: payments.ts has no imports, so it cannot pull the Stripe SDK into a client bundle",
    // `isPaymentsLive` is imported by client components. One `import { getStripe }`
    // here would ship the whole SDK to the browser.
    !/^import\s/m.test(paymentsSrc)
  );

  ok(
    "Payments: checkout refuses BEFORE resolving a price",
    // If the gate ran after price resolution, an unconfigured deployment would 503 from
    // inside the resolver with a misleading "Checkout failed" instead of the real reason.
    (() => {
      const gate = checkoutSrc.indexOf("isCheckoutConfigured()");
      const price = checkoutSrc.indexOf("resolveStripePriceId(");
      return gate !== -1 && price !== -1 && gate < price;
    })()
  );

  ok(
    "Payments: the closed-checkout response carries a machine-readable reason",
    checkoutSrc.includes('reason: "PAYMENTS_NOT_CONFIGURED"')
  );

  ok(
    "Payments: the closed path logs which prerequisite is missing, never a value",
    checkoutSrc.includes("missingPriceVars: readiness.missingPriceVars") &&
      !/console\.error\([^)]*STRIPE_SECRET_KEY/.test(checkoutSrc)
  );

  /* ── Status copy ──────────────────────────────────────────────────────────
   * The public status for a closed checkout is "Coming soon". The four surfaces
   * that state it must read the shared constants, because four hand-typed copies
   * of one sentence is how a status ends up contradicting itself.
   * ──────────────────────────────────────────────────────────────────────── */

  const accountBillingSrc = read("src/components/account/account-billing-section.tsx");
  const checkoutClientSrc = read("src/app/checkout/checkout-client.tsx");
  const portalSrc = read("src/app/api/stripe/portal/route.ts");

  ok(
    "Payments: the public status label is exactly 'Coming soon'",
    PAYMENTS_STATUS_LABEL === "Coming soon"
  );

  ok(
    "Payments: no status copy uses internal engineering wording",
    // "on hold", "not live yet", "before go-live" and "paid files" all read as an
    // internal note leaked into the UI — a member cannot tell what they should do.
    !Object.values(PAYMENTS_STATUS_COPY).some((line) =>
      /on hold|not live|not open yet|go-live|paid files|PayNow|Stripe/i.test(line)
    )
  );

  ok(
    "Payments: every status string is non-empty, and body copy is a whole sentence",
    // A heading must NOT take a full stop; body and error copy must. One rule for both
    // would either punctuate a heading wrongly or leave a sentence dangling.
    Object.entries(PAYMENTS_STATUS_COPY).every(([key, line]) => {
      const text = line.trim();
      if (text.length < 10) return false;
      const isBody = /Body|Note|Error/.test(key);
      return isBody ? /[.!]$/.test(text) : true;
    })
  );

  ok(
    "Payments: all four surfaces read the shared status copy",
    accountBillingSrc.includes("PAYMENTS_STATUS_COPY.accountSubtitle") &&
      accountBillingSrc.includes("PAYMENTS_STATUS_COPY.accountNote") &&
      checkoutClientSrc.includes("PAYMENTS_STATUS_COPY.checkoutTitle") &&
      checkoutClientSrc.includes("PAYMENTS_STATUS_COPY.checkoutBody") &&
      checkoutSrc.includes("PAYMENTS_STATUS_COPY.checkoutApiError") &&
      portalSrc.includes("PAYMENTS_STATUS_COPY.portalApiError")
  );

  ok(
    "Payments: the old status wording is gone from the surfaces that showed it",
    // A leftover copy would be the single most confusing outcome of this change.
    [accountBillingSrc, checkoutClientSrc, checkoutSrc, portalSrc].every(
      (src) =>
        !src.includes("Payments are not live yet") &&
        !src.includes("Paid plans are not open yet") &&
        !src.includes("will be enabled before go-live") &&
        !src.includes("when the paid files are ready")
    )
  );

  ok(
    "Payments: the label is RENDERED as a badge, not merely imported",
    // Importing the constant and not showing it would pass a weaker check.
    accountBillingSrc.includes("<Badge") &&
      accountBillingSrc.includes("{PAYMENTS_STATUS_LABEL}") &&
      checkoutClientSrc.includes("<Badge") &&
      checkoutClientSrc.includes("{PAYMENTS_STATUS_LABEL}")
  );

  ok(
    "Payments: /checkout only promises a payment step when payments are live",
    // "then continue to secure payment" is a lie while checkout is closed — there is
    // no next step. The phrase must live inside the `paymentsLive` branch.
    /\{paymentsLive\s*\?\s*eligible\s*\?/.test(checkoutClientSrc) &&
      checkoutClientSrc.includes(': "Review your plan."')
  );
}

/**
 * Search discovery (canonicals, structured data, manifest).
 *
 * These decide whether a crawler can tell what this site IS, and they fail
 * silently: a missing canonical or an invalid `SearchAction` does not throw, it
 * just quietly costs visibility. So each one is pinned.
 *
 * The rule that matters most: a canonical (and a sitemap entry) may only point at
 * a URL that returns 200 to an anonymous crawler. Every gated route 307s to
 * `/login`, so advertising one would consolidate signals onto a URL Google cannot
 * fetch — worse than having no canonical at all.
 */
async function verifySeoDiscovery() {
  const read = (relativePath: string) =>
    fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

  const layoutSrc = read("src/app/layout.tsx");
  const sitemapSrc = read("src/app/sitemap.ts");
  const robotsSrc = read("src/app/robots.ts");
  const manifestSrc = read("src/app/manifest.ts");

  ok(
    "SEO: every public page declares a canonical pointing at itself",
    CANONICAL_PATHS.every((publicPath) => {
      const file = publicPath === "/" ? "src/app/page.tsx" : `src/app${publicPath}/page.tsx`;
      return read(file).includes(`canonicalAlternates("${publicPath}")`);
    })
  );

  ok(
    "SEO: canonicalAlternates returns a RELATIVE path (resolved by metadataBase)",
    // Absolute canonicals would pin preview deployments to production.
    canonicalAlternates("/pricing").canonical === "/pricing"
  );

  ok(
    "SEO: the canonical set matches the sitemap's public routes exactly",
    // Two lists that must not drift: one feeds canonicals, the other the sitemap.
    (() => {
      const sitemapPaths = [...sitemapSrc.matchAll(/\{\s*path:\s*"([^"]+)"/g)].map((m) => m[1]);
      return (
        sitemapPaths.length === CANONICAL_PATHS.length &&
        CANONICAL_PATHS.every((p) => sitemapPaths.includes(p))
      );
    })()
  );

  ok(
    "SEO: no page title re-interpolates the brand the layout template already appends",
    // The root layout sets `title.template: "%s | CommodityPlay."`, and a template
    // applies to CHILD segments. A page that ALSO writes `${BRAND_NAME}` into its own
    // title therefore renders doubled — "Pricing — CommodityPlay. | CommodityPlay.".
    // That was live in production on /pricing and /starter-pack until this change,
    // confirmed by reading the served <title>. Pages supply their own name only.
    (() => {
      const template = /template:\s*`([^`]*)`/.exec(layoutSrc)?.[1] ?? "";
      if (!template.includes("%s")) return false; // template gone → guard is meaningless
      const offenders = fs
        .readdirSync(path.join(process.cwd(), "src/app"), { recursive: true })
        .map((entry) => `src/app/${String(entry)}`)
        .filter((file) => file.endsWith("page.tsx"))
        .filter((file) => {
          // Strip comments so the ⚠️ notes that MENTION ${BRAND_NAME} don't trip it.
          const src = read(file)
            .replace(/\/\*[\s\S]*?\*\//g, "")
            .replace(/\/\/.*$/gm, "");
          return /title:\s*`[^`]*BRAND_NAME/.test(src);
        });
      return offenders.length === 0;
    })()
  );

  ok(
    "SEO: no GATED route is ever advertised as canonical",
    // These 307 to /login (or 404) for an anonymous crawler.
    !CANONICAL_PATHS.some((p) =>
      ["/playbook", "/glossary", "/account", "/dashboard", "/admin", "/checkout", "/login"].includes(p)
    )
  );

  ok(
    "SEO: the root layout emits Organization + WebSite JSON-LD once per document",
    layoutSrc.includes('type="application/ld+json"') &&
      layoutSrc.includes("JSON.stringify(siteJsonLd())")
  );

  ok(
    "SEO: the JSON-LD entities are well-formed and share one @id namespace",
    (() => {
      const [org, site] = siteJsonLd();
      return (
        org["@type"] === "Organization" &&
        site["@type"] === "WebSite" &&
        org["@id"] === ORGANIZATION_ID &&
        site["@id"] === WEBSITE_ID &&
        org.url === CANONICAL_ORIGIN &&
        (site.publisher as { "@id": string })["@id"] === ORGANIZATION_ID
      );
    })()
  );

  ok(
    "SEO: no SearchAction is declared while the site has no search endpoint",
    // A SearchAction asserts `…?q={search_term_string}` exists. There is no site
    // search yet, so claiming one is invalid structured data. This check is the
    // guard that stops someone adding it "for the sitelinks box" prematurely.
    !/potentialAction|SearchAction/.test(JSON.stringify(siteJsonLd())) &&
      !/SearchAction/.test(
        read("src/lib/seo.ts").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "")
      )
  );

  ok(
    "SEO: robots.txt declares the sitemap and disallows the gated surfaces",
    robotsSrc.includes("sitemap: `${SITE_URL}/sitemap.xml`") &&
      robotsSrc.includes('"/admin"') &&
      robotsSrc.includes('"/api/"')
  );

  ok(
    "SEO: a web manifest exists with a name, start_url and icons",
    manifestSrc.includes("start_url:") &&
      manifestSrc.includes("short_name:") &&
      manifestSrc.includes("icons:") &&
      manifestSrc.includes("display: \"standalone\"")
  );

  ok(
    "SEO: manifest icon sizes match the real PNG dimensions on disk",
    // A manifest that claims 192×192 for a 184px file is a lie the browser can
    // detect, and it fails the PWA installability check either way. Read the IHDR
    // width/height straight out of the PNG header instead of trusting the string.
    (() => {
      const declared = [...manifestSrc.matchAll(/src:\s*"([^"]+)"[\s\S]*?sizes:\s*"(\d+)x(\d+)"/g)].map(
        (m) => ({ src: m[1], w: Number(m[2]), h: Number(m[3]) })
      );
      if (declared.length === 0) return false;
      return declared.every(({ src, w, h }) => {
        const file = path.join(process.cwd(), "public", src.replace(/^\//, ""));
        if (!fs.existsSync(file)) return false;
        const header = fs.readFileSync(file).subarray(0, 24);
        if (header.subarray(1, 4).toString("ascii") !== "PNG") return false;
        return header.readUInt32BE(16) === w && header.readUInt32BE(20) === h;
      });
    })()
  );

  ok(
    "SEO: the manifest is not an app-store listing and claims no Play Store presence",
    // Guards against a future "just point the manifest at a store listing" edit:
    // a Play Store entry is a separate artefact (package id, signing key, review).
    !/play\.google\.com|itunes\.apple\.com/.test(manifestSrc)
  );
}

/**
 * Client ads & shoutouts — the landing section that carries company banners and
 * client quotes on BOTH tracks.
 *
 * Two kinds of check here, and they are not interchangeable:
 *   - EXECUTED checks against `selectClientAds()`, because the visibility rules are
 *     the only thing keeping a hidden or wrong-track row off the live page. A grep
 *     for `.filter(` would pass while the filter was inverted.
 *   - EXECUTED checks against `prepareLandingContentForSave()`, because the
 *     `.default()` on the new CMS group is load-bearing: without it, saving any
 *     OTHER landing field on a payload written before this group existed fails
 *     validation and the owner's edit is rejected.
 */
function verifyClientAds() {
  const read = (relativePath: string) =>
    fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

  const section = DEFAULT_LANDING_CONTENT.clientAds;
  const seeded = section.entries;

  ok("Client ads: the shipped section is populated", seeded.length >= 3, `${seeded.length} rows`);

  ok(
    "Client ads: both card shapes ship, so the owner sees each one",
    seeded.some((e) => e.kind === "ad") && seeded.some((e) => e.kind === "shoutout")
  );

  // 🔴 The legal guard. A fabricated endorsement is a claim, not copy. Every seeded
  // row is invented, so every seeded row must still carry the "Example" tag.
  ok(
    "Client ads: every seeded row is still flagged as a placeholder",
    seeded.every((e) => e.sample === true),
    `${seeded.filter((e) => e.sample === true).length}/${seeded.length} flagged`
  );

  // 🔴 And the specific version of that risk: the members strips name REAL firms.
  // Reusing one of those names here would publish an invented endorsement of a real
  // company, which is worse than any wording bug.
  const realFirms = [
    ...DEFAULT_LANDING_CONTENT.careerMembersStrip.companies,
    ...DEFAULT_LANDING_CONTENT.salesMembersStrip.companies,
  ].map((name) => name.trim().toLowerCase());
  const collisions = seeded
    .map((e) => e.company.trim().toLowerCase())
    .filter((name) => realFirms.includes(name));
  ok(
    "Client ads: no placeholder row reuses a real firm from the members strip",
    collisions.length === 0,
    collisions.length ? collisions.join(", ") : `${realFirms.length} real names avoided`
  );

  const ids = seeded.map((e) => e.id);
  ok(
    "Client ads: row ids are present and unique",
    ids.every((id) => id.trim().length > 0) && new Set(ids).size === ids.length
  );

  // Neither persona may open the page to an empty section out of the box.
  ok(
    "Client ads: the shipped rows cover career, sales and both",
    (["career", "sales", "both"] as const).every((track) =>
      seeded.some((e) => e.track === track)
    )
  );

  const careerRows = selectClientAds(section, "career");
  const salesRows = selectClientAds(section, "sales");

  ok(
    "Client ads: the career track gets only career and both rows",
    careerRows.length > 0 && careerRows.every((e) => e.track === "career" || e.track === "both"),
    `${careerRows.length} rows`
  );
  ok(
    "Client ads: the sales track gets only sales and both rows",
    salesRows.length > 0 && salesRows.every((e) => e.track === "sales" || e.track === "both"),
    `${salesRows.length} rows`
  );
  ok(
    "Client ads: a sales-only row never leaks onto the career page",
    !careerRows.some((e) => e.track === "sales") && !salesRows.some((e) => e.track === "career")
  );

  // Named separately from the leak checks above, because "no sales row on the career
  // page" is satisfied by a filter that drops `both` rows too — it would hide the
  // shared row from BOTH pages and still pass every leak assertion.
  ok(
    "Client ads: a both-tracks row appears on both pages",
    seeded.some((e) => e.track === "both" && e.visible) &&
      careerRows.some((e) => e.track === "both") &&
      salesRows.some((e) => e.track === "both")
  );

  // Order is the admin's order — a reorder in the panel must survive selection.
  ok(
    "Client ads: selection preserves CMS order",
    careerRows.map((e) => e.id).join(",") ===
      seeded.filter((e) => e.track === "career" || e.track === "both").map((e) => e.id).join(",")
  );

  const withHidden = {
    ...section,
    entries: seeded.map((e) => (e.id === seeded[0].id ? { ...e, visible: false } : e)),
  };
  ok(
    "Client ads: an unticked row renders on NEITHER track",
    !selectClientAds(withHidden, "career").some((e) => e.id === seeded[0].id) &&
      !selectClientAds(withHidden, "sales").some((e) => e.id === seeded[0].id)
  );

  ok(
    "Client ads: removing every row retires the section instead of throwing",
    selectClientAds({ ...section, entries: [] }, "career").length === 0 &&
      selectClientAds({ ...section, entries: [] }, "sales").length === 0 &&
      selectClientAds(undefined, "career").length === 0
  );

  ok(
    "Client ads: the admin track dropdown offers exactly the three track values",
    Object.keys(CLIENT_AD_TRACK_LABELS).sort().join(",") === "both,career,sales"
  );

  ok(
    "Client ads: monogram never exceeds two characters",
    ["Meridian Agri Group", "Sable & Co. Commodities", "Vitol", "—"].every(
      (name) => clientAdInitials(name).length >= 1 && clientAdInitials(name).length <= 2
    ),
    ["Meridian Agri Group", "Sable & Co. Commodities", "Vitol", "—"]
      .map((n) => clientAdInitials(n))
      .join(" / ")
  );

  // ── The CMS save path ────────────────────────────────────────────────────
  const legacyPayload = { ...DEFAULT_LANDING_CONTENT } as Record<string, unknown>;
  delete legacyPayload.clientAds;

  // ⚠️ Parse with the SCHEMA, not `prepareLandingContentForSave`. That wrapper runs
  // a repair loop which backfills a missing group from the defaults, so it passes
  // whether or not the group is declared with `.default()`. Only the raw parse
  // isolates the invariant the schema comment claims.
  const rawLegacy = landingContentSchema.safeParse(legacyPayload);
  ok(
    "Client ads: the group is declared with .default(), so an old payload parses",
    rawLegacy.success && rawLegacy.data.clientAds.entries.length === seeded.length,
    rawLegacy.success
      ? undefined
      : formatLandingValidationErrors(rawLegacy) ?? "schema rejected the payload"
  );

  const legacySave = prepareLandingContentForSave(legacyPayload);
  ok(
    "Client ads: saving any other field on a pre-existing payload still succeeds",
    legacySave.success && legacySave.data.clientAds.entries.length === seeded.length,
    legacySave.success ? undefined : formatLandingValidationErrors(legacySave) ?? undefined
  );

  const emptied = prepareLandingContentForSave({
    ...DEFAULT_LANDING_CONTENT,
    clientAds: { ...section, entries: [] },
  });
  ok(
    "Client ads: deleting every row is a valid save, not a validation error",
    emptied.success && emptied.data.clientAds.entries.length === 0,
    emptied.success ? undefined : formatLandingValidationErrors(emptied) ?? undefined
  );

  const badTrack = prepareLandingContentForSave({
    ...DEFAULT_LANDING_CONTENT,
    clientAds: {
      ...section,
      entries: [{ ...seeded[0], track: "enterprise" }],
    },
  });
  ok(
    "Client ads: an unknown track value is rejected rather than rendered everywhere",
    badTrack.success === false
  );

  // ── Render wiring ────────────────────────────────────────────────────────
  const sectionSrc = read("src/components/landing/client-ads-section.tsx");
  const careerSrc = read("src/components/landing/landing-page-client.tsx");
  const salesSrc = read("src/components/landing/sales-landing-panel.tsx");
  const adminSrc = read("src/app/admin/admin-landing-editor.tsx");

  ok(
    "Client ads: the section filters through selectClientAds, never over raw entries",
    // Mapping `content.entries` directly would bypass `visible` and `track` in one
    // line and still look correct in the source.
    sectionSrc.includes("selectClientAds(content, track)") &&
      !sectionSrc.includes("content.entries.map(")
  );

  ok(
    "Client ads: the career page renders the section with its own track",
    careerSrc.includes("<ClientAdsSection") && careerSrc.includes('track="career"')
  );
  ok(
    "Client ads: the sales page renders the section with its own track",
    salesSrc.includes("<ClientAdsSection") && salesSrc.includes('track="sales"')
  );
  ok(
    "Client ads: the sales panel actually receives the shared list",
    careerSrc.includes("clientAds={content.clientAds}") &&
      salesSrc.includes("clientAds: LandingContent[\"clientAds\"]")
  );

  ok(
    "Client ads: the admin panel can add, remove and hide rows",
    adminSrc.includes("function ClientAdsEditor") &&
      adminSrc.includes("Add ad") &&
      adminSrc.includes("Add shoutout") &&
      adminSrc.includes("removeEntry") &&
      adminSrc.includes("{ visible: e.target.checked }")
  );

  ok(
    "Client ads: the placeholder flag is editable, so the tag can be removed",
    adminSrc.includes("Placeholder (shows an") && adminSrc.includes("{ sample: e.target.checked }")
  );
}

void verifyPdfStampWrites()
  .then(() => verifyCountryWaitlistCms())
  .then(() => verifySalesNudgesTweaks())
  .then(() => verifyReferralCodes())
  .then(() => verifySeoDiscovery())
  .then(() => {
    verifyClientAds();
  })
  .then(() => {
    verifyPaymentsGate();
  })
  .then(() => {
    console.log(failed === 0 ? "\n✅ All feedback/CMS checks passed." : `\n❌ ${failed} check(s) failed.`);
    process.exit(failed === 0 ? 0 : 1);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
