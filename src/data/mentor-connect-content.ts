export interface MentorConnectHero {
  eyebrow: string;
  title: string;
  /** Use {mentorCount} and {segmentCount} for live stats in the hero paragraph. */
  subtitle: string;
}

export interface MentorConnectCategory {
  id: string;
  label: string;
  track: "career" | "sales" | "both";
}

export interface MentorConnectStep {
  /** Stable step id for admin keys and deploy merge — e.g. "01", "02", "03". */
  num: string;
  title: string;
  /** Supports {mentorCount} and {segmentCount} placeholders in step 01 copy. */
  body: string;
}

export interface MentorConnectCallout {
  title: string;
  body: string;
}

export interface MentorConnectHowItWorks {
  title: string;
  steps: MentorConnectStep[];
  callout: MentorConnectCallout;
}

export interface MentorConnectContent {
  hero: MentorConnectHero;
  categories: MentorConnectCategory[];
  howItWorks: MentorConnectHowItWorks;
}

export const DEFAULT_MENTOR_CONNECT_HOW_IT_WORKS: MentorConnectHowItWorks = {
  title: "How the Session Works",
  steps: [
    {
      num: "01",
      title: "Pick a Mentor",
      body: "Browse {segmentCount} segments and {mentorCount} anonymous practitioners. Read their background and pick the one closest to your question.",
    },
    {
      num: "02",
      title: "Ask One Question",
      body: "Each mentor will only answer one question per session. Make it count — be specific, give context, ask the question only they can answer. Each question is one credit. You can return back to the same mentor with another question, but another credit will be used. Follow up answers can be done at the discretion of each mentor.",
    },
    {
      num: "03",
      title: "Session Ends at 15",
      body: "Once you've used all 15 monthly credits, the session pauses until your credits reset. Your full transcript stays saved on this device for future reference.",
    },
  ],
  callout: {
    title: "Strictly anonymous.",
    body: "Mentor identities are never disclosed. Your questions are routed anonymously and answers appear in My Questions when ready.",
  },
};

export const DEFAULT_MENTOR_CONNECT_CONTENT: MentorConnectContent = {
  hero: {
    eyebrow: "Elite Access",
    title: "Mentor Connect",
    subtitle:
      "One question. One mentor. One honest answer. Choose from {mentorCount} anonymous practitioners across {segmentCount} coverage segments. Your session ends once you've finished using all 15 credits and the credits will get reset every month.",
  },
  categories: [],
  howItWorks: DEFAULT_MENTOR_CONNECT_HOW_IT_WORKS,
};

import { formatContentPlaceholders } from "@/lib/content/content-stat-placeholders";

export function formatMentorConnectSubtitle(
  template: string,
  mentorCount: number,
  segmentCount: number
): string {
  return formatContentPlaceholders(template, { mentorCount, segmentCount });
}
