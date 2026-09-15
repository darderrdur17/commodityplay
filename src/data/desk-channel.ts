import { BRAND_EDITORIAL } from "@/lib/brand";

/** Category id is CMS-owned — not limited to the five seed desks. */
export type DeskCategory = string;

export interface DeskQA {
  id: string;
  category: DeskCategory;
  categoryLabel: string;
  categoryColor: string;
  question: string;
  answer: string;
  deskSignal?: string;
  attribution: "editorial" | "practitioner";
  author: string;
  authorRole: string;
  tags: string[];
  helpful: number;
  date: string;
  /** ISO `YYYY-MM-DD` — used for the member freshness strip. */
  addedAt?: string;
  updatedAt?: string;
  track?: "career" | "sales" | "both";
}

export type DeskCategoryChip = {
  id: DeskCategory | "all";
  label: string;
  color: string;
  count: number;
};

export const DESK_CATEGORIES: DeskCategoryChip[] = [
  { id: "all", label: "All Questions", color: "#3280ff", count: 40 },
  { id: "trading", label: "Trading & Market Analysis", color: "#3280ff", count: 8 },
  { id: "ops", label: "Operations & Scheduling", color: "#B45309", count: 8 },
  { id: "risk", label: "Risk & Compliance", color: "#5B21B6", count: 8 },
  { id: "tools", label: "Market Intelligence & Tools", color: "#0F766E", count: 8 },
  { id: "career", label: "Career Positioning", color: "#0040f5", count: 8 },
];

function asCategoryRow(value: unknown): { id: string; label: string; color: string } | null {
  if (!value || typeof value !== "object") return null;
  const row = value as { id?: unknown; label?: unknown; color?: unknown };
  const id = typeof row.id === "string" ? row.id.trim() : "";
  if (!id || id === "all") return null;
  return {
    id,
    label: typeof row.label === "string" && row.label.trim() ? row.label.trim() : id,
    color: typeof row.color === "string" && row.color.trim() ? row.color.trim() : "#3280ff",
  };
}

