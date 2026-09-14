import {
  CAREER_MARKET_NOTE,
  LEGACY_SALES_TALKING_POINT_TITLES,
  SALES_MARKET_NOTE,
  type MarketNoteTopic,
} from "@/data/market-notes";

export interface WeeklyEdgeNote {
  eyebrow: string;
  title: string;
  description: string;
  frequencyNote: string;
  ctaLabel: string;
  ctaLink: string;
  /** Sales strip — "See demo" button label */
  demoButtonLabel?: string;
  /** Sales strip — demo URL (falls back to NEXT_PUBLIC_SALES_DEMO_URL on public site) */
  demoButtonUrl?: string;
  /** Right-hand card heading (sales: Recent Talking Points). */
  topicsHeading?: string;
  /** Recent Topics / talking points card — editable in admin for sales strip */
  topics?: MarketNoteTopic[];
}

export type LandingEdgeNotes = {
  careerEdgeNote?: WeeklyEdgeNote | null;
  salesEdgeNote?: WeeklyEdgeNote | null;
};

/** @deprecated Use WeeklyEdgeNote */
export type SalesEdgeNote = WeeklyEdgeNote;

function cloneTopic(topic: MarketNoteTopic): MarketNoteTopic {
  return {
    tag: topic.tag ?? "",
    tagColor: topic.tagColor ?? "#2563eb",
    tagBg: topic.tagBg ?? "#dbeafe",
    title: topic.title,
    extraLines: [...(topic.extraLines ?? [])],
  };
}

export function resolveSalesTalkingPoints(cms?: MarketNoteTopic[]): MarketNoteTopic[] {
  const fallback = SALES_MARKET_NOTE.topics.map(cloneTopic);
  if (!cms?.length) return fallback;
  const isUneditedSeed =
    cms.length === LEGACY_SALES_TALKING_POINT_TITLES.length &&
    cms.every(
      (topic, i) =>
        topic.title === LEGACY_SALES_TALKING_POINT_TITLES[i] &&
        !(topic.extraLines ?? []).some((line) => line.trim())
    );
  if (isUneditedSeed) return fallback;
  return cms.map(cloneTopic);
}

export function defaultCareerEdgeNote(): WeeklyEdgeNote {
  return {
    eyebrow: CAREER_MARKET_NOTE.eyebrow,
    title: CAREER_MARKET_NOTE.title,
    description: CAREER_MARKET_NOTE.description,
    frequencyNote: "Delivered every Tuesday",
    ctaLabel: "",
    ctaLink: "",
    topicsHeading: "Recent Topics",
    topics: CAREER_MARKET_NOTE.topics,
  };
}

export function defaultSalesEdgeNote(): WeeklyEdgeNote {
  return {
    eyebrow: SALES_MARKET_NOTE.eyebrow,
    title: SALES_MARKET_NOTE.title,
    description: SALES_MARKET_NOTE.description,
    frequencyNote: "",
    ctaLabel: "",
    ctaLink: "",
    demoButtonLabel: "See demo",
    demoButtonUrl: "",
    topicsHeading: SALES_MARKET_NOTE.topicsHeading,
    topics: SALES_MARKET_NOTE.topics.map(cloneTopic),
  };
}

function resolveTopics(
  cms: WeeklyEdgeNote | null | undefined,
  fallback: MarketNoteTopic[]
): MarketNoteTopic[] {
  if (cms?.topics?.length) {
    return cms.topics.map(cloneTopic);
  }
  return fallback.map(cloneTopic);
}

export function resolveWeeklyEdgeNote(
  cms: WeeklyEdgeNote | null | undefined,
  defaults: WeeklyEdgeNote
): WeeklyEdgeNote {
  return {
    eyebrow: cms?.eyebrow?.trim() || defaults.eyebrow,
    title: cms?.title?.trim() || defaults.title,
    description: cms?.description?.trim() || defaults.description,
    frequencyNote: cms?.frequencyNote?.trim() || defaults.frequencyNote,
    ctaLabel: cms?.ctaLabel?.trim() || defaults.ctaLabel,
    ctaLink: cms?.ctaLink?.trim() || defaults.ctaLink,
    demoButtonLabel: cms?.demoButtonLabel?.trim() || defaults.demoButtonLabel || "See demo",
    demoButtonUrl: cms?.demoButtonUrl?.trim() || defaults.demoButtonUrl || "",
    topicsHeading: cms?.topicsHeading?.trim() || defaults.topicsHeading || "Recent Topics",
    topics: resolveTopics(cms, defaults.topics ?? []),
  };
}

export function resolveSalesEdgeNote(cms: WeeklyEdgeNote | null | undefined): WeeklyEdgeNote {
  const defaults = defaultSalesEdgeNote();
  const resolved = resolveWeeklyEdgeNote(cms, defaults);
  return {
    ...resolved,
    topicsHeading: cms?.topicsHeading?.trim() || defaults.topicsHeading || "Recent Talking Points",
    topics: resolveSalesTalkingPoints(cms?.topics),
  };
}

export function toMarketNoteStripProps(
  note: WeeklyEdgeNote,
  fallbackTopics: MarketNoteTopic[],
  options?: {
    accentColor?: string;
    variant?: "bullets" | "tags";
    demoUrlFallback?: string;
    demoOnClick?: () => void;
    secondaryCtaAccent?: boolean;
  }
) {
  const description = note.frequencyNote
    ? `${note.description}${note.description ? " " : ""}${note.frequencyNote}`.trim()
    : note.description;

  const topics = note.topics?.length ? note.topics : fallbackTopics;
  const demoUrl = note.demoButtonUrl?.trim() || options?.demoUrlFallback?.trim() || "";
  const demoLabel = note.demoButtonLabel?.trim() || "See demo";
  const demoOnClick = options?.demoOnClick;

  return {
    eyebrow: note.eyebrow,
    title: note.title,
    description,
    topics,
    topicsHeading: note.topicsHeading || "Recent Topics",
    accentColor: options?.accentColor,
    variant: options?.variant ?? ("tags" as const),
    ...(note.ctaLink
      ? {
          cta: {
            label: note.ctaLabel || "Learn more",
            href: note.ctaLink,
          },
        }
      : {}),
    ...(demoOnClick || demoUrl
      ? {
          secondaryCta: {
            label: demoLabel,
            ...(demoOnClick ? { onClick: demoOnClick } : { href: demoUrl }),
            variant: "outline" as const,
            accent: options?.secondaryCtaAccent,
          },
        }
      : {}),
  };
}
