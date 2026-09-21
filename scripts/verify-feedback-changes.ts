/**
 * Feedback + CMS fix verification — run with: npx tsx scripts/verify-feedback-changes.ts
 */
import { DEFAULT_LANDING_CONTENT } from "../src/data/landing-content";
import { mergeLandingContent } from "../src/lib/content/merge";
import { hydrateLandingCaseStudyCards } from "../src/lib/content/landing-case-study-preview";
import {
  prepareLandingContentForSave,
  formatLandingValidationErrors,
} from "../src/lib/content/landing-schema";
import { resolveMemberPersonaLabel } from "../src/lib/persona-display";
import { getDemoAccountDisplayPersona } from "../src/data/demo-accounts";
import { DEMO_ACCOUNTS } from "../src/data/demo-accounts";
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
    "Case study hero stats use light mint cards for N stats",
    caseDetail.includes("CASE_STUDY_HERO_STAT_BG") &&
      caseDetail.includes("auto-fit") &&
      caseDetail.includes("text-primary-800") &&
      CASE_STUDY_HERO_STAT_BG === "#F0FDF4" &&
      !caseDetail.includes("bg-white/5")
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
      DEFAULT_SALES_MARKET_NUDGES_CONTENT.weeklyHeading === "This Week — Talking Points" &&
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
      }).weeklyHeading === "This Week — Talking Points" &&
      normalizeSalesMarketNudgesPayload({
        ...DEFAULT_SALES_MARKET_NUDGES_CONTENT,
        weeklyHeading: "   ",
        briefsHeading: "",
      }).briefsHeading === "Talking Points"
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

void verifyPdfStampWrites()
  .then(() => {
    console.log(failed === 0 ? "\n✅ All feedback/CMS checks passed." : `\n❌ ${failed} check(s) failed.`);
    process.exit(failed === 0 ? 0 : 1);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
