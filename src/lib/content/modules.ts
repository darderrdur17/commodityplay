import type { Tier } from "@prisma/client";

export type ContentSlug =
  | "landing"
  | "faq"
  | "glossary"
  | "playbook"
  | "resume-templates"
  | "career-roadmap"
  | "interview-questions"
  | "knowledge-test"
  | "case-studies"
  | "desk-channel"
  | "job-openings"
  | "starter-pack"
  | "mentor-connect"
  | "mentors"
  | "library"
  | "footer-guides"
  | "site-footer"
  | "member-dashboard"
  | "sales-market-nudges"
  | "account-intelligence";

export interface ContentModuleMeta {
  slug: ContentSlug;
  title: string;
  description: string;
  requiredTier: Tier;
}

export const CONTENT_MODULE_META: ContentModuleMeta[] = [
  {
    slug: "landing",
    title: "Landing Pages",
    description: "Career and sales landing page copy, stats, pricing, and feature cards",
    requiredTier: "STARTER",
  },
  {
    slug: "faq",
    title: "FAQ Page",
    description: "Frequently asked questions — hero copy and Q&A accordion",
    requiredTier: "STARTER",
  },
  {
    slug: "glossary",
    title: "Desk Glossary",
    description: "Searchable commodity trading terms",
    requiredTier: "STARTER",
  },
  {
    slug: "playbook",
    title: "Full Playbook",
    description: "Playbook chapters and sections (counts from live CMS)",
    requiredTier: "PRO",
  },
  {
    slug: "resume-templates",
    title: "Resume Templates",
    description: "Persona-specific resume templates and quiz",
    requiredTier: "PRO",
  },
  {
    slug: "career-roadmap",
    title: "Career Roadmap",
    description: "Role blueprints, 12-month plan, PDF navigation guide, and comp benchmarks",
    requiredTier: "PRO",
  },
  {
    slug: "interview-questions",
    title: "Interview Questions",
    description: "Desk interview Q&As with model answers",
    requiredTier: "PRO",
  },
  {
    slug: "knowledge-test",
    title: "Knowledge Test",
    description: "Gap analysis quiz (question count from live CMS)",
    requiredTier: "PRO",
  },
  {
    slug: "case-studies",
    title: "Case Studies",
    description: "Trading scenarios with P&L breakdowns",
    requiredTier: "ELITE",
  },
  {
    slug: "desk-channel",
    title: "Desk Channel",
    description: "Practitioner Q&As across coverage segments",
    requiredTier: "ELITE",
  },
  {
    slug: "job-openings",
    title: "Job Openings",
    description: "Curated commodity trading roles",
    requiredTier: "ELITE",
  },
  {
    slug: "starter-pack",
    title: "Preview Content",
    description: "Public /starter-pack page — hero, infographics, community email, and upgrade CTA",
    requiredTier: "STARTER",
  },
  {
    slug: "mentor-connect",
    title: "Mentor Connect",
    description: "Mentor Connect browse page and Mentor Application (/mentor-apply) copy",
    requiredTier: "ELITE",
  },
  {
    slug: "library",
    title: "Library Resources",
    description: "Member Resource Library at /library — unbounded free and Elite files",
    requiredTier: "ELITE",
  },
  {
    slug: "site-footer",
    title: "Site Footer",
    description: "Shared footer blurb, link columns, Terms of Use, and Privacy",
    requiredTier: "STARTER",
  },
  {
    slug: "footer-guides",
    title: "Footer Guides",
    description: "Free view-only Career Guide and Sales Guide PDFs linked from the site footer",
    requiredTier: "STARTER",
  },
  {
    slug: "member-dashboard",
    title: "Member Dashboard",
    description:
      "Member dashboard banners and resource cards (title, description, Career/Sales/Both track) for all members",
    requiredTier: "STARTER",
  },
  {
    slug: "sales-market-nudges",
    title: "Sales Market Nudges",
    description: "Weekly market nudges and intelligence briefs for Sales track members",
    requiredTier: "PRO",
  },
  {
    slug: "account-intelligence",
    title: "Account Intelligence",
    description: "Elite Sales track page copy — hero, accounts section, and continue CTAs",
    requiredTier: "ELITE",
  },
  {
    slug: "mentors",
    title: "Mentor Profiles (Admin Overrides)",
    description: "Internal-only mentor profile overrides — headline, years, tags, track, and admin reference name. Never shown publicly.",
    requiredTier: "STARTER",
  },
];

export function getModuleMeta(slug: string): ContentModuleMeta | undefined {
  return CONTENT_MODULE_META.find((m) => m.slug === slug);
}
