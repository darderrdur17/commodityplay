/**
 * Demo accounts for local/staging testing.
 * Password for all accounts: Demo1234!
 * Run `npm run db:seed` after `npm run db:push` to create them.
 */

import { resolveMemberPersonaInfo } from "@/lib/persona-display";

export const DEMO_PASSWORD = "Demo1234!";

export type DemoAccount = {
  email: string;
  name: string;
  role: "USER" | "ADMIN";
  tier: "STARTER" | "PRO" | "ELITE";
  track: "CAREER" | "SALES";
  persona: "FRESH_GRAD" | "CAREER_SWITCHER" | "INSIDER" | "ANALYST_TRADER" | "VENDOR";
  /** When set, overrides default career-pro = done rule for demo card persona badges. */
  resumePersonaDone?: boolean;
  mentorCredits: number;
  resumeCredits: number;
  description: string;
  emoji: string;
  redirectTo: "/dashboard" | "/admin" | "/mentor-connect" | "/mentor-connect/inbox";
};

function demoResumePersonaDone(account: DemoAccount): boolean {
  if (account.resumePersonaDone !== undefined) return account.resumePersonaDone;
  return account.track === "CAREER" && account.tier !== "STARTER";
}

/** Persona badge on /demo cards — mirrors account/dashboard display rules. */
export function getDemoAccountDisplayPersona(account: DemoAccount) {
  return resolveMemberPersonaInfo(
    account.track,
    account.persona,
    demoResumePersonaDone(account)
  );
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: "admin@demo.com",
    name: "Admin User",
    role: "ADMIN",
    tier: "ELITE",
    track: "CAREER",
    persona: "INSIDER",
    mentorCredits: 10,
    resumeCredits: 10,
    description: "Full admin — edit & upload all tier content (JSON + files), manage customers, mentor Q&A, and waitlist.",
    emoji: "🛡️",
    redirectTo: "/admin",
  },
  {
    email: "starter.fresh@demo.com",
    name: "Maya Tan (Starter)",
    role: "USER",
    tier: "STARTER",
    track: "CAREER",
    persona: "FRESH_GRAD",
    resumePersonaDone: false,
    mentorCredits: 0,
    resumeCredits: 0,
    description:
      "Career Starter — Chapter A preview, glossary, digest. Persona unlocks after the resume quiz on Resume Templates.",
    emoji: "🎓",
    redirectTo: "/dashboard",
  },
  {
    email: "starter.vendor@demo.com",
    name: "Chris Lim (Starter)",
    role: "USER",
    tier: "STARTER",
    track: "SALES",
    persona: "VENDOR",
    mentorCredits: 0,
    resumeCredits: 0,
    description: "Sales track Starter — Chapter A preview (3 of 8 sections), sales dashboard, digest.",
    emoji: "🤝",
    redirectTo: "/dashboard",
  },
  {
    email: "pro.switcher@demo.com",
    name: "Sarah Wong (Pro)",
    role: "USER",
    tier: "PRO",
    track: "CAREER",
    persona: "CAREER_SWITCHER",
    mentorCredits: 0,
    resumeCredits: 3,
    description: "Pro member — full playbook, resume templates, career roadmap.",
    emoji: "🔄",
    redirectTo: "/dashboard",
  },
  {
    email: "pro.analyst@demo.com",
    name: "James Park (Pro)",
    role: "USER",
    tier: "PRO",
    track: "CAREER",
    persona: "ANALYST_TRADER",
    mentorCredits: 0,
    resumeCredits: 2,
    description: "Pro analyst — playbook progress, interview prep, knowledge test.",
    emoji: "📊",
    redirectTo: "/dashboard",
  },
  {
    email: "pro.vendor@demo.com",
    name: "Jamie Chen (Pro – Sales)",
    role: "USER",
    tier: "PRO",
    track: "SALES",
    persona: "VENDOR",
    mentorCredits: 0,
    resumeCredits: 2,
    description:
      "Pro sales track — Sales Prep Library, Sales Market Nudges, and industry guide. Account Intelligence is Elite-only.",
    emoji: "📈",
    redirectTo: "/dashboard",
  },
  {
    email: "elite.insider@demo.com",
    name: "Priya Sharma (Elite)",
    role: "USER",
    tier: "ELITE",
    track: "CAREER",
    persona: "INSIDER",
    mentorCredits: 3,
    resumeCredits: 5,
    description: "Elite insider — case studies, desk channel, mentor connect.",
    emoji: "⚡",
    redirectTo: "/dashboard",
  },
  {
    email: "elite.vendor@demo.com",
    name: "Marcus Lee (Elite)",
    role: "USER",
    tier: "ELITE",
    track: "SALES",
    persona: "VENDOR",
    mentorCredits: 2,
    resumeCredits: 3,
    description: "Elite sales track — full content plus job openings tracker.",
    emoji: "💼",
    redirectTo: "/dashboard",
  },
  {
    email: "elite.mentor@demo.com",
    name: "Raj Patel (Mentor)",
    role: "USER",
    tier: "ELITE",
    track: "CAREER",
    persona: "INSIDER",
    mentorCredits: 5,
    resumeCredits: 4,
    description: "Mentor practitioner inbox — review anonymous member requests, see persona/tier context, and respond to queries.",
    emoji: "🎯",
    redirectTo: "/mentor-connect/inbox",
  },
];

export function getDemoAccountByEmail(email: string) {
  return DEMO_ACCOUNTS.find((a) => a.email === email);
}

/** Guided Mentor Connect + email notification demo */
export const MENTOR_FLOW_DEMO = {
  member: {
    email: "elite.insider@demo.com",
    name: "Priya Sharma (Member)",
    emoji: "⚡",
    redirectTo: "/mentor-connect" as const,
    step: 1,
    title: "Elite member",
    description: "View submitted questions and see answers sync when a mentor responds.",
  },
  mentor: {
    email: "elite.mentor@demo.com",
    name: "Raj Patel (Mentor)",
    emoji: "🎯",
    redirectTo: "/mentor-connect/inbox" as const,
    step: 2,
    title: "Practitioner inbox",
    description: "Review anonymous member requests and submit answers (triggers member email + page sync).",
  },
  admin: {
    email: "admin@demo.com",
    name: "Admin User",
    emoji: "🛡️",
    redirectTo: "/admin" as const,
    step: 3,
    title: "Admin oversight",
    description: "View all Q&A, answer on behalf of mentors, or email a reminder for pending requests.",
  },
} as const;
