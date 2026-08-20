export type PrepLibraryTrack = "CAREER" | "SALES";

export type PrepStatusEnum = "Learning it" | "Interview-ready" | "Used it";

export type PrepCategoryEnum =
  | "Market mechanics"
  | "Current event"
  | "Risk & pricing"
  | "Logistics"
  | "Other";

/** @deprecated Use PrepCategoryEnum */
export type PrepLibraryCategory = PrepCategoryEnum | string;

export interface TalkingPoint {
  id: string;
  userId?: string;
  track: PrepLibraryTrack;
  createdAt: Date;
  title: string;
  category: PrepCategoryEnum | string;
  keyPoints: string[];
  source?: string;
  prepStatus: PrepStatusEnum;
  usedInNote?: string;
  canUseFor?: string;
  /** Parsed/resolved link target derived from canUseFor (e.g. interview question id). */
  usageTarget?: string;
  note?: string;
}

/** @deprecated Use TalkingPoint */
export type PrepLibraryTopic = TalkingPoint;

export const CAREER_PREP_LIBRARY_SEED_TOPICS: TalkingPoint[] = [
  {
    id: "lng-cargo-diversion",
    track: "CAREER",
    createdAt: new Date("2024-01-01"),
    title: "Why LNG Cargo Diversion Happens",
    category: "Market mechanics",
    keyPoints: [
      "Triggered by a regional price gap opening up between two markets",
      "The spread has to cover freight cost and demurrage risk, not just the price gap",
      "Desk speed depends on how fast the pricing window is expected to close",
    ],
    canUseFor: "Meridian Energy interview",
    usedInNote: "landed well",
    prepStatus: "Interview-ready",
  },
  {
    id: "crack-spread-compression",
    track: "CAREER",
    createdAt: new Date("2024-01-01"),
    title: "Crack Spread Compression — What It Signals",
    category: "Risk & pricing",
    keyPoints: [
      "Refinery margins tightening as run rates rise ahead of driving season",
      "Forward curve often signals the move before flat price reacts",
      "Desks position ahead of the compression, not after it's visible",
    ],
    canUseFor: "Anchorpoint Trading",
    prepStatus: "Learning it",
  },
  {
    id: "physical-vs-paper",
    track: "CAREER",
    createdAt: new Date("2024-01-01"),
    title: "Physical vs. Paper Trading — The Core Distinction",
    category: "Market mechanics",
    keyPoints: [
      "Physical = actual cargo changes hands; paper = financial exposure only",
      "A cargo diverting mid-voyage can matter more than that day's futures move",
    ],
    prepStatus: "Learning it",
  },
  {
    id: "brent-wti-spread",
    track: "CAREER",
    createdAt: new Date("2024-01-01"),
    title: "Brent–WTI Spread — What Actually Drives the Gap",
    category: "Market mechanics",
    keyPoints: [
      "Not just quality — pipeline/export capacity out of the US Gulf moves the spread as much as crude grade",
      "Watch it as a proxy for US export flows, not just a pricing curiosity",
      "A widening spread often precedes a pickup in US crude export volumes",
    ],
    canUseFor: "Sterling Commodities",
    prepStatus: "Learning it",
  },
  {
    id: "contango-backwardation",
    track: "CAREER",
    createdAt: new Date("2024-01-01"),
    title: "Contango vs. Backwardation — Reading the Oil Curve",
    category: "Market mechanics",
    keyPoints: [
      "Contango (further months pricier) signals oversupply — storage becomes profitable, encourages holding barrels",
      "Backwardation (near months pricier) signals tightness — desks want barrels now, not later",
      'Good line: "the curve shape tells you more about supply balance than the flat price does"',
    ],
    prepStatus: "Learning it",
  },
  {
    id: "refined-product-specs",
    track: "CAREER",
    createdAt: new Date("2024-01-01"),
    title: "Refined Product Specs — Why They Matter to a Trader",
    category: "Logistics",
    keyPoints: [
      "Gasoline, diesel, and jet fuel specs vary by region — a cargo that clears in one market may not in another",
      "Blending to spec is itself a source of margin, not just a compliance step",
    ],
    prepStatus: "Learning it",
  },
  {
    id: "lme-warehouse-stocks",
    track: "CAREER",
    createdAt: new Date("2024-01-01"),
    title: "LME Warehouse Stocks — Why Traders Watch Them Closely",
    category: "Market mechanics",
    keyPoints: [
      "Registered stocks signal how much metal is immediately deliverable against LME contracts",
      "Cancellations and load-outs often move the forward curve before spot price reacts",
      "Low stocks in key locations tighten time spreads — watch warrant queues and cancelation trends",
    ],
    prepStatus: "Learning it",
  },
];

