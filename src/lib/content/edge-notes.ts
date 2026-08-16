import { CAREER_MARKET_NOTE, SALES_MARKET_NOTE, type MarketNoteTopic } from "@/data/market-notes";

export interface WeeklyEdgeNote {
  eyebrow: string;
  title: string;
  description: string;
  frequencyNote: string;
  ctaLabel: string;
  ctaLink: string;
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
  };
}

export function defaultSalesEdgeNote(): WeeklyEdgeNote {
  return {
    eyebrow: SALES_MARKET_NOTE.eyebrow,
    title: SALES_MARKET_NOTE.title,
    description: SALES_MARKET_NOTE.description,
    frequencyNote: "Delivered every Tuesday",
    ctaLabel: "",
    ctaLink: "",
  };
}

export function resolveWeeklyEdgeNote(
  cms: WeeklyEdgeNote | null | undefined,
  defaults: { eyebrow: string; title: string; description: string }
): WeeklyEdgeNote {
  const base = cms ?? {};
  return {
    eyebrow: cms?.eyebrow?.trim() || defaults.eyebrow,
    title: cms?.title?.trim() || defaults.title,
    description: cms?.description?.trim() || defaults.description,
    frequencyNote: cms?.frequencyNote?.trim() || "",
    ctaLabel: cms?.ctaLabel?.trim() || "",
    ctaLink: cms?.ctaLink?.trim() || "",
  };
}

export function toMarketNoteStripProps(
  note: WeeklyEdgeNote,
  topics: MarketNoteTopic[],
  options?: { accentColor?: string; variant?: "bullets" | "tags" }
) {
  const description = note.frequencyNote
    ? `${note.description}${note.description ? " " : ""}${note.frequencyNote}`.trim()
    : note.description;

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
  };
}
