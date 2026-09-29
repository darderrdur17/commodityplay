import { TRACK_SELECTION } from "@/data/track-selection";
import {
  PLAN_BASE_USD,
  formatUsd,
  monthlyRateUsd,
  priceLabel,
} from "@/data/pricing-shared";

export interface LandingFeature {
  icon: string;
  title: string;
  desc: string;
  tier?: "Pro" | "Elite";
}

export interface GroundLevelFeature {
  title: string;
  desc: string;
}

export interface ChapterCoverage {
  letter: string;
  title: string;
  desc: string;
}

export interface CaseStudyPreviewCard {
  slug: string;
  category: string;
  title: string;
  catchLine: string;
  excerpt: string;
  readMinutes: number;
  status?: "published" | "coming-soon";
  track?: "career" | "sales" | "both";
}

export interface SalesWhoCard {
  role: string;
  title: string;
  desc: string;
  outcome: string;
}

export interface SalesWhoSection {
  label: string;
  headline: string;
}

/** Sales landing “The Problem” cards. Icons stay in code by row index. */
export interface SalesProblemCard {
  title: string;
  desc: string;
}

export interface SalesProblemSection {
  eyebrow: string;
  headline: string;
  description: string;
  cards: SalesProblemCard[];
}

/** One Sales Track tools row (Market Nudges section) — title + expandable caption. */
export interface SalesTrackFeature {
  title: string;
  desc: string;
}

export interface SalesTrackToolsSection {
  eyebrow: string;
  headline: string;
  description: string;
  features: SalesTrackFeature[];
}

export interface SalesPricingTier {
  name: string;
  price: string;
  billing: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  featured?: boolean;
}

export interface LandingTier {
  name: string;
  price: string;
  billing: string;
  badge: "starter" | "pro" | "elite";
  highlight: boolean;
  tooltip: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  opensModal?: boolean;
}

/** One row of the Feature Comparison / pricing comparison table. Admin-editable via CMS. */
export interface FeatureComparisonItem {
  name: string;
  starter?: boolean;
  pro: boolean;
  elite: boolean;
}

/** A named group of comparison rows (e.g. "Pro — USD 19/month"). */
export interface FeatureComparisonGroup {
  category: string;
  color: string;
  items: FeatureComparisonItem[];
}

export interface FeatureComparisonTable {
  groups: FeatureComparisonGroup[];
}

export interface LandingTestimonial {
  id: string;
  quote: string;
  name: string;
  role: string;
  avatarLetter?: string;
  avatarColor?: string;
}

export interface LandingTestimonials {
  eyebrow?: string;
  title: string;
  items: LandingTestimonial[];
}

export interface LandingMentorConnect {
  eyebrow: string;
  title: string;
}

export interface TrackSelectionTrackCopy {
  title: string;
  caption: string;
}

export interface TrackSelectionContent {
  career: TrackSelectionTrackCopy;
  sales: TrackSelectionTrackCopy;
}

export interface MembersStripContent {
  label: string;
  companies: string[];
}

