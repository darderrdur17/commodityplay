export interface MarketNudgeItem {
  id: string;
  /** Plain text; account names listed separately for bold rendering. */
  text: string;
  accountNames: string[];
}

export interface IntelligenceBrief {
  id: string;
  title: string;
  category: string;
  month: number;
  year: number;
  description: string;
  discoveryQuestions: string[];
  updatedLabel?: string;
}

export interface SalesMarketNudgesContent {
  eyebrow: string;
  title: string;
  description: string;
  weeklyNudges: MarketNudgeItem[];
  intelligenceBriefs: IntelligenceBrief[];
}

export const DEFAULT_SALES_MARKET_NUDGES_CONTENT: SalesMarketNudgesContent = {
  eyebrow: "SALES MARKET NUDGES",
  title: "What's Moving, Briefed for You.",
  description:
    "Practitioner-framed market briefs, refreshed weekly — plus a nudge whenever a move affects one of your tracked accounts. This is your Intelligence layer.",
  weeklyNudges: [
    {
      id: "jkm-ttf-spread",
      text: "JKM—TTF spread compressed sharply this week — affects 2 of your tracked accounts",
      accountNames: ["Meridian Energy", "Northbridge Gas"],
    },
    {
      id: "vlcc-rates-spike",
      text: "Gulf Coast VLCC rates spiked on an unplanned outage — relevant to",
      accountNames: ["Solace Trade Finance"],
    },
  ],
  intelligenceBriefs: [
    {
      id: "crude-aug-2026",
      title: "Crude",
      category: "Crude",
      month: 8,
      year: 2026,
      updatedLabel: "Updated Mon",
      description:
        "Brent held above $82 as OPEC+ compliance tightened and Atlantic basin differentials widened. Gulf Coast export flows remain the swing factor for WTI–Brent.",
      discoveryQuestions: [
        "How is your desk adjusting hedge ratios with Brent at these levels?",
        "Are you seeing any cargo diversion risk on Atlantic–Asia routes?",
      ],
    },
    {
      id: "gasoline-aug-2026",
      title: "Gasoline",
      category: "Gasoline",
      month: 8,
      year: 2026,
      updatedLabel: "Updated Mon",
      description:
        "RBOB crack spreads compressed as refinery run rates climbed ahead of driving season. East Coast inventory builds are easing near-term tightness.",
      discoveryQuestions: [
        "Where are you seeing the biggest margin pressure — flat price or crack?",
        "How are you positioning ahead of the seasonal demand peak?",
      ],
    },
    {
      id: "copper-aug-2026",
      title: "Copper",
      category: "Copper",
      month: 8,
      year: 2026,
      updatedLabel: "Updated Mon",
      description:
        "LME copper held firm on China stimulus signals and tight warehouse stocks in Asia. Time spreads are signalling immediate deliverability risk in key locations.",
      discoveryQuestions: [
        "Are you watching warrant queues or focusing on flat-price exposure?",
        "How is your coverage team framing the China demand narrative this week?",
      ],
    },
    {
      id: "lng-aug-2026",
      title: "LNG",
      category: "LNG",
      month: 8,
      year: 2026,
      updatedLabel: "Updated Mon",
      description:
        "JKM–TTF spread compression accelerated as European storage filled and Asian buyers slowed spot procurement. Freight rates are the new swing variable.",
      discoveryQuestions: [
        "How are LNG-exposed accounts adjusting their hedge coverage?",
        "Is freight cost showing up in their cargo economics conversations yet?",
      ],
    },
    {
      id: "crude-jul-2026",
      title: "Crude",
      category: "Crude",
      month: 7,
      year: 2026,
      updatedLabel: "Updated Mon",
      description:
        "WTI–Brent spread widened on strong US export flows. Gulf Coast differentials remain the key signal for Atlantic basin balance.",
      discoveryQuestions: [
        "Are your accounts leaning into export-driven spread trades this month?",
        "How are they framing OPEC+ compliance in client conversations?",
      ],
    },
    {
      id: "lng-jul-2026",
      title: "LNG",
      category: "LNG",
      month: 7,
      year: 2026,
      updatedLabel: "Updated Mon",
      description:
        "TTF rallied on unplanned maintenance while JKM lagged, widening the spread. Spot procurement slowed across North Asia.",
      discoveryQuestions: [
        "Which accounts are most exposed to the JKM–TTF gap this week?",
        "Are they asking about freight-adjusted economics yet?",
      ],
    },
  ],
};

/** Month labels for sidebar filter — newest periods first. */
export function groupBriefsByMonthYear(
  briefs: IntelligenceBrief[]
): { label: string; month: number; year: number; briefs: IntelligenceBrief[] }[] {
  const sorted = [...briefs].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });

  const groups = new Map<string, IntelligenceBrief[]>();
  for (const brief of sorted) {
    const label = new Date(brief.year, brief.month - 1, 1).toLocaleDateString("en-GB", {
      month: "long",
      year: "numeric",
    });
    const bucket = groups.get(label) ?? [];
    bucket.push(brief);
    groups.set(label, bucket);
  }

  return Array.from(groups.entries()).map(([label, groupBriefs]) => ({
    label,
    month: groupBriefs[0]!.month,
    year: groupBriefs[0]!.year,
    briefs: groupBriefs,
  }));
}

export function formatBriefPeriodLabel(month: number, year: number): string {
  return new Date(year, month - 1, 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}
