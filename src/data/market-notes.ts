export interface MarketNoteTopic {
  tag?: string;
  tagColor?: string;
  tagBg?: string;
  title: string;
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

/** Sales track market note strip */
export const SALES_MARKET_NOTE = {
  eyebrow: "Sales Track Only",
  title: "Sales Market Nudges | Prep Library | Account Intelligence Tracker",
  description:
    "Use market nudges in your next conversation with your customer — and relate the context with them easier by saving the talking points under your personal Prep Library. Track the desks you're engaging, and see what's moving in their markets before your next call — a separate enhanced tool from your Prep Library.",
  topics: [
    { tag: "Crude Oil", tagColor: "#2563eb", tagBg: "#dbeafe", title: "OPEC+ cut → Budget mood at major firms" },
    { tag: "Freight", tagColor: "#b45309", tagBg: "#fef3c7", title: "VLCC Rate Spike → Maritime tech opportunity window" },
    { tag: "LNG", tagColor: "#15803d", tagBg: "#dcfce7", title: "JKM/TTF Spread → What Asian desk buyers are weighing" },
    { tag: "Gas", tagColor: "#7c3aed", tagBg: "#ede9fe", title: "European Storage → Energy sector account timing" },
  ] satisfies MarketNoteTopic[],
};