export interface LandingContent {
  career: {
    eyebrow: string;
    headline: string;
    headlineAccent: string;
    description: string;
    ctaPrimary: string;
    ctaSecondary: string;
    finalCtaTitle: string;
    finalCtaAccent: string;
    heroStats: { value: number; suffix: string; label: string }[];
  };
  sales: {
    eyebrow: string;
    headline: string;
    headlineAccent: string;
    description: string;
    ctaPrimary: string;
    ctaSecondary: string;
    stats: { value: number; suffix: string; label: string; animate?: boolean }[];
    whoSection: SalesWhoSection;
    whoCards: SalesWhoCard[];
    problem: SalesProblemSection;
    roi: {
      eyebrow: string;
      title: string;
      titleAccent: string;
      description: string;
      stats: { value: string; label: string }[];
      quote: string;
      quoteAuthor: string;
      quoteSubtitle?: string;
    };
    pricing: SalesPricingTier[];
    /** Feature Comparison table shown on the Sales Track landing page (Pro vs Elite). */
    comparison: FeatureComparisonTable;
    /** Accordion on the Sales landing “What you’ll learn” section. */
    learn: {
      eyebrow: string;
      headline: string;
      description: string;
      items: { num: string; title: string; desc: string }[];
    };
    /** Sales Track Only tools list on the landing Market Nudges / tools strip. */
    trackTools: SalesTrackToolsSection;
  };
  stats: { value: number; suffix: string; label: string }[];
  groundLevelView: {
    eyebrow: string;
    title: string;
    description: string;
    features: GroundLevelFeature[];
  };
  chapterCoverage: {
    eyebrow: string;
    title: string;
    titleAccent: string;
    description: string;
    /** Small note under the accordion, e.g. update cadence. */
    footerNote: string;
    chapters: ChapterCoverage[];
  };
  caseStudySample: {
    eyebrow: string;
    title: string;
    titleAccent: string;
    description: string;
    cards: CaseStudyPreviewCard[];
    /** Ordered slugs featured on the Career landing. Empty uses `cards` order. */
    featuredSlugs?: string[];
    categoryTags: string[];
    disclaimer: string;
    viewMoreHref?: string;
  };
  whatsInside: {
    titleLine1: string;
    titleLine2: string;
    description: string;
    features: LandingFeature[];
  };
  pricing: {
    title: string;
    subtitle: string;
    tiers: LandingTier[];
    /** Feature Comparison table shown on the Career Track landing page (Starter vs Pro vs Elite). */
    comparison: FeatureComparisonTable;
  };
  careerMembersStrip: MembersStripContent;
  salesMembersStrip: MembersStripContent;
  /** @deprecated Legacy shared strip — migrated to career/sales fields on read */
  membersStrip?: MembersStripContent;
  testimonials: LandingTestimonials;
  salesTestimonials: LandingTestimonials;
  mentorConnect: LandingMentorConnect;
  trackSelection: TrackSelectionContent;
}

/** Career track pricing tiers (Starter / Pro / Elite) — used to seed defaults and the comparison table. */
const CAREER_PRICING_TIERS_DEFAULT: LandingTier[] = [
  {
    name: "Starter",
    price: "Free",
    billing: "forever",
    badge: "starter",
    highlight: false,
    tooltip: "Only an email required",
    description: "The foundation for anyone entering commodity markets.",
    features: [
      "5 desk infographics",
      "Chapter A preview (3 free sections)",
      "Desk Glossary",
      "Email Digest",
      "Job Board waitlist",
    ],
    cta: "Join Free",
    href: "/signup",
    opensModal: true,
  },
  {
    name: "Pro",
    price: priceLabel(PLAN_BASE_USD.CAREER_PRO),
    billing: "per month · cancel anytime",
    badge: "pro",
    highlight: true,
    tooltip: "For professionals and learners going deeper into how commodity markets work.",
    description: "For professionals and learners going deeper into how commodity markets work.",
    features: [
      "Full Playbook — all {chapterCount} chapters",
      "Persona Analysis Quiz",
      "Tailored resume templates ({templateCount}+)",
      "Career Roadmap ({roleCount} role blueprints)",
      "Interview Questions + Answers ({interviewCount}+)",
      "Market Knowledge Test (gap analysis)",
      "Resume Vetting (up to twice a year)",
      "Career Navigation Guide — move across the industry with confidence",
    ],
    cta: "Get Pro",
    href: "/?track=career#plan-pro",
  },
  {
    name: "Elite",
    price: priceLabel(PLAN_BASE_USD.CAREER_ELITE),
    billing: "per month · cancel anytime",
    badge: "elite",
    highlight: false,
    tooltip: "For long-term serious learners with long-term downstream careers.",
    description: "For long-term serious learners with long-term downstream careers.",
    features: [
      "Everything in Pro",
      "Deep-dive Global & Asia Case Studies ({caseStudyCount}+ ongoing)",
      "Desk Channel — Intelligent answers vetted by real practitioners ({deskQaCount}+ Q&As)",
      "Anonymous Mentor Connect",
      "Market Job Openings Tracker (tailored to persona)",
    ],
    cta: "Get Elite",
    href: "/?track=career#plan-elite",
  },
];

