import { formatContentPlaceholders } from "@/lib/content/content-stat-placeholders";

export interface DeskChannelHeroCopy {
  badge: string;
  headline: string;
  headlineAccent: string;
  /** Supports {deskQaCount}, {deskSegmentCount}, and {brandName}. */
  description: string;
  searchPlaceholder: string;
}

export interface DeskChannelSubmitCopy {
  eyebrow: string;
  headline: string;
  headlineAccent: string;
  description: string;
  bullets: string[];
  formTitle: string;
  formSubtitle: string;
  formButton: string;
  /** Internal route for the CTA — e.g. /mentor-connect */
  formHref: string;
}

export interface DeskChannelPageCopy {
  hero: DeskChannelHeroCopy;
  submit: DeskChannelSubmitCopy;
}

export const DEFAULT_DESK_CHANNEL_PAGE_COPY: DeskChannelPageCopy = {
  hero: {
    badge: "ELITE • THE DESK CHANNEL",
    headline: "Questions Answered by",
    headlineAccent: "People Who've Been There.",
    description:
      "{deskQaCount} questions across {deskSegmentCount} categories — answered by vetted practitioners and the {brandName} editorial team. Search the library. Can't find yours? Submit it below.",
    searchPlaceholder: "Search — e.g. 'crack spread', 'JKM', 'demurrage', 'career switch'",
  },
  submit: {
    eyebrow: "Submit a Question",
    headline: "Can't find what you're",
    headlineAccent: "looking for?",
    description:
      "Submit your question and a vetted practitioner or our editorial team will respond within 5 business days.",
    bullets: [
      "One question per submission — specific is better than broad",
      "Elite members · answered within 5 business days",
    ],
    formTitle: "Ask a Practitioner",
    formSubtitle: "Elite members · Answered within 5 business days",
    formButton: "Go to Mentor Connect",
    formHref: "/mentor-connect",
  },
};

export function mergeDeskChannelPageCopy(
  cms: Partial<DeskChannelPageCopy> | null | undefined,
  defaults: DeskChannelPageCopy = DEFAULT_DESK_CHANNEL_PAGE_COPY
): DeskChannelPageCopy {
  const raw = cms ?? {};
  const hero: Partial<DeskChannelHeroCopy> = raw.hero ?? {};
  const submit: Partial<DeskChannelSubmitCopy> = raw.submit ?? {};

  return {
    hero: {
      badge: hero.badge?.trim() || defaults.hero.badge,
      headline: hero.headline?.trim() || defaults.hero.headline,
      headlineAccent: hero.headlineAccent?.trim() || defaults.hero.headlineAccent,
      description: hero.description?.trim() || defaults.hero.description,
      searchPlaceholder: hero.searchPlaceholder?.trim() || defaults.hero.searchPlaceholder,
    },
    submit: {
      eyebrow: submit.eyebrow?.trim() || defaults.submit.eyebrow,
      headline: submit.headline?.trim() || defaults.submit.headline,
      headlineAccent: submit.headlineAccent?.trim() || defaults.submit.headlineAccent,
      description: submit.description?.trim() || defaults.submit.description,
      bullets:
        submit.bullets && submit.bullets.map((b) => b.trim()).filter(Boolean).length > 0
          ? submit.bullets.map((b) => b.trim()).filter(Boolean)
          : defaults.submit.bullets,
      formTitle: submit.formTitle?.trim() || defaults.submit.formTitle,
      formSubtitle: submit.formSubtitle?.trim() || defaults.submit.formSubtitle,
      formButton: submit.formButton?.trim() || defaults.submit.formButton,
      formHref: submit.formHref?.trim() || defaults.submit.formHref,
    },
  };
}

export function formatDeskChannelCopy(
  copy: DeskChannelPageCopy,
  stats: { deskQaCount: number; deskSegmentCount: number; brandName: string }
): DeskChannelPageCopy {
  const withBrand = {
    deskQaCount: stats.deskQaCount,
    deskSegmentCount: stats.deskSegmentCount,
    brandName: stats.brandName,
  };
  return {
    hero: {
      ...copy.hero,
      description: formatContentPlaceholders(copy.hero.description, withBrand).replace(
        /\{brandName\}/g,
        stats.brandName
      ),
    },
    submit: copy.submit,
  };
}
