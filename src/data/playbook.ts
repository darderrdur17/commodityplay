import playbookSections from "./playbook-sections.json";

export interface PlaybookSection {
  id: string;
  number: string;
  title: string;
  desc: string;
  hook: string;
  paragraphs: string[];
  pullQuote?: string;
  wtmfy?: string;
  handoff?: string;
}

export const CHAPTERS = [
  {
    id: "a",
    letter: "A",
    title: "Industry Foundations",
    subtitle: "Physical vs. paper markets, energy landscape, how trades make money, refinery economics, shipping basics",
    color: "#0830a0",
    pages: 42,
    readTime: "80 min",
    preview: true,
    sections: playbookSections.a.map((s) => ({ title: s.title, pages: s.number })),
    keyTakeaways: [
      "Distinguish physical trading from paper markets and explain why both matter",
      "Map oil, LNG, gas, and power — and how price signals connect across them",
      "Identify the six revenue levers a desk uses beyond flat price",
      "Read crack spreads, freight, storage, and PRAs as commercial signals",
    ],
  },
  {
    id: "b",
    letter: "B",
    title: "Physical & Paper Trading Markets",
    subtitle: "Trade lifecycle, futures, swaps, options, hedging mechanics, basis and differentials, EFS",
    color: "#0131cc",
    pages: 38,
    readTime: "80 min",
    preview: false,
    sections: playbookSections.b.map((s) => ({ title: s.title, pages: s.number })),
    keyTakeaways: [
      "Trace a physical trade from enquiry to settlement",
      "Explain how futures, swaps, and options hedge physical exposure",
      "Articulate basis risk and why location differentials matter",
      "Describe how the trading book stacks physical, paper, and freight",
    ],
  },
  {
    id: "c",
    letter: "C",
    title: "Shipping, Freight & Cargo Logistics",
    subtitle: "Vessel classes, freight rate mechanics, laytime, cargo nominations, AIS tracking, diversion decisions",
    color: "#0040f5",
    pages: 44,
    readTime: "80 min",
    preview: false,
    sections: playbookSections.c.map((s) => ({ title: s.title, pages: s.number })),
    keyTakeaways: [
      "Match vessel classes to cargo types and route economics",
      "Calculate laytime and demurrage exposure on a fixture",
      "Use AIS and flow data as market intelligence",
      "Evaluate a cargo diversion decision under time pressure",
    ],
  },
  {
    id: "d",
    letter: "D",
    title: "Market Intelligence & Price Discovery",
    subtitle: "Market views, EIA reports, forward curves, price assessments, supply disruptions, COT data",
    color: "#115cff",
    pages: 36,
    readTime: "80 min",
    preview: false,
    sections: playbookSections.d.map((s) => ({ title: s.title, pages: s.number })),
    keyTakeaways: [
      "Build a structured market view from fundamentals and macro",
      "Read the EIA report and forward curve for actionable signals",
      "Understand Platts/Argus assessment methodology",
      "Integrate positioning data and seasonality into desk workflow",
    ],
  },
  {
    id: "e",
    letter: "E",
    title: "Commercial Decision-Making & Risk",
    subtitle: "Arbitrage windows, cargo diversion, hedge timing, P&L attribution, VaR, cutting losses",
    color: "#3280ff",
    pages: 40,
    readTime: "80 min",
    preview: false,
    sections: playbookSections.e.map((s) => ({ title: s.title, pages: s.number })),
    keyTakeaways: [
      "Think commercially under uncertainty — size positions to conviction",
      "Run an arbitrage window calculation with freight and basis",
      "Attribute P&L across flat price, time, location, and freight",
      "Apply VaR limits and know when to cut a losing thesis",
    ],
  },
] as const;

/** Full playbook scope shown in Pro hub and member progress (landing lists A–I). */
export const PLAYBOOK_TOTAL_CHAPTERS = 9;
export const PLAYBOOK_TOTAL_SECTIONS = 72;

export function getChapterSections(chapterId: string): PlaybookSection[] {
  const key = chapterId as keyof typeof playbookSections;
  return (playbookSections[key] as PlaybookSection[]) || [];
}