/** Sales track pricing tiers (Pro / Elite) — used to seed defaults and the comparison table. */
const SALES_PRICING_TIERS_DEFAULT: SalesPricingTier[] = [
  {
    name: "Pro",
    price: priceLabel(PLAN_BASE_USD.SALES_PRO),
    billing: "per month",
    description: "The toolkit for selling smarter into commodity trading space.",
    features: [
      "Full Playbook — all {chapterCount} chapters covering every desk function, with examples and frameworks",
      "Market Knowledge Test — identify exactly which areas to study before key accounts",
      "Desk Glossary — explain the way a senior trader would do",
      "Sales Guide - key industry areas to look out for when selling",
      "Weekly Sales Edge Note - highlight interesting market happenings to note from sales perspectives",
    ],
    cta: "Get Pro",
    href: "/signup?plan=pro",
    featured: false,
  },
  {
    name: "Elite",
    price: priceLabel(PLAN_BASE_USD.SALES_ELITE),
    billing: "per month",
    description: "For sales professionals who need ongoing desk intelligence",
    features: [
      "Everything in Pro",
      "Global & Asian Case Studies - updated market events showing how desks think through commercial decisions",
      "Desk Channel — Practitioner Q&As that reveal how traders frame every type of problem",
      "Anonymous Mentor Connect - ask your real sales preparation questions to practitioners directly",
      "Market Role Openings - track which firms are growing and hiring (your next target accounts)",
    ],
    cta: "Get Elite",
    href: "/signup?plan=elite",
    featured: true,
  },
];

const CAREER_TIER_COLORS: Record<string, string> = {
  Starter: "#16a34a",
  Pro: "#3280ff",
  Elite: "#B45309",
};

/** Builds the Starter/Pro/Elite Feature Comparison table from the career tiers — each tier's own features check off at itself and every higher tier. */
function buildCareerComparison(tiers: LandingTier[]): FeatureComparisonTable {
  const order: Array<"starter" | "pro" | "elite"> = ["starter", "pro", "elite"];
  return {
    groups: tiers.map((tier) => {
      const badgeIndex = order.indexOf(tier.badge);
      return {
        category: tier.price === "Free" ? `${tier.name} — Free` : `${tier.name} — ${tier.price}/month`,
        color: CAREER_TIER_COLORS[tier.name] ?? "#3280ff",
        items: tier.features.map((name) => ({
          name,
          starter: badgeIndex <= 0,
          pro: badgeIndex <= 1,
          elite: badgeIndex <= 2,
        })),
      };
    }),
  };
}

const SALES_TIER_COLORS: Record<string, string> = {
  Pro: "#0F766E",
  Elite: "#065F46",
};

/** Builds the Pro/Elite Feature Comparison table from the sales tiers. */
function buildSalesComparison(tiers: SalesPricingTier[]): FeatureComparisonTable {
  const pro = tiers.find((t) => t.name.toLowerCase() === "pro");
  const elite = tiers.find((t) => t.name.toLowerCase() === "elite");
  const groups: FeatureComparisonGroup[] = [];
  if (pro) {
    groups.push({
      category: `${pro.name} — ${pro.price}/month`,
      color: SALES_TIER_COLORS.Pro,
      items: pro.features.map((name) => ({ name, pro: true, elite: true })),
    });
  }
  if (elite) {
    groups.push({
      category: `${elite.name} — ${elite.price}/month`,
      color: SALES_TIER_COLORS.Elite,
      items: elite.features
        .filter((f) => !/^everything in pro$/i.test(f))
        .map((name) => ({ name, pro: false, elite: true })),
    });
  }
  return { groups };
}