export function slugifyDeskCategoryId(label: string, existingIds: readonly string[]): string {
  const base =
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "category";
  const taken = new Set(existingIds.concat("all"));
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

export function deskCategoryMeta(
  categories: readonly DeskCategoryChip[],
  id: string
): { label: string; color: string } {
  const row = categories.find((c) => c.id === id);
  if (row) return { label: row.label, color: row.color };
  const seed = DESK_CATEGORIES.find((c) => c.id === id);
  if (seed) return { label: seed.label, color: seed.color };
  return { label: id, color: "#3280ff" };
}

/** Always includes All Questions, then N CMS categories, then any orphan ids still used on Q&As. */
export function mergeDeskCategories(cms: unknown, questions: readonly DeskQA[]): DeskCategoryChip[] {
  const seen = new Set<string>();
  const defs: { id: string; label: string; color: string }[] = [];
  const source = Array.isArray(cms) && cms.length > 0 ? cms : DESK_CATEGORIES;
  for (const raw of source) {
    const row = asCategoryRow(raw);
    if (!row || seen.has(row.id)) continue;
    seen.add(row.id);
    defs.push(row);
  }
  if (defs.length === 0) {
    for (const seed of DESK_CATEGORIES) {
      if (seed.id === "all") continue;
      defs.push({ id: seed.id, label: seed.label, color: seed.color });
      seen.add(seed.id);
    }
  }
  for (const q of questions) {
    const id = typeof q.category === "string" ? q.category.trim() : "";
    if (!id || seen.has(id)) continue;
    seen.add(id);
    defs.push({
      id,
      label: q.categoryLabel?.trim() || id,
      color: q.categoryColor?.trim() || "#3280ff",
    });
  }
  const byCat: Record<string, number> = {};
  for (const q of questions) {
    byCat[q.category] = (byCat[q.category] ?? 0) + 1;
  }
  return [
    { id: "all", label: "All Questions", color: "#3280ff", count: questions.length },
    ...defs.map((d) => ({ ...d, count: byCat[d.id] ?? 0 })),
  ];
}

export const DESK_QA: DeskQA[] = [
  {
    id: "t1",
    category: "trading",
    categoryLabel: "Trading & Market Analysis",
    categoryColor: "#3280ff",
    question:
      "What is the difference between a flat price trade and a spread trade — and which one does a commodity desk actually spend most of its time on?",
    answer:
      "A flat price trade is a directional bet on the outright price level — you are long or short Brent at $82/bbl and P&L depends on where price goes. A spread trade buys one instrument and sells a related one; P&L comes from the change in the difference between them.\n\nMost commodity desks spend far more time on spreads than flat price because risk-adjusted return is better. When crude falls, both legs often fall together and the spread may barely move. Common types: time spreads (M1 vs M6), location spreads (Brent vs WTI), quality spreads (crack spreads), and inter-commodity spreads.",
    deskSignal:
      "A spread position must be hedged with a spread instrument — not just one leg. Mis-hedging this distinction is a common source of unexpected P&L.",
    attribution: "editorial",
    author: "In-house Editorial Team",
    authorRole: BRAND_EDITORIAL,
    tags: ["Flat Price", "Spread Trading", "Basis", "Arbitrage"],
    helpful: 18,
    date: "May 2025",
  },
  {
    id: "t2",
    category: "trading",
    categoryLabel: "Trading & Market Analysis",
    categoryColor: "#3280ff",
    question:
      "How do traders read the Platts Market on Close (MOC) window — and can participants really influence the assessment?",
    answer:
      "The MOC window is the last 30 minutes of the Platts trading day where benchmark prices are assessed from bids, offers, and done deals submitted to reporters. Participants can legally influence assessments through normal market participation — aggressive bids push up, large offers push down. Regulators focus on coordinated manipulation tied to derivatives positions.\n\nFrom a market intelligence view, MOC activity is itself a signal: aggressive bidding often indicates a long physical book; large offers may indicate short exposure or cargo to place.",
    deskSignal:
      "Flag cargoes priced against benchmarks when a single participant dominated the MOC window — even if technically within rules.",
    attribution: "practitioner",
    author: "Former Physical Crude Trader",
    authorRole: "14 years · Singapore and London",
    tags: ["Platts MOC", "Benchmark", "Dated Brent"],
    helpful: 27,
    date: "Apr 2025",
  },
  {
    id: "t3",
    category: "trading",
    categoryLabel: "Trading & Market Analysis",
    categoryColor: "#3280ff",
    question: "What does the crack spread actually tell you — and how does a refining desk use it differently from a crude desk?",
    answer:
      "The crack spread measures refinery margin — the value of refined products minus crude cost. A crude desk uses it to understand product demand and refinery run rates; a refining desk uses it to hedge margin and optimize product slate. Trading desks often trade crack spreads as a proxy for refinery economics without owning refinery assets.",
    tags: ["Crack Spread", "Refining", "Margin"],
    attribution: "editorial",
    author: "In-house Editorial Team",
    authorRole: BRAND_EDITORIAL,
    helpful: 14,
    date: "Mar 2025",
  },
  {
    id: "t4",
    category: "trading",
    categoryLabel: "Trading & Market Analysis",
    categoryColor: "#3280ff",
    question:
      "What is the JKM/TTF arbitrage and how do you calculate whether it is actually open?",
    answer:
      "JKM/TTF arb compares LNG delivered to Asia (JKM) vs Europe (TTF), net of freight, boil-off, and financing. The arb is open when JKM premium over TTF exceeds variable shipping and regas costs. Traders monitor vessel availability, canal transit times, and storage levels at both ends before committing cargoes.",
    tags: ["LNG", "JKM", "TTF", "Arbitrage"],
    attribution: "practitioner",
    author: "LNG Commercial Manager",
    authorRole: "10 years · Singapore",
    helpful: 22,
    date: "Feb 2025",
  },
  {
    id: "t5",
    category: "trading",
    categoryLabel: "Trading & Market Analysis",
    categoryColor: "#3280ff",
    question:
      "How does managed money positioning in futures affect physical commodity prices?",
    answer:
      "Managed money (speculators) in COT reports can amplify moves but rarely drive long-term physical fundamentals. Physical traders watch extremes in positioning as contrarian or momentum signals — but always cross-check with inventory, flows, and refinery margins before acting.",
    tags: ["COT", "Futures", "Positioning"],
    attribution: "editorial",
    author: "In-house Editorial Team",
    authorRole: BRAND_EDITORIAL,
    helpful: 11,
    date: "Jan 2025",
  },
  {
    id: "t6",
    category: "trading",
    categoryLabel: "Trading & Market Analysis",
    categoryColor: "#3280ff",
    question: "What is contango vs backwardation and why does it matter for storage plays?",
    answer:
      "Contango (forward > spot) incentivises storage when carry exceeds storage cost. Backwardation (spot > forward) discourages inventory builds and often signals tight near-term supply. Storage traders monetise contango via carry trades; producers may defer sales in backwardation.",
    tags: ["Contango", "Backwardation", "Storage"],
    attribution: "editorial",
    author: "In-house Editorial Team",
    authorRole: BRAND_EDITORIAL,
    helpful: 19,
    date: "Dec 2024",
  },
  {
    id: "t7",
    category: "trading",
    categoryLabel: "Trading & Market Analysis",
    categoryColor: "#3280ff",
    question: "How do OPEC decisions flow through to physical prices — and how quickly?",
    answer:
      "OPEC+ announcements affect sentiment immediately in futures; physical differentials adjust over days to weeks as buyers reassess term coverage and spot availability. The speed depends on whether the cut is credible, observable in exports, and aligned with seasonal demand.",
    tags: ["OPEC", "Crude", "Supply"],
    attribution: "practitioner",
    author: "Middle East Crude Originator",
    authorRole: "12 years · Geneva",
    helpful: 16,
    date: "Nov 2024",
  },
  {
    id: "t8",
    category: "trading",
    categoryLabel: "Trading & Market Analysis",
    categoryColor: "#3280ff",
    question: "DES vs FOB in LNG — which gives a buyer more flexibility?",
    answer:
      "FOB puts shipping and destination risk on the buyer — maximum flexibility on vessel and discharge port. DES (delivered ex-ship) transfers logistics to the seller; buyer gets certainty on landed cost but less routing control. Most term buyers negotiate DES for simplicity; traders prefer FOB for optionality.",
    tags: ["LNG", "FOB", "DES", "Shipping"],
    attribution: "practitioner",
    author: "LNG Scheduler",
    authorRole: "8 years · Tokyo",
    helpful: 13,
    date: "Oct 2024",
  },
  // Operations (8)
  {
    id: "o1",
    category: "ops",
    categoryLabel: "Operations & Scheduling",
    categoryColor: "#B45309",
    question: "What is a Notice of Readiness (NOR) and why does timing matter commercially?",
    answer:
      "NOR is the formal signal that a vessel is ready to load or discharge. Laytime (free time) typically starts after NOR is accepted. Tendering NOR too early risks rejection; too late triggers demurrage. Schedulers coordinate with agents, terminals, and traders because every hour counts at $30–80k/day demurrage on large tankers.",
    deskSignal: "Always reconcile NOR timestamps with terminal logs before signing laytime statements.",
    attribution: "practitioner",
    author: "Senior Operations Manager",
    authorRole: "15 years · Rotterdam",
    tags: ["NOR", "Laytime", "Demurrage"],
    helpful: 21,
    date: "May 2025",
  },
  {
    id: "o2",
    category: "ops",
    categoryLabel: "Operations & Scheduling",
    categoryColor: "#B45309",
    question: "How does a cargo nomination work in an LNG term contract?",
    answer:
      "Buyers nominate cargoes within contract windows (often 60–90 days ahead) specifying quantity, delivery window, and discharge port. Missing nomination deadlines can forfeit the cargo or trigger penalties. Schedulers maintain rolling 12-month programmes aligned with storage and offtake.",
    tags: ["LNG", "Nomination", "Term Contract"],
    attribution: "editorial",
    author: "In-house Editorial Team",
    authorRole: BRAND_EDITORIAL,
    helpful: 15,
    date: "Apr 2025",
  },
  {
    id: "o3",
    category: "ops",
    categoryLabel: "Operations & Scheduling",
    categoryColor: "#B45309",
    question: "Voyage charter vs time charter — when does a desk choose each?",
    answer:
      "Voyage charter: pay per trip — good for one-off cargoes. Time charter: hire vessel for a period — good for regular programmes or when you need guaranteed capacity. Trading desks use time charters when arb windows are frequent; voyage when exposure is single-cargo.",
    tags: ["Chartering", "Freight", "Shipping"],
    attribution: "editorial",
    author: "In-house Editorial Team",
    authorRole: BRAND_EDITORIAL,
    helpful: 12,
    date: "Mar 2025",
  },
  {
    id: "o4",
    category: "ops",
    categoryLabel: "Operations & Scheduling",
    categoryColor: "#B45309",
    question: "Why does the bill of lading matter beyond shipping?",
    answer:
      "The B/L is title document — whoever holds it controls the cargo. Banks require it for L/C settlement; traders use it for resale while cargo is in transit. A clean B/L (no remarks on quality/quantity) is essential for smooth payment.",
    tags: ["Bill of Lading", "Documentation", "Trade Finance"],
    attribution: "practitioner",
    author: "Trade Operations Lead",
    authorRole: "11 years · Singapore",
    helpful: 18,
    date: "Feb 2025",
  },
  {
    id: "o5",
    category: "ops",
    categoryLabel: "Operations & Scheduling",
    categoryColor: "#B45309",
    question: "How does AIS data help schedulers manage cargo programmes?",
    answer:
      "AIS tracks vessel position, speed, and ETA in near real-time. Schedulers use it to anticipate delays, reroute if needed, and update buyers. Combined with port congestion data, it reduces demurrage surprises.",
    tags: ["AIS", "Logistics", "Scheduling"],
    attribution: "editorial",
    author: "In-house Editorial Team",
    authorRole: BRAND_EDITORIAL,
    helpful: 10,
    date: "Jan 2025",
  },
  {
    id: "o6",
    category: "ops",
    categoryLabel: "Operations & Scheduling",
    categoryColor: "#B45309",
    question: "SHEX vs SHINC in laytime — what is the difference?",
    answer:
      "SHEX (Sundays/Holidays Excluded) excludes certain days from laytime counting. SHINC (Sundays/Holidays Included) counts all days. The choice directly affects demurrage exposure — always verify which applies in your charter party.",
    tags: ["Laytime", "Charter Party", "Demurrage"],
    attribution: "editorial",
    author: "In-house Editorial Team",
    authorRole: BRAND_EDITORIAL,
    helpful: 9,
    date: "Dec 2024",
  },
  {
    id: "o7",
    category: "ops",
    categoryLabel: "Operations & Scheduling",
    categoryColor: "#B45309",
    question: "What does a cargo diversion involve operationally?",
    answer:
      "Diversion requires seller/buyer agreement, revised freight, port clearance, updated B/L or LOI chain, and often insurance notification. Order: trader approval → scheduler → agent → terminal → counterparty. Done wrong, you lose title or pay double freight.",
    tags: ["Diversion", "Operations", "Logistics"],
    attribution: "practitioner",
    author: "Cargo Operations Specialist",
    authorRole: "9 years · Houston",
    helpful: 14,
    date: "Nov 2024",
  },
  {
    id: "o8",
    category: "ops",
    categoryLabel: "Operations & Scheduling",
    categoryColor: "#B45309",
    question: "What is an ETRM and why should non-technical roles understand it?",
    answer:
      "Energy Trading Risk Management systems capture trades, positions, P&L, and risk. Mid-office and commercial teams need enough ETRM literacy to verify bookings, understand MTM timing, and escalate breaks before month-end close.",
    tags: ["ETRM", "Operations", "Systems"],
    attribution: "editorial",
    author: "In-house Editorial Team",
    authorRole: BRAND_EDITORIAL,
    helpful: 8,
    date: "Oct 2024",
  },
  // Risk (8 condensed)
  {
    id: "r1",
    category: "risk",
    categoryLabel: "Risk & Compliance",
    categoryColor: "#5B21B6",
    question: "What is VaR and how do commodity desks actually use it?",
    answer:
      "Value at Risk estimates maximum loss over a horizon at a confidence level. Desks use it for limit setting, not prediction. Physical books often supplement VaR with stress scenarios (sanctions, port closure, force majeure) because tail events dominate commodity risk.",
    tags: ["VaR", "Risk", "Limits"],
    attribution: "editorial",
    author: "In-house Editorial Team",
    authorRole: BRAND_EDITORIAL,
    helpful: 17,
    date: "May 2025",
  },
  {
    id: "r2",
    category: "risk",
    categoryLabel: "Risk & Compliance",
    categoryColor: "#5B21B6",
    question: "How does counterparty credit work on a physical desk?",
    answer:
      "Each counterparty has a credit limit based on rating, collateral, and history. Trades above limit require prepayment or LC. Physical traders must check credit before confirming deals — a profitable trade with a defaulting counterparty is still a loss.",
    tags: ["Credit", "Counterparty", "ISDA"],
    attribution: "practitioner",
    author: "Head of Credit",
    authorRole: "18 years · London",
    helpful: 20,
    date: "Apr 2025",
  },
  {
    id: "r3",
    category: "risk",
    categoryLabel: "Risk & Compliance",
    categoryColor: "#5B21B6",
    question: "What triggers a margin call and how fast must you respond?",
    answer:
      "When mark-to-market moves against your futures/options position below maintenance margin, the broker issues a call — typically same-day or next-morning funding. Failure to meet calls leads to forced liquidation. Physical desks hedge basis risk separately from flat price margin.",
    tags: ["Margin", "Futures", "Hedging"],
    attribution: "editorial",
    author: "In-house Editorial Team",
    authorRole: BRAND_EDITORIAL,
    helpful: 15,
    date: "Mar 2025",
  },
  {
    id: "r4",
    category: "risk",
    categoryLabel: "Risk & Compliance",
    categoryColor: "#5B21B6",
    question: "What is REMIT and why should traders care?",
    answer:
      "REMIT is EU regulation on energy market integrity — prohibits insider trading and market manipulation in wholesale energy. Physical and financial activity in EU-linked markets must comply; documentation of rationale for trades during volatile periods is essential.",
    tags: ["REMIT", "Compliance", "Regulation"],
    attribution: "editorial",
    author: "In-house Editorial Team",
    authorRole: BRAND_EDITORIAL,
    helpful: 11,
    date: "Feb 2025",
  },
  {
    id: "r5",
    category: "risk",
    categoryLabel: "Risk & Compliance",
    categoryColor: "#5B21B6",
    question: "How do sanctions affect a commodity trading book overnight?",
    answer:
      "Sanctions can freeze assets, block payments, and invalidate contracts. Desks maintain country/entity screening, clause libraries for force majeure, and pre-approved rerouting playbooks. Compliance sign-off is required before new counterparty onboarding.",
    tags: ["Sanctions", "Compliance", "Geopolitics"],
    attribution: "practitioner",
    author: "Compliance Officer",
    authorRole: "Commodity trading firm · Geneva",
    helpful: 23,
    date: "Jan 2025",
  },
  {
    id: "r6",
    category: "risk",
    categoryLabel: "Risk & Compliance",
    categoryColor: "#5B21B6",
    question: "What is position limit reporting and who must file?",
    answer:
      "Exchange position limits cap speculative size in futures. Large traders report to regulators (e.g. CFTC). Physical hedgers may qualify for exemptions but must document bona fide hedge intent.",
    tags: ["Position Limits", "CFTC", "Reporting"],
    attribution: "editorial",
    author: "In-house Editorial Team",
    authorRole: BRAND_EDITORIAL,
    helpful: 7,
    date: "Dec 2024",
  },
  {
    id: "r7",
    category: "risk",
    categoryLabel: "Risk & Compliance",
    categoryColor: "#5B21B6",
    question: "Letter of Credit vs open account — when is each used?",
    answer:
      "L/C gives seller payment certainty via bank — standard in new or high-risk relationships. Open account is faster and cheaper between trusted counterparties with established credit lines.",
    tags: ["L/C", "Trade Finance", "Payment"],
    attribution: "editorial",
    author: "In-house Editorial Team",
    authorRole: BRAND_EDITORIAL,
    helpful: 9,
    date: "Nov 2024",
  },
  {
    id: "r8",
    category: "risk",
    categoryLabel: "Risk & Compliance",
    categoryColor: "#5B21B6",
    question: "What is wrong-way risk in commodity credit?",
    answer:
      "Wrong-way risk occurs when counterparty default likelihood rises exactly when your exposure to them is largest — e.g. a producer who owes you cargoes when prices crash. Mitigate with collateral, shorter payment terms, or diversification.",
    tags: ["Credit Risk", "Wrong-Way Risk"],
    attribution: "practitioner",
    author: "Risk Manager",
    authorRole: "Metals desk · 12 years",
    helpful: 12,
    date: "Oct 2024",
  },
  // Tools (8)
  {
    id: "m1",
    category: "tools",
    categoryLabel: "Market Intelligence & Tools",
    categoryColor: "#0F766E",
    question: "What data do desks actually pay for vs scrape for free?",
    answer:
      "Paid: Platts/Argus assessments, Kpler/Vortexa flows, Bloomberg terminal, freight assessments, weather for ags. Free-ish: public customs data, AIS (limited), company filings, OPEC reports. The edge is in combining sources — not any single feed.",
    tags: ["Data", "Platts", "Kpler", "Bloomberg"],
    attribution: "practitioner",
    author: "Market Intelligence Analyst",
    authorRole: "7 years · Singapore",
    helpful: 24,
    date: "May 2025",
  },
  {
    id: "m2",
    category: "tools",
    categoryLabel: "Market Intelligence & Tools",
    categoryColor: "#0F766E",
    question: "How do you build a simple supply/demand balance sheet?",
    answer:
      "Start with production, subtract domestic consumption, add/subtract net trade, adjust for inventory change. Compare to price action — if stocks draw and price falls, your model is missing something (flows, quality, location).",
    tags: ["Balance Sheet", "Fundamentals", "Modelling"],
    attribution: "editorial",
    author: "In-house Editorial Team",
    authorRole: BRAND_EDITORIAL,
    helpful: 16,
    date: "Apr 2025",
  },
  {
    id: "m3",
    category: "tools",
    categoryLabel: "Market Intelligence & Tools",
    categoryColor: "#0F766E",
    question: "Bloomberg vs Refinitiv on a commodity desk — what matters?",
    answer:
      "Both cover prices, news, and analytics. Choice is often historical — desk workflows, ETRM integration, and broker chat habits drive stickiness. Juniors should master one deeply rather than skim both.",
    tags: ["Bloomberg", "Refinitiv", "Terminal"],
    attribution: "editorial",
    author: "In-house Editorial Team",
    authorRole: BRAND_EDITORIAL,
    helpful: 10,
    date: "Mar 2025",
  },
  {
    id: "m4",
    category: "tools",
    categoryLabel: "Market Intelligence & Tools",
    categoryColor: "#0F766E",
    question: "What is Kpler used for in physical trading?",
    answer:
      "Kpler tracks global commodity flows via AIS and port data — cargo movements, storage levels, export/import trends. Traders use it to validate official stats, spot floating storage, and identify arb windows before they appear in price.",
    tags: ["Kpler", "Flows", "Analytics"],
    attribution: "practitioner",
    author: "Crude Analyst",
    authorRole: "9 years · Geneva",
    helpful: 19,
    date: "Feb 2025",
  },
  {
    id: "m5",
    category: "tools",
    categoryLabel: "Market Intelligence & Tools",
    categoryColor: "#0F766E",
    question: "How do you read a forward curve?",
    answer:
      "Upward slope (contango) = storage incentive. Downward (backwardation) = tight prompt. Flat = balanced. Watch roll yield for passive strategies and calendar spread liquidity for active trading.",
    tags: ["Forward Curve", "Contango", "Structure"],
    attribution: "editorial",
    author: "In-house Editorial Team",
    authorRole: BRAND_EDITORIAL,
    helpful: 14,
    date: "Jan 2025",
  },
  {
    id: "m6",
    category: "tools",
    categoryLabel: "Market Intelligence & Tools",
    categoryColor: "#0F766E",
    question: "What Excel skills actually matter on the desk?",
    answer:
      "Index-match/XLOOKUP, pivot tables, scenario tables, basic VBA for repetitive reports, and clean data hygiene. Python is increasingly expected for flow analysis — but Excel remains the lingua franca for quick ad-hoc work.",
    tags: ["Excel", "Python", "Analytics"],
    attribution: "editorial",
    author: "In-house Editorial Team",
    authorRole: BRAND_EDITORIAL,
    helpful: 21,
    date: "Dec 2024",
  },
  {
    id: "m7",
    category: "tools",
    categoryLabel: "Market Intelligence & Tools",
    categoryColor: "#0F766E",
    question: "How do weekly inventory reports move markets?",
    answer:
      "EIA/API for US crude and products, GIE for European gas — surprises vs consensus drive immediate futures moves. Physical desks care about product breakdown (gasoline vs distillate) not just headline crude number.",
    tags: ["EIA", "Inventories", "Data Releases"],
    attribution: "editorial",
    author: "In-house Editorial Team",
    authorRole: BRAND_EDITORIAL,
    helpful: 13,
    date: "Nov 2024",
  },
  {
    id: "m8",
    category: "tools",
    categoryLabel: "Market Intelligence & Tools",
    categoryColor: "#0F766E",
    question: "What is a good morning market note structure?",
    answer:
      "Overnight moves → key data/events today → flow highlights → curve structure → 2–3 trade ideas or risks → calendar. Keep it scannable in 3 minutes. Traders ignore walls of text.",
    tags: ["Market Note", "Research", "Communication"],
    attribution: "practitioner",
    author: "Senior Analyst",
    authorRole: "Energy desk · 11 years",
    helpful: 18,
    date: "Oct 2024",
  },
  // Career (8)
  {
    id: "c1",
    category: "career",
    categoryLabel: "Career Positioning",
    categoryColor: "#0040f5",
    question: "How do you break into commodity trading with no finance background?",
    answer:
      "Target mid-office, operations, or analyst roles first — they hire broader profiles. Learn fundamentals (curves, freight, credit), network at industry events, and demonstrate genuine product curiosity. Lateral moves to front office take 2–4 years with strong performance.",
    tags: ["Career", "Breaking In", "Lateral Move"],
    attribution: "editorial",
    author: "In-house Editorial Team",
    authorRole: BRAND_EDITORIAL,
    helpful: 32,
    date: "May 2025",
  },
  {
    id: "c2",
    category: "career",
    categoryLabel: "Career Positioning",
    categoryColor: "#0040f5",
    question: "What do hiring managers look for in a junior analyst interview?",
    answer:
      "Commercial instinct, clarity under pressure, genuine interest in markets (not just money), and humility. Technical tests often involve interpreting a curve or explaining a recent market move — not trick puzzles.",
    tags: ["Interview", "Hiring", "Analyst"],
    attribution: "practitioner",
    author: "Desk Head",
    authorRole: "Physical trading · 20 years",
    helpful: 28,
    date: "Apr 2025",
  },
  {
    id: "c3",
    category: "career",
    categoryLabel: "Career Positioning",
    categoryColor: "#0040f5",
    question: "Trader vs analyst vs originator — which path fits you?",
    answer:
      "Analyst: research, market views, supporting the book. Trader: P&L ownership, risk appetite required. Originator: relationship-driven, deal structuring, client-facing. Many careers start analyst → trader; originators often come from commercial or shipping backgrounds.",
    tags: ["Career Path", "Roles", "Desk Structure"],
    attribution: "editorial",
    author: "In-house Editorial Team",
    authorRole: BRAND_EDITORIAL,
    helpful: 25,
    date: "Mar 2025",
  },
  {
    id: "c4",
    category: "career",
    categoryLabel: "Career Positioning",
    categoryColor: "#0040f5",
    question: "How important is Singapore vs Geneva vs Houston?",
    answer:
      "Singapore: Asia crude/products/LNG hub. Geneva: European energy and metals. Houston: US energy and Latin America flows. Choose based on product focus — moving later is possible but relationships are local.",
    tags: ["Locations", "Hubs", "Geography"],
    attribution: "practitioner",
    author: "HR Director",
    authorRole: "Global commodity firm",
    helpful: 19,
    date: "Feb 2025",
  },
  {
    id: "c5",
    category: "career",
    categoryLabel: "Career Positioning",
    categoryColor: "#0040f5",
    question: "Should you take a boutique or major trading house for your first role?",
    answer:
      "Majors: training, brand, process. Boutiques: faster responsibility, wider remit, higher risk if firm struggles. For first 2 years, learning environment matters more than logo — ask about rotation and mentorship.",
    tags: ["Employers", "Career Strategy"],
    attribution: "editorial",
    author: "In-house Editorial Team",
    authorRole: BRAND_EDITORIAL,
    helpful: 17,
    date: "Jan 2025",
  },
  {
    id: "c6",
    category: "career",
    categoryLabel: "Career Positioning",
    categoryColor: "#0040f5",
    question: "How do you negotiate comp on a trading desk?",
    answer:
      "Understand base vs bonus vs profit share. Bonus is often discretionary early career; profit share kicks in as P&L owner. Benchmark via industry networks — published ranges are rare. Negotiate role scope and review timing, not just headline number.",
    tags: ["Compensation", "Negotiation"],
    attribution: "practitioner",
    author: "Senior Trader",
    authorRole: "15 years · Singapore",
    helpful: 22,
    date: "Dec 2024",
  },
  {
    id: "c7",
    category: "career",
    categoryLabel: "Career Positioning",
    categoryColor: "#0040f5",
    question: "What certifications help in commodity trading?",
    answer:
      "Nice-to-have: CFA (credibility), FRM (risk roles), IFTA (technical). Not substitutes for desk experience. Commercial roles value shipping (ICS) or law backgrounds over generic finance certs.",
    tags: ["Certifications", "CFA", "Education"],
    attribution: "editorial",
    author: "In-house Editorial Team",
    authorRole: BRAND_EDITORIAL,
    helpful: 11,
    date: "Nov 2024",
  },
  {
    id: "c8",
    category: "career",
    categoryLabel: "Career Positioning",
    categoryColor: "#0040f5",
    question: "How do you build a network before you have a desk seat?",
    answer:
      "Attend IP Week, Asia Pacific Petroleum Conference, and local energy forums. Follow practitioners on LinkedIn with thoughtful comments — not cold pitches. Offer to share research; reciprocity builds relationships.",
    tags: ["Networking", "Events", "LinkedIn"],
    attribution: "practitioner",
    author: "Career Coach",
    authorRole: "Former desk head · now mentor",
    helpful: 20,
    date: "Oct 2024",
  },
];
