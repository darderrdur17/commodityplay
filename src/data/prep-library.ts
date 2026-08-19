export type PrepLibraryTrack = "CAREER" | "SALES";

export type PrepLibraryCategory =
  | "Market mechanics"
  | "Oil & refined products"
  | "Risk & pricing"
  | "Metals & mining"
  | "Current event"
  | "Relationship building"
  | "Other";

export interface PrepLibraryTopic {
  id: string;
  title: string;
  category: PrepLibraryCategory | string;
  keyPoints: string[];
  /** e.g. "Meridian Energy" — omit when not linked to an interview or meeting */
  usageTarget?: string;
  /** Optional italic note, e.g. "landed well" */
  note?: string;
}

export const CAREER_PREP_LIBRARY_SEED_TOPICS: PrepLibraryTopic[] = [
  {
    id: "lng-cargo-diversion",
    title: "Why LNG Cargo Diversion Happens",
    category: "Market mechanics",
    keyPoints: [
      "Triggered by a regional price gap opening up between two markets",
      "The spread has to cover freight cost and demurrage risk, not just the price gap",
      "Desk speed depends on how fast the pricing window is expected to close",
    ],
    usageTarget: "Meridian Energy",
    note: "landed well",
  },
  {
    id: "crack-spread-compression",
    title: "Crack Spread Compression — What It Signals",
    category: "Risk & pricing",
    keyPoints: [
      "Refinery margins tightening as run rates rise ahead of driving season",
      "Forward curve often signals the move before flat price reacts",
      "Desks position ahead of the compression, not after it's visible",
    ],
    usageTarget: "Anchorpoint Trading",
  },
  {
    id: "physical-vs-paper",
    title: "Physical vs. Paper Trading — The Core Distinction",
    category: "Market mechanics",
    keyPoints: [
      "Physical = actual cargo changes hands; paper = financial exposure only",
      "A cargo diverting mid-voyage can matter more than that day's futures move",
    ],
  },
  {
    id: "brent-wti-spread",
    title: "Brent–WTI Spread — What Actually Drives the Gap",
    category: "Oil & refined products",
    keyPoints: [
      "Not just quality — pipeline/export capacity out of the US Gulf moves the spread as much as crude grade",
      "Watch it as a proxy for US export flows, not just a pricing curiosity",
      "A widening spread often precedes a pickup in US crude export volumes",
    ],
    usageTarget: "Sterling Commodities",
  },
  {
    id: "contango-backwardation",
    title: "Contango vs. Backwardation — Reading the Oil Curve",
    category: "Oil & refined products",
    keyPoints: [
      "Contango (further months pricier) signals oversupply — storage becomes profitable, encourages holding barrels",
      "Backwardation (near months pricier) signals tightness — desks want barrels now, not later",
      'Good line: "the curve shape tells you more about supply balance than the flat price does"',
    ],
  },
  {
    id: "refined-product-specs",
    title: "Refined Product Specs — Why They Matter to a Trader",
    category: "Oil & refined products",
    keyPoints: [
      "Gasoline, diesel, and jet fuel specs vary by region — a cargo that clears in one market may not in another",
      "Blending to spec is itself a source of margin, not just a compliance step",
    ],
  },
  {
    id: "lme-warehouse-stocks",
    title: "LME Warehouse Stocks — Why Traders Watch Them Closely",
    category: "Metals & mining",
    keyPoints: [
      "Registered stocks signal how much metal is immediately deliverable against LME contracts",
      "Cancellations and load-outs often move the forward curve before spot price reacts",
      "Low stocks in key locations tighten time spreads — watch warrant queues and cancelation trends",
    ],
  },
];

export const SALES_PREP_LIBRARY_SEED_TOPICS: PrepLibraryTopic[] = [
  {
    id: "opening-with-observation",
    title: "Opening a Meeting with a Market Observation, Not a Pitch",
    category: "Other",
    keyPoints: [
      "Lead with something specific from your coverage beat, not your product",
      "Signals you track the market daily, not just when there's something to sell",
      "Good line: reference a number that moved this week before you mention your firm",
    ],
    usageTarget: "Meridian Energy",
    note: "opened the conversation well",
  },
  {
    id: "crack-spread-framing",
    title: "Framing This Week's Crack Spread Move for a Refinery Client",
    category: "Current event",
    keyPoints: [
      "Start with the margin change, not your recommendation — let them react first",
      "Tie the move to run rates and seasonal demand, not just flat price",
      "Offer one data point they may not have seen — e.g. Gulf Coast diesel cracks vs. Singapore",
    ],
    usageTarget: "Pacific Refining Co.",
    note: "client asked follow-up questions",
  },
  {
    id: "price-pushback",
    title: "When a Client Pushes Back on Your Price — Stay on the Market",
    category: "Relationship building",
    keyPoints: [
      "Don't get defensive — acknowledge the gap and pivot to the benchmark",
      "Reference where the market traded yesterday, not where you need to be",
      "Good line: \"Let's look at what the screen says together before we talk terms\"",
    ],
  },
  {
    id: "contango-plain-language",
    title: "Explaining Contango Without Sounding Like a Textbook",
    category: "Market mechanics",
    keyPoints: [
      "Use a storage analogy: \"It costs more to hold barrels than to sell now\"",
      "Connect curve shape to what their procurement team is likely seeing in tenders",
      "Avoid jargon first — add the technical term only after they nod along",
    ],
    usageTarget: "Horizon LNG",
  },
  {
    id: "quiet-meeting-follow-up",
    title: "Following Up After a Quiet Meeting — Add Value, Don't Chase",
    category: "Relationship building",
    keyPoints: [
      "Send one relevant market note, not a check-in email asking for business",
      "Reference something specific from the meeting — shows you were listening",
      "Keep it short: one chart, one insight, no attachment overload",
    ],
    usageTarget: "Cascade Commodities",
    note: "got a callback",
  },
  {
    id: "basis-risk-story",
    title: "Using a Physical Market Story to Explain Basis Risk",
    category: "Risk & pricing",
    keyPoints: [
      "Pick a recent cargo or delivery window — basis is easier when it's concrete",
      "Contrast local price vs. benchmark on the same day, not in theory",
      "Close with how your desk watches the spread, not how you can fix it",
    ],
  },
];

/** @deprecated Use CAREER_PREP_LIBRARY_SEED_TOPICS */
export const PREP_LIBRARY_SEED_TOPICS = CAREER_PREP_LIBRARY_SEED_TOPICS;

export const PREP_LIBRARY_CATEGORIES: PrepLibraryCategory[] = [
  "Market mechanics",
  "Oil & refined products",
  "Risk & pricing",
  "Metals & mining",
];

export const SALES_PREP_LIBRARY_CATEGORIES: PrepLibraryCategory[] = [
  "Current event",
  "Market mechanics",
  "Risk & pricing",
  "Relationship building",
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
    title: "Your Prep Library",
    eyebrow: "Market talking points for sales",
    cardDescription:
      "Market topics you can bring into client conversations — ready before your next meeting.",
    color: "#0f766e",
    requiredTier: "PRO",
  },
};