export const DEFAULT_LANDING_CONTENT: LandingContent = {
  career: {
    eyebrow: "The insider's guide for career builders",
    headline: "Understand Commodity Trading the Way",
    headlineAccent: "the Desk Actually Works.",
    description:
      "The playbook most people never see. From fresh grad to senior coverage — whether you're entering the industry, switching roles, or moving from operations to the front office.",
    ctaPrimary: "Join Free",
    ctaSecondary: "Preview Content",
    finalCtaTitle: "Your career, driven right.",
    finalCtaAccent: "Join the desk community",
    heroStats: [
      { value: 20, suffix: "+", label: "Years desk experience" },
      { value: 9, suffix: "", label: "Full playbook chapters" },
      { value: 120, suffix: "", label: "Downloadable assets" },
      { value: 10, suffix: "+", label: "Deep case studies" },
    ],
  },
  sales: {
    eyebrow: "For Sales Professionals Selling Into Commodity Trading",
    headline: "Sell Into Commodity Trading with",
    headlineAccent: "Desk-Level Credibility.",
    description:
      "Your buyers are traders, risk managers, schedulers, and analysts who can tell within two minutes whether you understand their world. The Playbook gives you the inside knowledge to have conversations at their level — not presentations at yours.",
    ctaPrimary: "What You'll Learn",
    ctaSecondary: "What You'll Learn",
    stats: [
      { value: 2, suffix: " min", label: "How fast traders judge your credibility", animate: false },
      { value: 5, suffix: "", label: "Basic functions covered" },
      { value: 40, suffix: "+", label: "Practitioner Q&As to learn from" },
      { value: 20, suffix: "+", label: "Years desk experience behind this content" },
    ],
    whoSection: {
      label: "Who This Is For",
      headline: "Six Sales Roles. One Shared Problem.",
    },
    problem: {
      eyebrow: "The Problem",
      headline: "Your Buyers Know When You Don't Get It.",
      description:
        "Commodity trading firms buy from people who understand their business. Most vendors don't.",
      cards: [
        {
          title: "You're Pitching to People Who Think in Barrels",
          desc: "Traders don't think in annual recurring revenue, user seats, or implementation timelines. They think in cargo positions, freight rates, and margin at risk. If your discovery call sounds like a software demo instead of a market conversation, you've already lost them.",
        },
        {
          title: "Your Champion Can't Sell You Internally",
          desc: "Even when your champion sees the value, they struggle to articulate it to a trading desk in commercial terms. They need to explain how your solution maps to their P&L, their risk exposure, or their operational workflow — and most vendors don't give them the language to do it.",
        },
        {
          title: "You Can't Differentiate on Product Alone",
          desc: "Your competitors have similar feature sets. The vendor who wins is the one who understands the buyer's commercial context deeply enough to position their solution as the answer to a specific, felt problem — not just another capability on a slide.",
        },
      ],
    },
    whoCards: [
      { role: "ETRM & Trading Software", title: "Enterprise Software Sales", desc: "You sell Endur, RightAngle, Allegro, or a competing ETRM. The real decision is made by the trading desk.", outcome: "After the Playbook, I stopped presenting to operations and started having commercial conversations with the desk. First call conversion improved immediately." },
      { role: "Market Data & Intelligence", title: "Data Platform Sales", desc: "You sell Kpler, Vortexa, Platts, Argus, or a competing data service. Your buyers already know the market — they're testing whether you do too.", outcome: "Understanding how desks actually use AIS data changed how I demo. Win rate on enterprise accounts up 35%." },
      { role: "Risk & Compliance Technology", title: "Risk Technology Sales", desc: "You sell VaR systems, surveillance tools, or credit risk platforms. The buying committee will probe your market understanding in detail.", outcome: "The Playbook's risk chapter gave me the vocabulary to have real conversations with the CRO. Accelerated our deal cycle by 6 weeks." },
      { role: "Shipping & Freight Technology", title: "Maritime & Logistics Sales", desc: "You sell vessel tracking, freight analytics, or chartering technology. Your buyers think in laytime, demurrage, and NOR.", outcome: "I finally understood what demurrage costs a trading desk per day. That one number reframed every conversation about our product's ROI." },
      { role: "Trade Finance & Banking", title: "Commodity Finance Sales", desc: "You sell letters of credit, commodity finance structures, or payment solutions to commodity trading firms.", outcome: "Understanding the B/L and LOI process meant I could map our solution to an actual operational pain point." },
      { role: "Consulting & Advisory", title: "Strategy & Management Consulting", desc: "You sell advisory services on strategy, operations, digital transformation, or market entry.", outcome: "Our team used the Playbook as pre-engagement preparation for an LNG client. That distinction won the work." },
    ],
    roi: {
      eyebrow: "The Commercial Case",
      title: "One Deal Pays for",
      titleAccent: "a Year of Elite.",
      description:
        `Elite is ${formatUsd(monthlyRateUsd("SALES", "ELITE", "monthly"))}/month. If understanding the commodity trading desk helps you close one additional deal per year — at even a fraction of typical contract values in this sector — the return is not close. The question is whether you can afford not to know this.`,
      stats: [
        { value: "$250K–$2M+", label: "Typical ETRM / data platform ACV" },
        { value: formatUsd(monthlyRateUsd("SALES", "ELITE", "monthly") * 12), label: "Full year of Elite access" },
        { value: "2 min", label: "How fast traders assess your credibility" },
        { value: "6 wks", label: "Reported reduction in deal cycle (user data)" },
      ],
      quote:
        "I used to walk into commodity trading firms and talk about our platform's capabilities. Now I walk in and talk about their market — what Brent is doing, what the crack spread is signalling, what their freight book looks like. The conversation is completely different. So is our pipeline.",
      quoteAuthor: "Head of Enterprise Sales, APAC",
      quoteSubtitle: "Market intelligence platform, Singapore",
    },
    pricing: SALES_PRICING_TIERS_DEFAULT,
    comparison: buildSalesComparison(SALES_PRICING_TIERS_DEFAULT),
    learn: {
      eyebrow: "What You'll Learn",
      headline: "The Commercial Context Your Buyers Live In.",
      description:
        "A working understanding of how commodity trading desks make money, manage risk, and evaluate vendors.",
      items: [
        {
          num: "01",
          title: "How the desk actually makes money",
          desc: "The six revenue levers — flat price, spread, freight, timing, quality, and optionality. Where each function in a trading firm contributes to P&L, and where they lose it. The vocabulary traders use to describe commercial performance.",
        },
        {
          num: "02",
          title: "How trading desks use data and intelligence",
          desc: "How desks consume Platts, Argus, Kpler, Vortexa, and the Baltic Exchange. What signals matter, how frequently they're checked, and what decisions they support. If you sell data or intelligence tools, this is your discovery framework.",
        },
        {
          num: "03",
          title: "How operations and scheduling work",
          desc: "The cargo lifecycle — nomination, NOR, laytime, demurrage, B/L, and vessel scheduling. What an ETRM system does and why it matters. The language of operations teams who control implementation and adoption of your product.",
        },
        {
          num: "04",
          title: "How risk and compliance think",
          desc: "VaR, position limits, basis risk, counterparty credit, sanctions — the constraints that shape every commercial decision. If your product touches risk or compliance functions, you need to understand these frameworks before your first meeting.",
        },
        {
          num: "05",
          title: "How to map your solution to their P&L",
          desc: "The 15 Asia case studies in the Pro tier are real market events with commercial impact analysis. Reading them teaches you how traders think about market signals and decisions — and how to connect your solution to that exact thinking.",
        },
        {
          num: "06",
          title: "The language that builds immediate credibility",
          desc: "The Desk Channel's 40 Q&As are real questions from real practitioners with real answers. Reading them tells you what trading professionals care about, how they frame problems, and which vocabulary signals that you understand their world.",
        },
      ],
    },
    trackTools: {
      eyebrow: "Sales Track Only",
      headline: "Sales Intelligence",
      description: "Six tools, one purpose — sound like you read the desk this morning.",
      features: [
        {
          title: "Market Talking Points",
          desc: "Short, current lines you can drop into a client conversation without sounding rehearsed.",
        },
        {
          title: "Prep Library",
          desc: "Bookmark the talking points that worked, so they're one tap away before your next meeting.",
        },
        {
          title: "Account Intelligence Track",
          desc: "Link market talking points to specific accounts, so prep compounds instead of resetting every call.",
        },
        {
          title: "Mentor Connect",
          desc: "Ask practitioners your sales-prep questions, anonymously — no dumb-question anxiety.",
        },
        {
          title: "Desk Channel",
          desc: "Practitioner Q&As showing how desks actually frame commercial problems.",
        },
        {
          title: "Market Role Movements",
          desc: "Track which firms are growing and hiring — your next target accounts, before your competitors notice.",
        },
      ],
    },
  },
  stats: [
    { value: 196, suffix: "", label: "Glossary (trading-related) terms" },
    { value: 10, suffix: "+", label: "Deep case studies" },
  ],
  groundLevelView: {
    eyebrow: "What's Inside",
    title: "The Ground-Level View.",
    description: "Most people learn commodity markets from textbooks and headlines. This Playbook starts where the desk starts — cargoes, freight, arbitrage windows, and the commercial decisions that determine whether a trade makes money.",
    features: [
      { title: "Industry Foundations", desc: "Master the mechanics of oil, LNG, and gas. Physical vs paper, refining economics, pricing benchmarks, and exactly what drives margins on the desk." },
      { title: "Resume & Positioning", desc: "Five archetype-specific resume templates with a quiz to find yours. The exact language that commodity trading hiring managers look for." },
      { title: "Market Thinking", desc: "How to read the EIA report, the COT data, the forward curve, and AIS vessel positioning — and what commercial decision each signal supports." },
      { title: "Shipping & Freight", desc: "Voyage charters, time charters, demurrage, laytime, and AIS vessel tracking — the logistics layer every desk depends on." },
      { title: "Interview Preparation", desc: "50 commodity trading interview questions with model answers by archetype. The Market Knowledge Test scores your gaps." },
      { title: "Practitioner Access", desc: "The Desk Channel Q&A library — 40 real questions answered by vetted practitioners. Plus Anonymous Mentor Connect." },
    ],
  },
  chapterCoverage: {
    eyebrow: "The Playbook",
    title: "What We Cover.",
    titleAccent: "Entire Market Spectrum.",
    description:
      "Most people learn commodity markets from textbooks and headlines. This Playbook starts where the desk starts — cargoes, freight, arbitrage windows, and the commercial decisions that determine whether a trade makes money.",
    footerNote: "Playbook is updated on a periodic basis",
    chapters: [
      { letter: "A", title: "Industry Foundations", desc: "Physical vs paper, the six revenue levers, pricing benchmarks, and how an oil trade actually makes money." },
      { letter: "B", title: "Physical & Paper Markets", desc: "MOC price assessment, spreads, the carry trade, OPEC signals, DES vs FOB, and managed money positioning." },
      { letter: "C", title: "Shipping, Freight & Cargo", desc: "Vessel types, charter party mechanics, demurrage, AIS tracking, laytime, and the full cargo lifecycle." },
      { letter: "D", title: "Market Intelligence", desc: "Kpler, Platts, Argus, EIA, COT, Baltic Exchange — what each tells you and how to read it commercially." },
      { letter: "E", title: "Commercial Risk & Decisions", desc: "VaR, basis risk, stop-loss discipline, sanctions, credit risk, and how a desk manages positions in real time." },
      { letter: "F", title: "Trade Finance & Credit", desc: "A physical commodity trade does not settle on a handshake. Letters of credit, pre-export finance, working capital structures, and counterparty credit are the plumbing that makes the trade possible — and the chapter that most market participants wish they had read before their first deal went sideways." },
      { letter: "G", title: "Crude Oil & Refined Products", desc: "Crude oil is the benchmark all others are priced against — but the real commercial action happens in the differentials. Why a West African grade trades at a premium to Dated Brent one month and a discount the next, what a refinery's configuration tells you about what it will pay, and how the spread between gasoline, diesel, and jet fuel shifts with the season and the economy. This chapter covers the crude quality matrix, Atlantic Basin and Asian arbitrage, refinery margins, product specifications, and the flows that connect a wellhead in West Texas to a filling station in Singapore." },
      { letter: "H", title: "LNG & Natural Gas", desc: "LNG is the most geopolitically sensitive commodity market on the planet, and also the least well understood by most professionals entering the space. This chapter covers the JKM–TTF spread, the full cargo chain from liquefaction to regasification, diversion logic, boil-off economics, and how a single winter in Europe reprices a global market." },
      { letter: "I", title: "Metals & Mining", desc: "Copper tells you where the global economy is going before economists publish their forecasts. Iron ore tells you what China is building. This chapter covers LME mechanics, the concentrate-to-refined chain, how mining supply disruptions travel through the curve, and why metals belong in every commodity professional's reading list." },
    ],
  },
  caseStudySample: {
    eyebrow: "Learn with Examples",
    title: "Case Studies.",
    titleAccent: "Global & Asia.",
    description:
      "Market scenarios with commercial logic — physical arbs, freight plays, cross-market reads, and supply disruptions. Each one shows how the desk thinks, what it sees, and what the P&L looked like.",
    cards: [
      {
        slug: "the-inventory-divergence",
        category: "Physical arbitrage",
        title: "The Inventory Divergence",
        catchLine: "\"Three bullish draws. Flat price unmoved. Which signal do you trust?\"",
        excerpt:
          "EIA shows a 4.2mb crude draw — the third consecutive bullish surprise. Brent barely moves. The desk has to decide whether the physical signal is real or already priced in…",
        readMinutes: 14,
      },
      {
        slug: "the-cargo-diversion-window",
        category: "Physical arbitrage",
        title: "The Cargo Diversion Window",
        catchLine: "\"JKM opened $4.40 above TTF. The vessel was already loading. The desk had 4 hours.\"",
        excerpt:
          "An LNG cargo is mid-load at a Trinidad terminal, originally destined for the UK. The JKM/TTF spread widens sharply after an unplanned Japanese terminal outage…",
        readMinutes: 16,
      },
      {
        slug: "when-the-dollar-spoke-first",
        category: "Cross-market",
        title: "When the Dollar Spoke First",
        catchLine: "\"DXY strengthened 3.3% in 11 sessions. Brent's bulls were right — but three weeks early.\"",
        excerpt:
          "Three consecutive bullish EIA draws — and the price falls anyway. The US Dollar Index was strengthening quietly in the background, driving speculative long liquidation…",
        readMinutes: 18,
      },
    ],
    featuredSlugs: [
      "the-inventory-divergence",
      "the-cargo-diversion-window",
      "when-the-dollar-spoke-first",
    ],
    categoryTags: ["Physical arb", "Cross-market", "Freight & logistics", "Supply disruption"],
    disclaimer:
      "Case studies reflect either real market scenarios or are illustrative for learning purposes. Figures and outcomes are used to demonstrate commercial logic, not investment advice.",
    viewMoreHref: "/case-studies",
  },
  whatsInside: {
    titleLine1: "Every Resource You Need,",
    titleLine2: "Nothing You Don't",
    description:
      "Built from 20+ years inside trading, analytics, and market intelligence by practitioners, validated by desk veterans. Structured for how commodity professionals actually learn and work.",
    features: [
      {
        icon: "BookOpen",
        title: "Full Playbook",
        desc: "{chapterCount} chapters covering every facet of commodity trading — markets, operations, finance, analytics, and career strategy.",
        tier: "Pro",
      },
      {
        icon: "Target",
        title: "Persona Quiz & Resumes",
        desc: "Discover your archetype and download a tailored resume template built for commodity desk vocabulary.",
        tier: "Pro",
      },
      {
        icon: "Map",
        title: "Career Roadmap",
        desc: "{roleCount} role blueprints, navigation guide, comp benchmarks, and 90-day action plans for every stage.",
        tier: "Pro",
      },
      {
        icon: "FileText",
        title: "Case Studies",
        desc: "{caseStudyCount} real-world trading scenarios with full breakdowns — price dynamics, P&L, risk decisions, and lessons learned.",
        tier: "Elite",
      },
      {
        icon: "MessageSquare",
        title: "Desk Channel",
        desc: "{deskQaCount} practitioner Q&As across Physical Trading, Finance, Analytics, Operations, and Sales — the unfiltered desk view.",
        tier: "Elite",
      },
      {
        icon: "Users",
        title: "Mentor Connect",
        desc: "One question. One mentor. One honest answer. Anonymous access to practitioners across {segmentCount} segments.",
        tier: "Elite",
      },
    ],
  },
  pricing: {
    title: "Invest in Your Downstream Career",
    subtitle:
      "Whether you're breaking in, switching functions, or planning longevity in oil, gas & LNG, metals & mining downstream trading — pick the level of access that fits your stage.",
    tiers: CAREER_PRICING_TIERS_DEFAULT,
    comparison: buildCareerComparison(CAREER_PRICING_TIERS_DEFAULT),
  },
  careerMembersStrip: {
    label: "Trusted professional moving to",
    companies: ["Vitol", "Glencore", "S&P Global", "Bloomberg", "Shell"],
  },
  salesMembersStrip: {
    label: "Trusted by sales teams at",
    companies: ["Vitol", "Trafigura", "Gunvor", "Mercuria", "Kpler"],
  },
  testimonials: {
    title: "Used by practitioners who mean it.",
    items: [
      {
        id: "priya-m",
        quote:
          "I landed my first commodity analyst role 6 weeks after going through the Pro pack. The interview question bank was exactly what I needed.",
        name: "Priya M.",
        role: "Commodity Analyst, Singapore",
        avatarColor: "#0F766E",
      },
      {
        id: "james-k",
        quote:
          "The Playbook gave me the commodity context I was missing — I finally understood the trade, not just the financing.",
        name: "James K.",
        role: "Commodity Trade Finance, London",
        avatarColor: "#9A3412",
      },
      {
        id: "sarah-t",
        quote:
          "The Career Roadmap was the clearest articulation of progression paths I've ever seen. Immediately shared it with my team.",
        name: "Sarah T.",
        role: "Senior Trader, Geneva",
        avatarColor: "#5B21B6",
      },
    ],
  },
  salesTestimonials: {
    title: "Used by practitioners who mean it.",
    items: [
      {
        id: "marcus-l",
        quote:
          "After the Playbook, I stopped presenting to operations and started having commercial conversations with the desk. First call conversion improved immediately.",
        name: "Marcus L.",
        role: "Enterprise Software Sales, Singapore",
        avatarColor: "#0F766E",
      },
      {
        id: "nadia-r",
        quote:
          "Understanding how desks actually use AIS data changed how I demo. Win rate on enterprise accounts up 35%.",
        name: "Nadia R.",
        role: "Market Data Sales, China",
        avatarColor: "#0F766E",
      },
      {
        id: "chris-b",
        quote:
          "The Playbook's risk chapter gave me the vocabulary to have real conversations with the CRO. Accelerated our deal cycle by 6 weeks.",
        name: "Chris B.",
        role: "Risk Technology Sales, London",
        avatarColor: "#0F766E",
      },
    ],
  },
  mentorConnect: {
    eyebrow: "Elite Access",
    title: "Mentor Connect",
  },
  trackSelection: {
    career: { ...TRACK_SELECTION.career },
    sales: { ...TRACK_SELECTION.sales },
  },
};
