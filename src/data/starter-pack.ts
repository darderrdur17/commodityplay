import { CAREER_MARKET_NOTE } from "@/data/market-notes";

export interface StarterInfographic {
  id: string;
  num: string;
  title: string;
  description: string;
  thumbClass: string;
  fileKey: string;
  assetId?: string;
  fileName?: string;
  delivery?: "view-only" | "download";
}

export const STARTER_INFOGRAPHICS: StarterInfographic[] = [
  {
    id: "ecosystem-map",
    num: "01",
    title: "Commodity Trading Ecosystem Map",
    description: "Every player connected — from upstream producers to end consumers.",
    thumbClass: "from-accent to-primary-300",
    fileKey: "starter-pack/ecosystem-map.pdf",
  },
  {
    id: "lng-flow",
    num: "02",
    title: "LNG Cargo Flow Mechanics",
    description: "From liquefaction plant to regasification terminal — the full journey.",
    thumbClass: "from-sky-100 to-sky-300",
    fileKey: "starter-pack/lng-flow.pdf",
  },
  {
    id: "crack-spread",
    num: "03",
    title: "Crack Spread Guide",
    description: "The refinery margin signal — 3-2-1 formula, seasonal patterns, what it tells you.",
    thumbClass: "from-violet-100 to-violet-300",
    fileKey: "starter-pack/crack-spread.pdf",
  },
  {
    id: "benchmarks",
    num: "04",
    title: "Price Benchmarks 101",
    description: "Brent, WTI, Dubai, JKM, TTF — why each exists and who uses them.",
    thumbClass: "from-amber-100 to-amber-300",
    fileKey: "starter-pack/benchmarks.pdf",
  },
  {
    id: "trade-finance",
    num: "05",
    title: "Trade Finance Flow",
    description: "Letters of credit, tolling, pre-finance — how commodity deals get funded.",
    thumbClass: "from-green-100 to-green-300",
    fileKey: "starter-pack/trade-finance.pdf",
  },
];

export const STARTER_MARKET_NOTE = {
  ...CAREER_MARKET_NOTE,
  subscribed: "You're subscribed. First note lands next Tuesday.",
};

export const STARTER_CHAPTER_PREVIEW = {
  label: "Chapter A · Free Preview",
  title: "Industry Foundations",
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
