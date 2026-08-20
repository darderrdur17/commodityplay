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
    createdAt: new Date("2024-01-01"),
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
    id: "crack-spread-framing",
    track: "SALES",
    createdAt: new Date("2024-01-01"),
    title: "Framing This Week's Crack Spread Move for a Refinery Client",
    category: "Current event",
    keyPoints: [
      "Start with the margin change, not your recommendation — let them react first",
      "Tie the move to run rates and seasonal demand, not just flat price",
      "Offer one data point they may not have seen — e.g. Gulf Coast diesel cracks vs. Singapore",
    ],
    canUseFor: "Pacific Refining Co.",
    usedInNote: "client asked follow-up questions",
    prepStatus: "Used it",
  },
  {
    id: "price-pushback",
    track: "SALES",
    createdAt: new Date("2024-01-01"),
    title: "When a Client Pushes Back on Your Price — Stay on the Market",
    category: "Risk & pricing",
    keyPoints: [
      "Don't get defensive — acknowledge the gap and pivot to the benchmark",
      "Reference where the market traded yesterday, not where you need to be",
      "Good line: \"Let's look at what the screen says together before we talk terms\"",
    ],
    prepStatus: "Learning it",
  },
  {
    id: "contango-plain-language",
    track: "SALES",
    createdAt: new Date("2024-01-01"),
    title: "Explaining Contango Without Sounding Like a Textbook",
    category: "Market mechanics",
    keyPoints: [
      "Use a storage analogy: \"It costs more to hold barrels than to sell now\"",
      "Connect curve shape to what their procurement team is likely seeing in tenders",
      "Avoid jargon first — add the technical term only after they nod along",
    ],
    canUseFor: "Horizon LNG",
    prepStatus: "Interview-ready",
  },
  {
    id: "quiet-meeting-follow-up",
    track: "SALES",
    createdAt: new Date("2024-01-01"),
    title: "Following Up After a Quiet Meeting — Add Value, Don't Chase",
    category: "Other",
    keyPoints: [
      "Send one relevant market note, not a check-in email asking for business",
      "Reference something specific from the meeting — shows you were listening",
      "Keep it short: one chart, one insight, no attachment overload",
    ],
    canUseFor: "Cascade Commodities",
    usedInNote: "got a callback",
    prepStatus: "Used it",
  },
  {
    id: "basis-risk-story",
    track: "SALES",
    createdAt: new Date("2024-01-01"),
    title: "Using a Physical Market Story to Explain Basis Risk",
    category: "Risk & pricing",
    keyPoints: [
      "Pick a recent cargo or delivery window — basis is easier when it's concrete",
      "Contrast local price vs. benchmark on the same day, not in theory",
      "Close with how your desk watches the spread, not how you can fix it",
    ],
    prepStatus: "Learning it",
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

/** Dashboard card + section metadata — shared by grid cards and boxed prep library UI. */
export const PREP_LIBRARY_SEGMENTS: Record<
  PrepLibraryTrack,
  {
    anchor: string;
    title: string;
    eyebrow: string;
    cardDescription: string;
    color: string;
    requiredTier: "PRO";
  }
> = {
  CAREER: {
    anchor: "prep-library-career",
    title: "Your Prep Library",
    eyebrow: "Market talking points",
    cardDescription:
      "A private set of market topics you can speak to confidently — ready before your next interview.",
    color: "#3280ff",
    requiredTier: "PRO",
  },
  SALES: {
    anchor: "prep-library-sales",
    title: "Sales Prep Library",
    eyebrow: "Market talking points for sales",
    cardDescription:
      "Market topics you can bring into client conversations — ready before your next meeting.",
    color: "#0f766e",
    requiredTier: "PRO",
  },
};
