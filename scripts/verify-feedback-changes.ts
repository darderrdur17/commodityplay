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
import { PLAYBOOK_TOTAL_CHAPTERS } from "../src/data/playbook";
import { mergeStarterEmailDigest, splitLegacyDigestTopicLine } from "../src/data/starter-pack";
import { isDashboardModuleVisible, memberMayAccessCareerPlaybook } from "../src/lib/dashboard-module-visibility";
import { formatCreditMonthLabel } from "../src/lib/mentor-credits";
import {
  formatMemberWatermarkLine,
  sanitizeWatermarkText,
  shouldWatermarkPaidPdf,
} from "../src/lib/content/pdf-watermark";
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
      merged.chapterCoverage.titleAccent === "Entire Market Spectrum."
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
}

console.log(failed === 0 ? "\n✅ All feedback/CMS checks passed." : `\n❌ ${failed} check(s) failed.`);
process.exit(failed === 0 ? 0 : 1);
