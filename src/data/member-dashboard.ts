import { ELITE_SUBSCRIPTION, PRO_SUBSCRIPTION, UPGRADE_TO_ACCESS } from "@/data/pricing-shared";
import type { SalesDashboardDeliverables } from "@/lib/content/sales-dashboard-deliverables";
import { DEFAULT_SALES_DASHBOARD_DELIVERABLES } from "@/lib/content/sales-dashboard-deliverables";

/** Marketing copy for a dashboard promo / upgrade banner. */
export interface DashboardPromoBox {
  badge: string;
  headline: string;
  description: string;
  cta: string;
  footerNote?: string;
}

/** Career / Sales / Both — same labels shown as bubbles on dashboard module cards. */
export type DashboardModuleTrack = "Career" | "Sales" | "Both";

/** How the unlocked card behaves — page route, file download, or inbox digest. */
export type DashboardCardKind = "page" | "file" | "email-digest";

/** Editable description under each resource card title on /dashboard. */
export interface DashboardResourceCardCopy {
  slug: string;
  title: string;
  description: string;
  /** Product track. Code-owned — CMS may edit title/description but not this. */
  track: DashboardModuleTrack;
  /** Code-owned delivery pattern. */
  cardKind?: DashboardCardKind;
}

/** Sales-track-only cards in the dashboard grid (Career members never see these). */
export interface DashboardSalesResourceCardCopy extends DashboardResourceCardCopy {
  requiredTier: "PRO" | "ELITE";
  /** Route when unlocked — e.g. /mentor-connect?segment=sales-advisory */
  href: string;
  /** When set, unlocked Pro+ members open the uploaded file instead of href. */
  deliverableKey?: "salesEdgeNote" | "industryGuideForSales";
  /** When true, this card is rendered separately as a PrepLibraryCard in the UI. */
  isPrepLibrary?: boolean;
}

export interface MemberDashboardContent {
  /** Light-blue Starter Pack banner — shown to Starter members only. */
  starterPack: DashboardPromoBox;
  /** Dark-blue upgrade banner — shown to Starter members (upsell to Pro). */
  upgradeToPro: DashboardPromoBox;
  /** Dark-blue upgrade banner — shown to Pro members (upsell to Elite). */
  upgradeToElite: DashboardPromoBox;
  /** Resource grid card descriptions (counts live in product — not repeated here). */
  resourceCards: DashboardResourceCardCopy[];
  /** Sales track only — extra greyed-out / unlocked cards on the member dashboard. */
  salesResourceCards: DashboardSalesResourceCardCopy[];
  /** PDF/file uploads for Sales Edge Note and Industry Guide for Sales. */
  salesDeliverables: SalesDashboardDeliverables;
}

export const DEFAULT_DASHBOARD_RESOURCE_CARDS: DashboardResourceCardCopy[] = [
  {
    slug: "playbook",
    title: "Full Playbook",
    description:
      "{chapterCount} chapters, {sectionCount} sections — industry foundations through commercial decision-making.",
    track: "Both",
  },
  {
    slug: "career-intelligence-brief",
    title: "Career Intelligence Brief",
    description: "Biweekly email digest on market note that builds you professionally",
    track: "Career",
    cardKind: "email-digest",
  },
  {
    slug: "resume-templates",
    title: "Resume Templates",
    description: "{templateCount} tailored templates with persona analysis quiz.",
    track: "Career",
  },
  {
    slug: "career-roadmap",
    title: "Career Roadmap",
    description:
      "{roleCount} role blueprints, navigation guide, comp benchmarks, and 12-month action plans.",
    track: "Career",
  },
  {
    slug: "career-navigation-guide",
    title: "Career Navigation Guide",
    description: "PDF deliverable. Highlights that intrigue and interest us.",
    track: "Career",
    cardKind: "file",
  },
  {
    slug: "interview-questions",
    title: "Interview Questions",
    description:
      "{interviewCount} desk interview questions with model answers across technical and commercial tabs.",
    track: "Career",
  },
  {
    slug: "knowledge-test",
    title: "Knowledge Test",
    description: "{knowledgeTestCount}-question gap analysis with personalised study recommendations.",
    track: "Both",
  },
  {
    slug: "case-studies",
    title: "Case Studies",
    description: "{caseStudyCount} real-world trading scenarios with full P&L breakdowns.",
    track: "Both",
  },
  {
    slug: "desk-channel",
    title: "Desk Channel",
    description: "{deskQaCount} practitioner Q&As across {deskSegmentCount} coverage segments.",
    track: "Both",
  },
  {
    slug: "mentor-connect",
    title: "Mentor Connect",
    description: "One question. One mentor. One honest answer — {mentorCount} anonymous practitioners.",
    track: "Both",
  },
  {
    slug: "job-openings",
    title: "Job Openings",
    description: "{jobCount} curated commodity trading roles across regions.",
    track: "Both",
  },
];

export const DEFAULT_SALES_DASHBOARD_RESOURCE_CARDS: DashboardSalesResourceCardCopy[] = [
  {
    slug: "sales-market-nudges",
    title: "Sales Market Nudges",
    description:
      "Weekly sales intelligence note — desk language, commercial angles, and what buyers are thinking this week.",
    requiredTier: "PRO",
    href: "/dashboard/sales-market-nudges",
    track: "Sales",
  },
  {
    slug: "industry-guide-for-sales",
    title: "Industry Guide for Sales",
    description: "A structured guide to commodity trading desks — products, roles, and how firms actually buy.",
    requiredTier: "PRO",
    href: "/library",
    deliverableKey: "industryGuideForSales",
    track: "Sales",
    cardKind: "file",
  },
  {
    slug: "sales-prep-library",
    title: "Sales Prep Library",
    description:
      "Market topics you can bring into client conversations — ready before your next meeting.",
    requiredTier: "PRO",
    href: "/dashboard/prep-library#prep-library-sales",
    isPrepLibrary: true,
    track: "Sales",
  },
  {
    slug: "account-intelligence",
    title: "Account Intelligence",
    description: "Company and contact intelligence to help you understand who you're selling to and what they care about.",
    requiredTier: "ELITE",
    href: "/dashboard/account-intelligence",
    track: "Sales",
  },
];

export const DEFAULT_MEMBER_DASHBOARD_CONTENT: MemberDashboardContent = {
  starterPack: {
    badge: "Starter Pack",
    headline: "5 Free Downloads",
    description:
      "Ecosystem map, crack spread guide, trade finance flow, LNG cargo flow, and price benchmarks — plus weekly market digest.",
    cta: "Download Free Pack",
    footerNote: "Rest of downloadable assets unlock with Pro Pack.",
  },
  upgradeToPro: {
    badge: "Upgrade to Pro",
    headline: "Unlock the full playbook, resume templates, career roadmap and more.",
    description: PRO_SUBSCRIPTION.fullNote,
    cta: UPGRADE_TO_ACCESS,
  },
  upgradeToElite: {
    badge: "Upgrade to Elite",
    headline: "Unlock case studies, Mentor Connect, Desk Channel and job openings.",
    description: ELITE_SUBSCRIPTION.fullNote,
    cta: UPGRADE_TO_ACCESS,
  },
  resourceCards: DEFAULT_DASHBOARD_RESOURCE_CARDS,
  salesResourceCards: DEFAULT_SALES_DASHBOARD_RESOURCE_CARDS,
  salesDeliverables: DEFAULT_SALES_DASHBOARD_DELIVERABLES,
};
