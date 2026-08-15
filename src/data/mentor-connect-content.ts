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

export interface MentorConnectContent {
  hero: MentorConnectHero;
  categories: MentorConnectCategory[];
}

export const DEFAULT_MENTOR_CONNECT_CONTENT: MentorConnectContent = {
  hero: {
    eyebrow: "Elite Access",
    title: "Mentor Connect",
    subtitle:
      "One question. One mentor. One honest answer. Choose from {mentorCount} anonymous practitioners across {segmentCount} coverage segments. Your session ends once you've finished using all 25 credits and the credits will get reset every month.",
  },
  categories: [],
};

export function formatMentorConnectSubtitle(
  template: string,
  mentorCount: number,
  segmentCount: number
): string {
  return template
    .replace(/\{mentorCount\}/g, String(mentorCount))
    .replace(/\{segmentCount\}/g, String(segmentCount));
}
