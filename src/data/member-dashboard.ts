import { ELITE_SUBSCRIPTION, PRO_SUBSCRIPTION } from "@/data/pricing-shared";

/** Marketing copy for a dashboard promo / upgrade banner. */
export interface DashboardPromoBox {
  badge: string;
  headline: string;
  description: string;
  cta: string;
  footerNote?: string;
}

/** Editable description under each resource card title on /dashboard. */
export interface DashboardResourceCardCopy {
  slug: string;
  title: string;
  description: string;
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
}

export const DEFAULT_DASHBOARD_RESOURCE_CARDS: DashboardResourceCardCopy[] = [
  {
    slug: "playbook",
    title: "Full Playbook",
    description:
      "{chapterCount} chapters, {sectionCount} sections — industry foundations through commercial decision-making.",
  },
  {
    slug: "resume-templates",
    title: "Resume Templates",
    description: "{templateCount} tailored templates with persona analysis quiz.",
  },
  {
    slug: "career-roadmap",
    title: "Career Roadmap",
    description:
      "{roleCount} role blueprints, navigation guide, comp benchmarks, and 12-month action plans.",
  },
  {
    slug: "interview-questions",
    title: "Interview Questions",
    description:
      "{interviewCount} desk interview questions with model answers across technical and commercial tabs.",
  },
  {
    slug: "knowledge-test",
    title: "Knowledge Test",
    description: "{knowledgeTestCount}-question gap analysis with personalised study recommendations.",
  },
  {
    slug: "case-studies",
    title: "Case Studies",
    description: "{caseStudyCount} real-world trading scenarios with full P&L breakdowns.",
  },
  {
    slug: "desk-channel",
    title: "Desk Channel",
    description: "{deskQaCount} practitioner Q&As across {deskSegmentCount} coverage segments.",
  },
  {
    slug: "mentor-connect",
    title: "Mentor Connect",
    description: "One question. One mentor. One honest answer — {mentorCount} anonymous practitioners.",
  },
  {
    slug: "job-openings",
    title: "Job Openings",
    description: "{jobCount} curated commodity trading roles across regions.",
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
    cta: PRO_SUBSCRIPTION.cta,
  },
  upgradeToElite: {
    badge: "Upgrade to Elite",
    headline: "Unlock case studies, Mentor Connect, Desk Channel and job openings.",
    description: ELITE_SUBSCRIPTION.fullNote,
    cta: ELITE_SUBSCRIPTION.cta,
  },
  resourceCards: DEFAULT_DASHBOARD_RESOURCE_CARDS,
};
