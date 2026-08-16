export interface KnowledgeQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  topic: string;
  recommendChapter?: string;
  recommendLabel?: string;
  track?: "career" | "sales" | "both";
}

export const KNOWLEDGE_TEST: KnowledgeQuestion[] = [
  {
    id: "k1",
    question: "What is the primary difference between physical and paper commodity trading?",
    options: [
      "Physical involves real cargoes and logistics; paper manages price risk with derivatives",
      "Physical is only for oil; paper is only for metals",
      "Physical trades settle instantly; paper takes 30 days",
      "There is no meaningful difference on modern desks",
    ],
    correctIndex: 0,
    explanation: "Physical trading moves real molecules with vessels, ports, and specs. Paper instruments hedge price exposure.",
    topic: "Foundations",
    recommendChapter: "a",
    recommendLabel: "Chapter A · Section A.1",
  },
  {
    id: "k2",
    question: "Which spread measures refinery margin between crude and refined products?",
    options: ["Spark spread", "Crack spread", "Basis spread", "Dark spread"],
    correctIndex: 1,
    explanation: "The crack spread compares product values to crude input cost — the core refinery margin signal.",
    topic: "Refining",
    recommendChapter: "a",
    recommendLabel: "Chapter A · Section A.4",
  },
  {
    id: "k3",
    question: "In a contango market, the futures price is:",
    options: ["Below spot", "Equal to spot", "Above spot", "Unrelated to spot"],
    correctIndex: 2,
    explanation: "Contango means forward prices exceed spot — often reflecting storage and carry costs.",
    topic: "Pricing",
    recommendChapter: "a",
    recommendLabel: "Chapter A · Section A.3",
  },
  {
    id: "k4",
    question: "JKM is primarily used as a benchmark for:",
    options: ["European pipeline gas", "Asian LNG spot", "US Henry Hub gas", "Rotterdam gasoil"],
    correctIndex: 1,
    explanation: "JKM (Japan Korea Marker) is the key Asian LNG spot benchmark, often compared to TTF for arb decisions.",
    topic: "LNG",
    recommendChapter: "a",
    recommendLabel: "Chapter A · Section A.2",
  },
  {
    id: "k5",
    question: "Demurrage charges apply when:",
    options: [
      "A vessel exceeds allowed laytime at port",
      "Crude quality fails assay",
      "A futures contract expires",
      "A letter of credit is rejected",
    ],
    correctIndex: 0,
    explanation: "Demurrage compensates the owner when loading/discharge exceeds contractual laytime.",
    topic: "Operations",
    recommendChapter: "c",
    recommendLabel: "Chapter C · Section C.3",
  },
  {
    id: "k6",
    question: "Basis risk in hedging means:",
    options: [
      "The hedge benchmark diverges from the physical exposure",
      "The counterparty defaults",
      "Freight rates spike unexpectedly",
      "The exchange halts trading",
    ],
    correctIndex: 0,
    explanation: "Even with a flat-price hedge, grade/location differentials can still move against you.",
    topic: "Hedging",
    recommendChapter: "b",
    recommendLabel: "Chapter B · Section B.4",
  },
  {
    id: "k7",
    question: "The Platts MOC window is significant because:",
    options: [
      "It sets daily physical benchmark assessments from market activity",
      "It is when OPEC announces cuts",
      "It is the only time futures can trade",
      "It determines vessel charter rates",
    ],
    correctIndex: 0,
    explanation: "PRAs assess benchmarks from bids, offers, and trades in the closing window — often the last 30 minutes.",
    topic: "Price Discovery",
    recommendChapter: "d",
    recommendLabel: "Chapter D · Section D.4",
  },
  {
    id: "k8",
    question: "An EFS (Exchange of Futures for Swaps) allows traders to:",
    options: [
      "Move between futures and swap exposure on the same commodity",
      "Exchange physical cargo for cash",
      "Cancel demurrage obligations",
      "Convert LNG to pipeline gas",
    ],
    correctIndex: 0,
    explanation: "EFS links exchange-traded futures with OTC swaps — a key bridge between paper instruments.",
    topic: "Paper Markets",
    recommendChapter: "b",
    recommendLabel: "Chapter B · Section B.5",
  },
  {
    id: "k9",
    question: "Backwardation typically signals:",
    options: [
      "Tight near-term supply or strong prompt demand",
      "Abundant storage and weak demand",
      "A strong US dollar only",
      "Refinery maintenance season only",
    ],
    correctIndex: 0,
    explanation: "When spot exceeds forward prices, the market often prices scarcity in the prompt period.",
    topic: "Pricing",
    recommendChapter: "a",
    recommendLabel: "Chapter A · Section A.3",
  },
  {
    id: "k10",
    question: "VaR on a trading desk primarily measures:",
    options: [
      "Expected maximum loss over a horizon at a confidence level",
      "Total revenue from physical cargoes",
      "Average demurrage per voyage",
      "Number of trades per day",
    ],
    correctIndex: 0,
    explanation: "VaR is a statistical risk metric — paired with limits and stress tests on real desks.",
    topic: "Risk",
    recommendChapter: "e",
    recommendLabel: "Chapter E · Section E.6",
  },
  {
    id: "k11",
    question: "AIS vessel tracking is used on desks primarily for:",
    options: [
      "Real-time flow and cargo routing intelligence",
      "Calculating ISDA margin",
      "Setting Platts assessments directly",
      "Determining corporate tax exposure",
    ],
    correctIndex: 0,
    explanation: "AIS shows vessel positions — a leading signal for flows, diversions, and supply timing.",
    topic: "Logistics",
    recommendChapter: "c",
    recommendLabel: "Chapter C · Section C.5",
  },
  {
    id: "k12",
    question: "A cargo with flexible destination optionality is valuable because:",
    options: [
      "It can capture better netbacks if market conditions change mid-voyage",
      "It eliminates all price risk automatically",
      "It avoids all freight costs",
      "It removes counterparty credit requirements",
    ],
    correctIndex: 0,
    explanation: "Optionality lets the desk reroute to the highest netback — a distinct P&L lever.",
    topic: "Commercial",
    recommendChapter: "e",
    recommendLabel: "Chapter E · Section E.3",
  },
  {
    id: "k13",
    question: "COT positioning data is most useful when:",
    options: [
      "Cross-checked with physical fundamentals and flows",
      "Used alone to predict every price move",
      "Ignored on physical desks",
      "Only relevant for agricultural markets",
    ],
    correctIndex: 0,
    explanation: "Managed money positioning can amplify moves but must be read alongside inventory and physical signals.",
    topic: "Market Intelligence",
    recommendChapter: "d",
    recommendLabel: "Chapter D · Section D.6",
  },
  {
    id: "k14",
    question: "FOB (Free On Board) means risk transfers to the buyer:",
    options: [
      "When cargo is loaded on the vessel at the named port",
      "When cargo arrives at destination",
      "When payment is made 30 days after delivery",
      "When the futures contract expires",
    ],
    correctIndex: 0,
    explanation: "FOB is a key Incoterm — risk and cost allocation at the load port drives ops and finance workflows.",
    topic: "Legal / Ops",
    recommendChapter: "b",
    recommendLabel: "Chapter B · Section B.1",
  },
  {
    id: "k15",
    question: "The JKM/TTF spread is most relevant for:",
    options: [
      "LNG cargo routing between Atlantic and Pacific basins",
      "Crude quality differentials in the US Gulf",
      "Iron ore freight from Brazil",
      "EU carbon allowance auctions",
    ],
    correctIndex: 0,
    explanation: "When JKM premium over TTF exceeds shipping and regas costs, Atlantic cargoes can flow east.",
    topic: "LNG Arbitrage",
    recommendChapter: "c",
    recommendLabel: "Chapter C · Section C.6",
  },
  {
    id: "k16",
    question: "Mark-to-market (MTM) on a desk refers to:",
    options: [
      "Daily revaluation of open positions at current prices",
      "Final settlement after cargo delivery only",
      "Annual bonus calculation",
      "Vessel classification surveys",
    ],
    correctIndex: 0,
    explanation: "MTM drives daily P&L visibility and margin calls on financial exposures.",
    topic: "Finance",
    recommendChapter: "b",
    recommendLabel: "Chapter B · Section B.8",
  },
  {
    id: "k17",
    question: "When bullish inventory data fails to lift price, a desk should ask:",
    options: [
      "Who is selling and what macro/financial signals dominate?",
      "Whether to ignore all physical data permanently",
      "Only whether OPEC will meet next week",
      "Whether to disable all hedges",
    ],
    correctIndex: 0,
    explanation: "Divergence between physical and price often signals financial flows (e.g. dollar, positioning) overwhelming fundamentals.",
    topic: "Cross-Market",
    recommendChapter: "d",
    recommendLabel: "Chapter D · Section D.1",
  },
  {
    id: "k18",
    question: "A scheduler's path to a commercial role typically requires:",
    options: [
      "Deep cargo flow knowledge and quantified commercial impact of ops decisions",
      "Only IT certification",
      "Avoiding all contact with traders",
      "Moving directly to head of desk within one year",
    ],
    correctIndex: 0,
    explanation: "Scheduling-to-commercial is a proven route — commercial instinct plus ops credibility opens doors.",
    topic: "Career",
    recommendLabel: "Career Roadmap · Scheduling / Operations",
  },
  {
    id: "k19",
    question: "P&L attribution on a desk should separate:",
    options: [
      "Flat price, time, location, quality, and freight components",
      "Only bonus vs salary",
      "Only realised vs unrealised for tax",
      "Only physical vs legal settlements",
    ],
    correctIndex: 0,
    explanation: "Attribution shows which levers drove performance — essential for risk review and book management.",
    topic: "Commercial",
    recommendChapter: "e",
    recommendLabel: "Chapter E · Section E.5",
  },
  {
    id: "k20",
    question: "The most common entry path to a trader role at major houses is:",
    options: [
      "Internal promotion from trading analyst or scheduling",
      "Direct graduate hire straight to book runner",
      "Vendor sales quota achievement only",
      "Regulatory filing experience only",
    ],
    correctIndex: 0,
    explanation: "Direct junior trader hiring is rare — commercial track record from analyst or ops routes is the norm.",
    topic: "Career",
    recommendLabel: "Career Roadmap · Trader",
  },
];

export function scoreKnowledgeTest(
  answers: Record<string, number>,
  questionBank: KnowledgeQuestion[] = KNOWLEDGE_TEST
) {
  const results = questionBank.map((q) => ({
    ...q,
    userAnswer: answers[q.id],
    correct: answers[q.id] === q.correctIndex,
  }));
  const score = results.filter((r) => r.correct).length;
  const weakTopics = Array.from(
    new Set(results.filter((r) => !r.correct).map((r) => r.topic))
  );
  const recommendations = Array.from(
    new Map(
      results
        .filter((r) => !r.correct && r.recommendChapter)
        .map((r) => [r.recommendChapter!, { chapter: r.recommendChapter!, label: r.recommendLabel! }])
    ).values()
  );
  return { score, total: questionBank.length, results, weakTopics, recommendations };
}
