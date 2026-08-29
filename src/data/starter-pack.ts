import type { MarketNoteTopic } from "@/data/market-notes";

export interface StarterEmailDigest {
  eyebrow: string;
  title: string;
  communityDescription: string;
  /** @deprecated Migrated into communityDescription on read */
  careerDescription?: string;
  /** @deprecated Migrated into communityDescription on read */
  salesDescription?: string;
  /** @deprecated Migrated into communityDescription on read */
  description?: string;
  frequency: string;
  topics: MarketNoteTopic[];
  confirmedText: string;
}

export const STARTER_EMAIL_DIGEST: StarterEmailDigest = {
  eyebrow: "Weekly · Community Digest",
  title: "Market Note That Builds Your Professional Desk Credibility",
  communityDescription:
    "Not just a market digest — a community briefing for Starter members. Each note breaks down what's moving markets and how the desk would explain it, so you walk into any conversation sounding like you're rooted to the same space.",
  frequency: "Weekly",
  topics: [
    {
      tag: "Desk Truths",
      tagColor: "#15803d",
      tagBg: "#dcfce7",
      title: "How a physical trader sizes a position — the logic behind the number",
    },
    {
      tag: "Market Pulse",
      tagColor: "#2563eb",
      tagBg: "#dbeafe",
      title: "Why the EIA draw didn't move flat price — and how to explain that on the desk",
    },
    {
      tag: "Desk Tactics",
      tagColor: "#b45309",
      tagBg: "#fef3c7",
      title: 'What "commercial awareness" actually means in a commodity conversation',
    },
    {
      tag: "Interview",
      tagColor: "#7c3aed",
      tagBg: "#ede9fe",
      title: "Five questions every commodity trading interview asks — and what they're testing",
    },
    {
      tag: "Position",
      tagColor: "#991b1b",
      tagBg: "#fee2e2",
      title: "How to position a non-commodity background as commercial experience",
    },
  ],
  confirmedText: "You're subscribed. First note lands on the next weekly send.",
};

export function mergeStarterEmailDigest(
  cms: Partial<StarterEmailDigest> | null | undefined,
  defaults: StarterEmailDigest = STARTER_EMAIL_DIGEST
): StarterEmailDigest {
  const raw = cms ?? {};
  const legacyDesc = raw.description?.trim();
  const communityDescription =
    raw.communityDescription?.trim() ||
    legacyDesc ||
    raw.careerDescription?.trim() ||
    raw.salesDescription?.trim() ||
    defaults.communityDescription;

  return {
    eyebrow: raw.eyebrow?.trim() || defaults.eyebrow,
    title: raw.title?.trim() || defaults.title,
    communityDescription,
    frequency: raw.frequency?.trim() || defaults.frequency,
    topics: raw.topics?.length ? raw.topics : defaults.topics,
    confirmedText: raw.confirmedText?.trim() || defaults.confirmedText,
  };
}

export function resolveStarterMarketNote(digest: StarterEmailDigest) {
  return {
    eyebrow: digest.eyebrow,
    title: digest.title,
    description: digest.communityDescription,
    topics: digest.topics,
    subscribed: digest.confirmedText,
  };
}

export interface StarterInfographic {
  id: string;
  num: string;
  title: string;
  description: string;
  /** Preview image shown on the card (public). */
  thumbKey: string;
  thumbAssetId?: string;
  thumbFileName?: string;
  /** @deprecated Gradient fallback — use thumbKey upload instead. */
  thumbClass?: string;
  fileKey: string;
  assetId?: string;
  fileName?: string;
  delivery?: "view-only" | "download";
}

export function starterInfographicThumbKey(id: string): string {
  return `starter-pack/thumbs/${id}.png`;
}

export const STARTER_INFOGRAPHICS: StarterInfographic[] = [
  {
    id: "ecosystem-map",
    num: "01",
    title: "Commodity Trading Ecosystem Map",
    description: "Every player connected — from upstream producers to end consumers.",
    thumbKey: starterInfographicThumbKey("ecosystem-map"),
    fileKey: "starter-pack/ecosystem-map.pdf",
  },
  {
    id: "lng-flow",
    num: "02",
    title: "LNG Cargo Flow Mechanics",
    description: "From liquefaction plant to regasification terminal — the full journey.",
    thumbKey: starterInfographicThumbKey("lng-flow"),
    fileKey: "starter-pack/lng-flow.pdf",
  },
  {
    id: "crack-spread",
    num: "03",
    title: "Crack Spread Guide",
    description: "The refinery margin signal — 3-2-1 formula, seasonal patterns, what it tells you.",
    thumbKey: starterInfographicThumbKey("crack-spread"),
    fileKey: "starter-pack/crack-spread.pdf",
  },
  {
    id: "benchmarks",
    num: "04",
    title: "Price Benchmarks 101",
    description: "Brent, WTI, Dubai, JKM, TTF — why each exists and who uses them.",
    thumbKey: starterInfographicThumbKey("benchmarks"),
    fileKey: "starter-pack/benchmarks.pdf",
  },
  {
    id: "trade-finance",
    num: "05",
    title: "Trade Finance Flow",
    description: "Letters of credit, tolling, pre-finance — how commodity deals get funded.",
    thumbKey: starterInfographicThumbKey("trade-finance"),
    fileKey: "starter-pack/trade-finance.pdf",
  },
];

