export interface JobOpening {
  id: string;
  title: string;
  company: string;
  companyType: "Major" | "Independent" | "Bank" | "Utility" | "Vendor";
  location: string;
  region: "Asia" | "Europe" | "Americas" | "Middle East" | "Global";
  segment: string;
  level: "Junior" | "Mid" | "Senior" | "Leadership";
  type: "Full-time" | "Contract" | "Internship";
  posted: string;
  description: string;
  requirements: string[];
  salary?: string;
  featured?: boolean;
  hirerEmail?: string;
  hirerName?: string;
}

export const JOB_OPENINGS: JobOpening[] = [
  {
    id: "j1",
    title: "Junior Commodity Analyst — Crude & Products",
    company: "Meridian Commodities",
    companyType: "Independent",
    location: "Singapore",
    region: "Asia",
    segment: "Energy",
    level: "Junior",
    type: "Full-time",
    posted: "2025-06-08",
    featured: true,
    description:
      "Support the Asia crude and products desk with daily market notes, flow analysis, and inventory tracking. Work directly with senior traders on trade idea generation.",
    requirements: [
      "0–2 years in commodities, finance, or energy",
      "Strong Excel; Python a plus",
      "Understanding of Brent/Dubai spreads and freight basics",
    ],
    salary: "SGD 70–95K + bonus",
    hirerEmail: "hiring@meridiancommodities.demo",
    hirerName: "Meridian Talent Team",
  },
  {
    id: "j2",
    title: "Physical LNG Trader",
    company: "Atlantic Energy Trading",
    companyType: "Major",
    location: "Geneva",
    region: "Europe",
    segment: "LNG",
    level: "Mid",
    type: "Full-time",
    posted: "2025-06-05",
    description:
      "Manage a book of physical LNG cargoes across Atlantic and Mediterranean markets. Originate swaps, optimize shipping, and develop counterparty relationships.",
    requirements: [
      "5+ years physical LNG or gas trading",
      "Proven P&L track record",
      "Strong chartering and operations coordination skills",
    ],
    salary: "Competitive + profit share",
    hirerEmail: "careers@atlanticenergy.demo",
    hirerName: "Atlantic Energy HR",
  },
  {
    id: "j3",
    title: "Metals Analyst — Base Metals",
    company: "Horizon Markets",
    companyType: "Bank",
    location: "London",
    region: "Europe",
    segment: "Metals",
    level: "Mid",
    type: "Full-time",
    posted: "2025-06-03",
    description:
      "Produce research on LME base metals with focus on copper and aluminium. Support sales desk with client presentations and trade recommendations.",
    requirements: [
      "3+ years metals research or trading support",
      "LME prompt date structure knowledge",
      "Client-facing communication skills",
    ],
    hirerEmail: "research@horizonmarkets.demo",
    hirerName: "Horizon Markets Recruiting",
  },
  {
    id: "j4",
    title: "Operations Scheduler — Clean Products",
    company: "Pacific Refining Group",
    companyType: "Major",
    location: "Houston",
    region: "Americas",
    segment: "Refined Products",
    level: "Mid",
    type: "Full-time",
    posted: "2025-06-01",
    description:
      "Coordinate vessel nominations, laytime, and demurrage for US Gulf clean products exports. Interface with traders, agents, and terminals daily.",
    requirements: [
      "4+ years scheduling or operations in oil/products",
      "Charter party literacy (ASBATANKVOY)",
      "Experience with ETRM systems",
    ],
    salary: "USD 110–140K",
    hirerEmail: "ops-careers@pacificrefining.demo",
    hirerName: "Pacific Refining Talent",
  },
  {
    id: "j5",
    title: "Graduate Programme — Commodity Trading",
    company: "Sterling Global Trading",
    companyType: "Independent",
    location: "Singapore / Geneva",
    region: "Global",
    segment: "Multi-commodity",
    level: "Junior",
    type: "Full-time",
    posted: "2025-05-28",
    featured: true,
    description:
      "Two-year rotational programme across analytics, operations, and junior trading support. Structured mentorship and CFA support provided.",
    requirements: [
      "Recent graduate in finance, engineering, or economics",
      "Strong academic record",
      "Genuine interest in physical commodity markets",
    ],
    hirerEmail: "graduates@sterlingglobal.demo",
    hirerName: "Sterling Global Programme",
  },
  {
    id: "j6",
    title: "Senior Originator — Power & Gas",
    company: "Nordic Utilities AG",
    companyType: "Utility",
    location: "Oslo",
    region: "Europe",
    segment: "Power & Gas",
    level: "Senior",
    type: "Full-time",
    posted: "2025-05-25",
    description:
      "Structure long-term power and gas supply agreements for industrial clients. Work with trading desk on hedge execution and risk management.",
    requirements: [
      "8+ years in energy origination or structuring",
      "Deep understanding of European power markets",
      "Strong legal/commercial contract skills",
    ],
    hirerEmail: "talent@nordicutilities.demo",
    hirerName: "Nordic Utilities Talent",
  },
  {
    id: "j7",
    title: "Market Intelligence Sales — Commodity Data",
    company: "FlowScope Analytics",
    companyType: "Vendor",
    location: "Singapore",
    region: "Asia",
    segment: "Data & Technology",
    level: "Mid",
    type: "Full-time",
    posted: "2025-05-22",
    description:
      "Sell cargo flow and analytics subscriptions to commodity trading firms across APAC. Must speak the desk's language — not generic SaaS pitching.",
    requirements: [
      "3+ years selling to commodity trading or shipping firms",
      "Understanding of Kpler/Platts-style data use cases",
      "Existing network in Singapore trading community",
    ],
    salary: "SGD 120–180K OTE",
    hirerEmail: "sales-hiring@flowscope.demo",
    hirerName: "FlowScope People",
  },
  {
    id: "j8",
    title: "Risk Manager — Commodity Derivatives",
    company: "Continental Investment Bank",
    companyType: "Bank",
    location: "New York",
    region: "Americas",
    segment: "Risk",
    level: "Senior",
    type: "Full-time",
    posted: "2025-05-18",
    description:
      "Oversee VaR, stress testing, and limit framework for commodity derivatives book. Partner with front office on new product approvals.",
    requirements: [
      "7+ years commodity risk experience",
      "FRM or equivalent",
      "Strong stakeholder management with traders",
    ],
    salary: "USD 180–250K",
    hirerEmail: "commodities-risk@cibank.demo",
    hirerName: "CIB Commodities HR",
  },
  {
    id: "j9",
    title: "Agriculture Trader — Grains",
    company: "Harvest Commodities",
    companyType: "Independent",
    location: "Geneva",
    region: "Europe",
    segment: "Agriculture",
    level: "Mid",
    type: "Full-time",
    posted: "2025-05-15",
    description:
      "Trade physical grains across Black Sea and EU origins. Manage basis risk, freight, and currency exposure on a regional book.",
    requirements: [
      "4+ years physical ags trading",
      "Black Sea logistics knowledge",
      "French or Russian language a plus",
    ],
    hirerEmail: "careers@harvestcommodities.demo",
    hirerName: "Harvest Commodities",
  },
  {
    id: "j10",
    title: "Commodity Trading Intern — Summer 2025",
    company: "Meridian Commodities",
    companyType: "Independent",
    location: "Singapore",
    region: "Asia",
    segment: "Energy",
    level: "Junior",
    type: "Internship",
    posted: "2025-05-10",
    description:
      "10-week summer internship supporting the crude desk with data analysis, meeting notes, and ad-hoc research projects.",
    requirements: [
      "Penultimate or final year student",
      "Available June–August 2025",
      "Excel proficiency required",
    ],
    hirerEmail: "hiring@meridiancommodities.demo",
    hirerName: "Meridian Talent Team",
  },
];

export const JOB_REGIONS = ["All", "Asia", "Europe", "Americas", "Middle East", "Global"] as const;
export const JOB_LEVELS = ["All", "Junior", "Mid", "Senior", "Leadership"] as const;
export const JOB_SEGMENTS = [
  "All",
  "Energy",
  "LNG",
  "Metals",
  "Refined Products",
  "Power & Gas",
  "Agriculture",
  "Risk",
  "Data & Technology",
  "Multi-commodity",
] as const;
