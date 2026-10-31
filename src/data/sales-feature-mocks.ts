/**
 * Illustrative content for the three sales-track feature **mock panels**.
 *
 * These panels are pictures of the product — sample nudges, sample topics,
 * example accounts — so their copy is deliberately NOT in the landing CMS. The
 * editable words for those sections (eyebrow, headline, lede, point rows) live in
 * `landing-content.ts` under `salesFeatures`.
 *
 * The source brief notes the account names and nudge/topic copy are taken from
 * product references and are free to edit. Change them here.
 */

export interface MockNudgeRow {
  /** Left-gutter label, e.g. Now / Action / Target. */
  label: string;
  text: string;
  /** Renders the row in the deeper accent colour (used for Target). */
  accent?: boolean;
}

export interface MockNudge {
  date: string;
  rows: MockNudgeRow[];
}

export interface MarketNudgesMock {
  heading: string;
  tabs: { label: string; active?: boolean }[];
  linkLabel: string;
  accountOptions: string[];
  nudges: MockNudge[];
}

export const MARKET_NUDGES_MOCK: MarketNudgesMock = {
  heading: "This week — moving talking points",
  tabs: [{ label: "Active", active: true }, { label: "Expired" }, { label: "Archive" }],
  linkLabel: "Link to account",
  accountOptions: ["XXX Energy Ltd", "XXX Gas International Group"],
  nudges: [
    {
      date: "Mid-Week (Wed, 30-Sep-2026)",
      rows: [
        {
          label: "Now",
          text: "Brent swung from above $108.5 on Monday to around $103 on Tuesday as Saudi pipeline flows resumed. Diesel has topped $6 in the US.",
        },
        {
          label: "Action",
          text: "Call procurement and treasury contacts. Ask how they are hedging the swings and whether distillate exposure is covered into Q4.",
        },
        {
          label: "Target",
          text: "Refiners, fuel distributors, airlines and other diesel-heavy buyers",
          accent: true,
        },
      ],
    },
    {
      date: "Mid-Week (Wed, 30-Sep-2026)",
      rows: [
        {
          label: "Now",
          text: "JKM fell to the low-USD 25s/MBtu and TTF to USD 24.1/MBtu as risk premiums eased. Supply hasn't normalised, though.",
        },
        {
          label: "Target",
          text: "European utilities and industrials, Asian LNG buyers",
          accent: true,
        },
      ],
    },
  ],
};

export interface MockPrepTopic {
  title: string;
  category: string;
  bullets: string[];
  unusedNote?: string;
}

export interface PrepLibraryMock {
  statValue: string;
  statLabel: string;
  month: string;
  linkLabel: string;
  accountOptions: string[];
  topics: MockPrepTopic[];
}

export const PREP_LIBRARY_MOCK: PrepLibraryMock = {
  statValue: "3",
  statLabel: "Topics saved",
  month: "August 2026",
  linkLabel: "Link to account",
  accountOptions: ["XXX Energy Ltd", "XXX Gas International Group"],
  topics: [
    {
      title: "Framing a Spread Move in a Client Conversation",
      category: "Current event",
      bullets: [
        "JKM–TTF has compressed 3 weeks straight, a good opener with LNG-exposed accounts",
        "Ask how they're adjusting hedge coverage; don't just report the number",
      ],
      unusedNote: "Not yet used with an account",
    },
    {
      title: "Opening a Meeting with a Market Observation, Not a Pitch",
      category: "Other",
      bullets: ["Lead with something specific from your coverage beat, not your product"],
    },
  ],
};

export interface MockAccount {
  name: string;
  desk: string;
  status: string;
  fromLabel: string;
  pins: string[];
}

export interface AccountIntelligenceMock {
  heading: string;
  addLabel: string;
  accounts: MockAccount[];
}

export const ACCOUNT_INTELLIGENCE_MOCK: AccountIntelligenceMock = {
  heading: "My Accounts",
  addLabel: "+ Add a New Account",
  accounts: [
    {
      name: "XXX Energy Ltd",
      desk: "Energy Trading Desk",
      status: "Active discussion",
      fromLabel: "Linked from your bookmarks",
      pins: ["Crude", "Mid-Week (Wed, 30-Sep-2026)"],
    },
    {
      name: "XXX Gas International Group",
      desk: "LNG Trading Desk",
      status: "Active discussion",
      fromLabel: "Linked from your bookmarks",
      pins: ["Mid-Week (Wed, 30-Sep-2026)"],
    },
  ],
};
