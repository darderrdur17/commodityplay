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

console.log(failed === 0 ? "\n✅ All feedback/CMS checks passed." : `\n❌ ${failed} check(s) failed.`);
process.exit(failed === 0 ? 0 : 1);