/** @deprecated Use STARTER_EMAIL_DIGEST + resolveStarterMarketNote */
export const STARTER_MARKET_NOTE = {
  eyebrow: STARTER_EMAIL_DIGEST.eyebrow,
  title: STARTER_EMAIL_DIGEST.title,
  description: STARTER_EMAIL_DIGEST.communityDescription,
  topics: STARTER_EMAIL_DIGEST.topics,
  subscribed: STARTER_EMAIL_DIGEST.confirmedText,
};

export interface StarterPackHero {
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
}

export const STARTER_PACK_HERO: StarterPackHero = {
  eyebrow: "Free · Starter Pack",
  title: "Your desk-ready starter resources.",
  description:
    "Five infographics, a weekly community email, Chapter A preview, and the full Desk Glossary — free, forever.",
  ctaLabel: "Get the Starter Pack",
};

export function mergeStarterPackHero(
  cms: Partial<StarterPackHero> | null | undefined,
  defaults: StarterPackHero = STARTER_PACK_HERO
): StarterPackHero {
  const raw = cms ?? {};
  return {
    eyebrow: raw.eyebrow?.trim() || defaults.eyebrow,
    title: raw.title?.trim() || defaults.title,
    description: raw.description?.trim() || defaults.description,
    ctaLabel: raw.ctaLabel?.trim() || defaults.ctaLabel,
  };
}

export interface StarterUpgradeCta {
  title: string;
  description: string;
  buttonLabel: string;
}

export const STARTER_UPGRADE_CTA: StarterUpgradeCta = {
  title: "Ready for the full playbook?",
  description:
    "Unlock all {chapterCount} chapters, resume templates, career roadmap, interview prep, and practitioner guides.",
  buttonLabel: "Unlock",
};

export function mergeStarterUpgradeCta(
  cms: Partial<StarterUpgradeCta> | null | undefined,
  defaults: StarterUpgradeCta = STARTER_UPGRADE_CTA
): StarterUpgradeCta {
  const raw = cms ?? {};
  return {
    title: raw.title?.trim() || defaults.title,
    description: raw.description?.trim() || defaults.description,
    buttonLabel: raw.buttonLabel?.trim() || defaults.buttonLabel,
  };
}

export const STARTER_CHAPTER_PREVIEW = {
  label: "Chapter A · Free Preview",
  title: "Industry Foundations",
  /** Chapter A sections unlocked for Starter (first N sections). */
  freeSections: 3,
  totalSections: 8,
  sections: [
    { id: "a1", number: "A.1", title: "What is Physical Commodity Trading?", free: true },
    { id: "a2", number: "A.2", title: "The Energy Markets Landscape", free: true },
    { id: "a3", number: "A.3", title: "How a Trade Makes Money", free: true },
    { id: "a4", number: "A.4", title: "Refinery Economics & Crack Spreads", free: false },
    { id: "a5", number: "A.5", title: "Shipping, Freight & Cargo Economics", free: false },
    { id: "a6", number: "A.6", title: "Storage, Terminals & Inventory", free: false },
    { id: "a7", number: "A.7", title: "The Role of Price Reporting Agencies", free: false },
    { id: "a8", number: "A.8", title: "Risk Management on the Desk", free: false },
  ],
};

/** Starter playbook access — first 3 sections of Chapter A only. */
export function isStarterPlaybookSectionUnlocked(
  chapterId: string,
  sectionIndex: number,
  hasPlaybookAccess: boolean,
  chapterPreview = false
): boolean {
  if (hasPlaybookAccess) return true;
  if (chapterId === "a") return sectionIndex < STARTER_CHAPTER_PREVIEW.freeSections;
  return chapterPreview;
}

export function starterChapterPreviewLabel(sectionCount?: number): string {
  const total = sectionCount ?? STARTER_CHAPTER_PREVIEW.totalSections;
  return `${STARTER_CHAPTER_PREVIEW.freeSections} of ${total} sections free`;
}
