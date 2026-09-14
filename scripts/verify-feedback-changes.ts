/**
 * Feedback + CMS fix verification — run with: npx tsx scripts/verify-feedback-changes.ts
 */
import { DEFAULT_LANDING_CONTENT } from "../src/data/landing-content";
import { mergeLandingContent } from "../src/lib/content/merge";
import {
  prepareLandingContentForSave,
  formatLandingValidationErrors,
} from "../src/lib/content/landing-schema";
import { resolveMemberPersonaLabel } from "../src/lib/persona-display";
import { getDemoAccountDisplayPersona } from "../src/data/demo-accounts";
import { DEMO_ACCOUNTS } from "../src/data/demo-accounts";
import { CHAPTERS, PLAYBOOK_TOTAL_CHAPTERS } from "../src/data/playbook";
import playbookSections from "../src/data/playbook-sections.json";
import { resolvePlaybookPayload } from "../src/lib/content/playbook-payload";
import { LEGACY_SALES_TALKING_POINT_TITLES, SALES_MARKET_NOTE } from "../src/data/market-notes";
import { defaultSalesEdgeNote, resolveSalesTalkingPoints } from "../src/lib/content/edge-notes";
import { SALES_SECTION_MINT } from "../src/lib/sales-brand-colors";
import { mergeStarterEmailDigest, splitLegacyDigestTopicLine } from "../src/data/starter-pack";
import { isDashboardModuleVisible, memberMayAccessCareerPlaybook } from "../src/lib/dashboard-module-visibility";
import { formatCreditMonthLabel } from "../src/lib/mentor-credits";
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
  DEFAULT_SALES_DASHBOARD_RESOURCE_CARDS,
} from "../src/data/member-dashboard";
import { DEFAULT_SITE_FOOTER } from "../src/data/footer-content";
import { mergeSiteFooterContent } from "../src/lib/content/footer-schema";
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
  }
  {
    const contactModal = fs.readFileSync(
      path.join(process.cwd(), "src/components/landing/contact-modal.tsx"),
      "utf8"
    );
    ok("Contact modal has no Or email fallback line", !contactModal.includes("Or email"));
  }
  {
    const mentorApply = fs.readFileSync(
      path.join(process.cwd(), "src/app/mentor-apply/page.tsx"),
      "utf8"
    );
    ok("Mentor years placeholder is e.g. 20", mentorApply.includes('placeholder="e.g. 20"'));
    ok(
      "Mentor commodity focus placeholder lists Gasoil and Base Metals",
      mentorApply.includes("Primary commodity focus") &&
        mentorApply.includes("e.g. Gasoil, LNG, Power, Base Metals")
    );
    ok(
      "Mentor experience placeholder uses market background and desks / functions",
      mentorApply.includes("commodity market background") &&
        mentorApply.includes("desks / functions")
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
    "Sales-only tools are Sales-tracked",
    DEFAULT_SALES_DASHBOARD_RESOURCE_CARDS.every((c) => c.track === "Sales")
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
      landingEditor.includes("afterSalesTrackTools")
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
      !salesPanel.includes("Sales Market Nudges | Prep Library")
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
}

{
  const caseEditor = fs.readFileSync(
    path.join(process.cwd(), "src/app/admin/editors/case-studies-editor.tsx"),
    "utf8"
  );
  ok(
    "Case studies admin reads payload.studies not a top-level array",
    caseEditor.includes("studies: Array.isArray(data.studies)") &&
      caseEditor.includes("onChange({ studies: nextStudies, details: nextDetails })")
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

void verifyPdfStampWrites()
  .then(() => {
    console.log(failed === 0 ? "\n✅ All feedback/CMS checks passed." : `\n❌ ${failed} check(s) failed.`);
    process.exit(failed === 0 ? 0 : 1);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
