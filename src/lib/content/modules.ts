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
  | "member-dashboard";

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
    description: "5 chapters, 40 sections of playbook content",
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
    description: "10 role blueprints, 12-month plan, navigation guide, and comp benchmarks",
    requiredTier: "PRO",
  },
  {
    slug: "interview-questions",
    title: "Interview Questions",
    description: "50 desk interview Q&As with model answers",
    requiredTier: "PRO",
  },
  {
    slug: "knowledge-test",
    title: "Knowledge Test",
    description: "20-question gap analysis quiz",
    requiredTier: "PRO",
  },
  {
    slug: "case-studies",
    title: "Case Studies",
    description: "10 trading scenarios with P&L breakdowns",
    requiredTier: "ELITE",
  },
  {
    slug: "desk-channel",
    title: "Desk Channel",
    description: "40 practitioner Q&As across 5 segments",
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
    title: "Starter Pack",
    description: "Free infographics and starter downloads",
    requiredTier: "STARTER",
  },
  {
    slug: "mentor-connect",
    title: "Mentor Connect",
    description: "Subject categories for mentor Q&A",
    requiredTier: "ELITE",
  },
  {
    slug: "library",
    title: "Library Resources",
    description: "Elite bonus files and miscellaneous free resources in one library",
    requiredTier: "ELITE",
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
    description: "Blue marketing banners on the member dashboard — Starter Pack and upgrade prompts for all tiers",
    requiredTier: "STARTER",
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
