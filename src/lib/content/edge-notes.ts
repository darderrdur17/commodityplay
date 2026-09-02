import { CAREER_MARKET_NOTE, SALES_MARKET_NOTE, type MarketNoteTopic } from "@/data/market-notes";

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
  /** Recent Topics card — editable in admin for sales strip */
  topics?: MarketNoteTopic[];
}

export type LandingEdgeNotes = {
  careerEdgeNote?: WeeklyEdgeNote | null;
  salesEdgeNote?: WeeklyEdgeNote | null;
};

/** @deprecated Use WeeklyEdgeNote */
export type SalesEdgeNote = WeeklyEdgeNote;

export function defaultCareerEdgeNote(): WeeklyEdgeNote {
  return {
    eyebrow: CAREER_MARKET_NOTE.eyebrow,
    title: CAREER_MARKET_NOTE.title,
    description: CAREER_MARKET_NOTE.description,
    frequencyNote: "Delivered every Tuesday",
    ctaLabel: "",
    ctaLink: "",
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
    topics: SALES_MARKET_NOTE.topics,
  };
}

function resolveTopics(
  cms: WeeklyEdgeNote | null | undefined,
  fallback: MarketNoteTopic[]
): MarketNoteTopic[] {
  if (cms?.topics?.length) {
    return cms.topics.map((topic) => ({
      tag: topic.tag ?? "",
      tagColor: topic.tagColor ?? "#2563eb",
      tagBg: topic.tagBg ?? "#dbeafe",
      title: topic.title,
    }));
  }
  return fallback;
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
    topics: resolveTopics(cms, defaults.topics ?? []),
  };
}

export function toMarketNoteStripProps(
  note: WeeklyEdgeNote,
  fallbackTopics: MarketNoteTopic[],
  options?: {
    accentColor?: string;
    variant?: "bullets" | "tags";
    demoUrlFallback?: string;
    secondaryCtaAccent?: boolean;
  }
) {
  const description = note.frequencyNote
    ? `${note.description}${note.description ? " " : ""}${note.frequencyNote}`.trim()
    : note.description;

  const topics = note.topics?.length ? note.topics : fallbackTopics;
  const demoUrl = note.demoButtonUrl?.trim() || options?.demoUrlFallback?.trim() || "";
  const demoLabel = note.demoButtonLabel?.trim() || "See demo";

  return {
    eyebrow: note.eyebrow,
    title: note.title,
    description,
    topics,
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
    ...(demoUrl
      ? {
          secondaryCta: {
            label: demoLabel,
            href: demoUrl,
            variant: "outline" as const,
            accent: options?.secondaryCtaAccent,
          },
        }
      : {}),
  };
}
