export interface MarketNoteTopic {
  tag?: string;
  tagColor?: string;
  tagBg?: string;
  title: string;
  /** Extra bullets under the same tag (Gasoil, LPG, Movements). */
  extraLines?: string[];
}

export function topicDisplayLines(topic: MarketNoteTopic): string[] {
  const main = topic.title.trim();
  const extras = (topic.extraLines ?? []).map((line) => line.trim()).filter(Boolean);
  return main ? [main, ...extras] : extras;
}

/** Career track weekly note strip */
export const CAREER_MARKET_NOTE = {
  eyebrow: "Live · Every Tuesday Edition",
  title: "The Market Note That Builds Your Desk Credibility.",
  description:
    "Not just a market digest — a career intelligence briefing. Each note breaks down how the desk would explain it, so you walk into interviews and conversations already sounding like you are rooted to the same space.",
  topics: [
    {
      tag: "Market",
      tagColor: "#2563eb",
      tagBg: "#dbeafe",
      title: "Why the EIA draw didn't move flat price — and how to explain that in an interview",
    },
    {
      tag: "Career",
      tagColor: "#b45309",
      tagBg: "#fef3c7",
      title: 'What "commercial awareness" actually means to a hiring desk',
    },
    {
      tag: "Desk",
      tagColor: "#15803d",
      tagBg: "#dcfce7",
      title: "How a physical trader sizes a position — the logic behind the number",
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
  ] satisfies MarketNoteTopic[],
};

/** Sales track market note strip — feature titles/captions live on landing CMS `sales.trackTools`. */
export const SALES_MARKET_NOTE = {
  eyebrow: "Sales Track Only",
  title: "Sales Track tools",
  description: "",
  topicsHeading: "Recent Talking Points",
  topics: [
    { tag: "Crude Oil", tagColor: "#2563eb", tagBg: "#dbeafe", title: "OPEC+ cut → Budget mood at major firms" },
    { tag: "Freight", tagColor: "#b45309", tagBg: "#fef3c7", title: "VLCC Rate Spike → Maritime tech opportunity window" },
    { tag: "LNG", tagColor: "#15803d", tagBg: "#dcfce7", title: "JKM/TTF Spread → What Asian desk buyers are weighing" },
    { tag: "Gas", tagColor: "#7c3aed", tagBg: "#ede9fe", title: "European Storage → Energy sector account timing" },
    {
      tag: "Gasoil",
      tagColor: "#c2410c",
      tagBg: "#ffedd5",
      title: "Refinery outage cuts diesel supply → distributors sourcing alternatives",
      extraLines: ["Asian gasoil demand climbs → new import tenders open"],
    },
    {
      tag: "LPG",
      tagColor: "#be185d",
      tagBg: "#fce7f3",
      title: "Export terminal expansion → new offtake deals in play",
      extraLines: ["Propane price gap widens → arbitrage window for traders"],
    },
    {
      tag: "Movements",
      tagColor: "#475569",
      tagBg: "#e2e8f0",
      title: "Veteran LNG trader exits regional desk → building a new coverage list",
      extraLines: ["Mid-size trading house acquires distributor → account ownership may shift"],
    },
  ] satisfies MarketNoteTopic[],
};

/** Unedited first seed on production (four single-line tags). */
export const LEGACY_SALES_TALKING_POINT_TITLES = [
  "OPEC+ cut → Budget mood at major firms",
  "VLCC Rate Spike → Maritime tech opportunity window",
  "JKM/TTF Spread → What Asian desk buyers are weighing",
  "European Storage → Energy sector account timing",
] as const;