export const SALES_PREP_LIBRARY_SEED_TOPICS: TalkingPoint[] = [
  {
    id: "opening-with-observation",
    track: "SALES",
    createdAt: new Date("2026-08-15"),
    title: "Opening a Meeting with a Market Observation, Not a Pitch",
    category: "Other",
    keyPoints: [
      "Lead with something specific from your coverage beat, not your product",
      "Signals you track the market daily, not just when there's something to sell",
      "Good line: reference a number that moved this week before you mention your firm",
    ],
    canUseFor: "Meridian Energy",
    usedInNote: "opened the conversation well",
    prepStatus: "Used it",
  },
  {
    id: "spread-move-framing",
    track: "SALES",
    createdAt: new Date("2026-08-10"),
    title: "Framing a Spread Move in a Client Conversation",
    category: "Current event",
    keyPoints: [
      "JKM-TTF has compressed 3 weeks straight — good opener with LNG-exposed accounts",
      "Ask how they're adjusting hedge coverage, don't just report the number",
    ],
    source: "From this week's Market Update",
    canUseFor: "Northbridge Gas",
    usedInNote: "used to explain the hedge angle",
    prepStatus: "Used it",
  },
  {
    id: "freight-costs-conversation",
    track: "SALES",
    createdAt: new Date("2026-07-22"),
    title: "Talking About Freight Costs Without Sounding Like a Pitch",
    category: "Logistics",
    keyPoints: [
      "Freight cost is a real input to their cargo economics — frame it as their P&L problem, not your data point",
      "Reference a recent route or basin where rates moved, not your firm's offering",
      "Good line: \"I noticed VLCC rates on this route moved X% — how is that affecting your freight budget?\"",
    ],
    source: "From Chapter B",
    canUseFor: "Solace Trade Finance",
    usedInNote: "client asked for a follow-up",
    prepStatus: "Used it",
  },
  {
    id: "desk-priorities-stress",
    track: "SALES",
    createdAt: new Date("2026-07-08"),
    title: "Reading Desk Priorities From Recent Market Stress",
    category: "Risk & pricing",
    keyPoints: [
      "When spreads blow out, desks prioritise risk management over new business — read that before you pitch",
      "Ask what changed in their risk limits or credit lines, not what they want to buy",
      "Good line: \"With the move last week, are you rebalancing exposure or holding through?\"",
    ],
    source: "From Chapter D",
    canUseFor: "Halcyon Resources",
    usedInNote: "landed well in a tense market week",
    prepStatus: "Used it",
  },
  {
    id: "coverage-depth-edge",
    track: "SALES",
    createdAt: new Date("2026-06-18"),
    title: "Positioning Coverage Depth as an Edge, Not a Feature List",
    category: "Other",
    keyPoints: [
      "Don't lead with product breadth — lead with one insight only your coverage could produce",
      "Reference a specific data point or relationship your desk has that a generalist wouldn't",
      "Good line: \"We noticed something in the [product] curve this week that most generalists wouldn't flag\"",
    ],
    prepStatus: "Learning it",
  },
  {
    id: "vendor-data-turning-points",
    track: "SALES",
    createdAt: new Date("2026-06-04"),
    title: "Why Vendor Data Matters More at Turning Points",
    category: "Market mechanics",
    keyPoints: [
      "At inflection points, desks need faster, cleaner data — not more of it",
      "Frame your value as reducing decision latency, not adding another screen",
      "Good line: \"When the curve moves this fast, the question isn't what happened — it's what happened first\"",
    ],
    canUseFor: "Northbridge Gas",
    usedInNote: "referenced in a follow-up email",
    prepStatus: "Used it",
  },
];

/** @deprecated Use CAREER_PREP_LIBRARY_SEED_TOPICS */
export const PREP_LIBRARY_SEED_TOPICS = CAREER_PREP_LIBRARY_SEED_TOPICS;

export const PREP_LIBRARY_CATEGORIES: PrepCategoryEnum[] = [
  "Market mechanics",
  "Current event",
  "Risk & pricing",
  "Logistics",
  "Other",
];

export const SALES_PREP_LIBRARY_CATEGORIES: PrepCategoryEnum[] = [
  "Current event",
  "Market mechanics",
  "Risk & pricing",
  "Other",
];

/** Dashboard card + section metadata — shared by grid cards and full prep library page. */
export const PREP_LIBRARY_SEGMENTS: Record<
  PrepLibraryTrack,
  {
    anchor: string;
    title: string;
    /** Full-page heading (may differ from dashboard card title). */
    pageTitle: string;
    eyebrow: string;
    cardDescription: string;
    pageDescription: string;
    color: string;
    requiredTier: "PRO";
  }
> = {
  CAREER: {
    anchor: "prep-library-career",
    title: "Your Prep Library",
    pageTitle: "Your Prep Library",
    eyebrow: "Market talking points",
    cardDescription:
      "A private set of market topics you can speak to confidently — ready before your next interview.",
    pageDescription:
      "A private set of market topics you can speak to confidently — ready before your next interview.",
    color: "#3280ff",
    requiredTier: "PRO",
  },
  SALES: {
    anchor: "prep-library-sales",
    title: "Sales Prep Library",
    pageTitle: "Your Prep Library.",
    eyebrow: "Market talking points for sales",
    cardDescription:
      "Market topics you can bring into client conversations — ready before your next meeting.",
    pageDescription:
      "A private, growing set of market topics you can bring into a client conversation with confidence. Built from what you read here — ready to pull up before your next meeting.",
    color: "#0f766e",
    requiredTier: "PRO",
  },
};
