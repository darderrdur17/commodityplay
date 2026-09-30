export type NudgeLifecycleStatus = "active" | "expired" | "archive";

export interface MarketNudgeItem {
  id: string;
  title: string;
  whyNow: string;
  accountAction: string;
  accountNames: string[];
  status: NudgeLifecycleStatus;
}

export interface IntelligenceBrief {
  id: string;
  title: string;
  category: string;
  month: number;
  year: number;
  description: string;
  discoveryQuestions: string[];
  /** ISO calendar date `YYYY-MM-DD` shown on member cards as "3 Sep". */
  updatedAt?: string;
  /** Legacy free-text label; ignored on member cards when `updatedAt` is missing. */
  updatedLabel?: string;
  status: NudgeLifecycleStatus;
}

export interface SalesMarketNudgesContent {
  eyebrow: string;
  title: string;
  description: string;
  /** Green card heading on the member page. */
  weeklyHeading: string;
  /** Briefs section heading on the member page. */
  briefsHeading: string;
  weeklyNudges: MarketNudgeItem[];
  intelligenceBriefs: IntelligenceBrief[];
  /** Admin-managed commodity categories used to tag and filter briefs. */
  briefCategories: string[];
}

export const DEFAULT_SALES_MARKET_NUDGES_CONTENT: SalesMarketNudgesContent = {
  eyebrow: "SALES MARKET NUDGES",
  title: "What's Moving, Briefed for You.",
  description:
    "Practitioner-framed market briefs, refreshed weekly — plus a nudge whenever a move affects one of your tracked accounts. This is your Intelligence layer.",
  weeklyHeading: "This Week — Talking Points",
  briefsHeading: "Talking Points",
  briefCategories: ["Crude", "Gasoline", "Copper", "LNG"],
  weeklyNudges: [
    {
      id: "jkm-ttf-spread",
      title: "JKM—TTF spread compressed",
      whyNow: "JKM—TTF spread compressed sharply this week — affects 2 of your tracked accounts.",
      accountAction: "Reach Meridian Energy and Northbridge Gas with a framed talking point this week.",
      accountNames: ["Meridian Energy", "Northbridge Gas"],
      status: "active",
    },
    {
      id: "vlcc-rates-spike",
      title: "Gulf Coast VLCC rates spiked",
      whyNow: "Gulf Coast VLCC rates spiked on an unplanned outage.",
      accountAction: "Brief Solace Trade Finance on freight-adjusted economics.",
      accountNames: ["Solace Trade Finance"],
      status: "active",
    },
  ],
  intelligenceBriefs: [
    {
      id: "crude-aug-2026",
      title: "Crude",
      category: "Crude",
      month: 8,
      year: 2026,
      updatedAt: "2026-08-03",
      description:
        "Brent held above $82 as OPEC+ compliance tightened and Atlantic basin differentials widened. Gulf Coast export flows remain the swing factor for WTI–Brent.",
      discoveryQuestions: [
        "How is your desk adjusting hedge ratios with Brent at these levels?",
        "Are you seeing any cargo diversion risk on Atlantic–Asia routes?",
      ],
      status: "active",
    },
    {
      id: "gasoline-aug-2026",
      title: "Gasoline",
      category: "Gasoline",
      month: 8,
      year: 2026,
      updatedAt: "2026-08-03",
      description:
        "RBOB crack spreads compressed as refinery run rates climbed ahead of driving season. East Coast inventory builds are easing near-term tightness.",
      discoveryQuestions: [
        "Where are you seeing the biggest margin pressure — flat price or crack?",
        "How are you positioning ahead of the seasonal demand peak?",
      ],
      status: "active",
    },
    {
      id: "copper-aug-2026",
      title: "Copper",
      category: "Copper",
      month: 8,
      year: 2026,
      updatedAt: "2026-08-03",
      description:
        "LME copper held firm on China stimulus signals and tight warehouse stocks in Asia. Time spreads are signalling immediate deliverability risk in key locations.",
      discoveryQuestions: [
        "Are you watching warrant queues or focusing on flat-price exposure?",
        "How is your coverage team framing the China demand narrative this week?",
      ],
      status: "active",
    },
    {
      id: "lng-aug-2026",
      title: "LNG",
      category: "LNG",
      month: 8,
      year: 2026,
      updatedAt: "2026-08-03",
      description:
        "JKM–TTF spread compression accelerated as European storage filled and Asian buyers slowed spot procurement. Freight rates are the new swing variable.",
      discoveryQuestions: [
        "How are LNG-exposed accounts adjusting their hedge coverage?",
        "Is freight cost showing up in their cargo economics conversations yet?",
      ],
      status: "active",
    },
    {
      id: "crude-jul-2026",
      title: "Crude",
      category: "Crude",
      month: 7,
      year: 2026,
      updatedAt: "2026-07-06",
      description:
        "WTI–Brent spread widened on strong US export flows. Gulf Coast differentials remain the key signal for Atlantic basin balance.",
      discoveryQuestions: [
        "Are your accounts leaning into export-driven spread trades this month?",
        "How are they framing OPEC+ compliance in client conversations?",
      ],
      status: "active",
    },
    {
      id: "lng-jul-2026",
      title: "LNG",
      category: "LNG",
      month: 7,
      year: 2026,
      updatedAt: "2026-07-06",
      description:
        "TTF rallied on unplanned maintenance while JKM lagged, widening the spread. Spot procurement slowed across North Asia.",
      discoveryQuestions: [
        "Which accounts are most exposed to the JKM–TTF gap this week?",
        "Are they asking about freight-adjusted economics yet?",
      ],
      status: "active",
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
    const label = formatBriefPeriodLabel(brief.month, brief.year);
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
    month: "short",
    year: "numeric",
  });
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** First Monday of `month` (1–12) as `YYYY-MM-DD`, for seed/default briefs. */
export function defaultBriefUpdatedAt(year: number, month: number): string {
  const first = new Date(year, month - 1, 1);
  const dow = first.getDay();
  const add = dow === 0 ? 1 : dow === 1 ? 0 : 8 - dow;
  const monday = new Date(year, month - 1, 1 + add);
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, "0");
  const d = String(monday.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Member-facing date, e.g. "3 Sep". Falls back to the first Monday of the brief month. */
export function formatBriefCardDate(brief: Pick<IntelligenceBrief, "updatedAt" | "month" | "year">): string | null {
  return (
    formatBriefUpdatedAt(brief.updatedAt) ??
    formatBriefUpdatedAt(defaultBriefUpdatedAt(brief.year, brief.month))
  );
}

/** Member-facing date, e.g. "3 Sep". Returns null if `updatedAt` is missing or invalid. */
export function formatBriefUpdatedAt(updatedAt?: string): string | null {
  if (!updatedAt) return null;
  const match = ISO_DATE.exec(updatedAt.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  const shortMonths = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ] as const;
  return `${day} ${shortMonths[month - 1]}`;
}

export const DEFAULT_BRIEF_CATEGORIES = ["Crude", "Gasoline", "Copper", "LNG"] as const;

export function resolveBriefCategories(
  stored?: string[],
  briefs?: IntelligenceBrief[]
): string[] {
  const fromCms = (stored ?? []).map((c) => c.trim()).filter(Boolean);
  if (fromCms.length) return Array.from(new Set(fromCms));
  const fromBriefs = [...new Set((briefs ?? []).map((b) => b.category.trim()).filter(Boolean))];
  return fromBriefs.length ? fromBriefs : [...DEFAULT_BRIEF_CATEGORIES];
}
