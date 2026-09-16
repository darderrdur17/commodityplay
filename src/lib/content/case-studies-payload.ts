import { CASE_STUDIES, CASE_STUDY_DETAILS, type CaseStudyCard, type CaseStudySection } from "@/data/case-studies";
import { BRAND_NAME } from "@/lib/brand";
import { formatCmsHeroCopy, mergeCmsSimpleHero, type CmsSimpleHero } from "@/lib/content/cms-page-copy";

export const DEFAULT_CASE_STUDIES_DISCLAIMER =
  "Disclaimer: Case studies, worked examples, market scenarios, and figures throughout are illustrative and hypothetical unless explicitly stated otherwise. They are designed to demonstrate commercial reasoning and market mechanics — not to represent actual historical trades, real company transactions, or verified market data.";

export type CaseStudiesHeroCopy = CmsSimpleHero & {
  disclaimer: string;
};

export const DEFAULT_CASE_STUDIES_HERO: CaseStudiesHeroCopy = {
  eyebrow: "ELITE · {studyCount} STUDIES",
  title: "Case Studies",
  description:
    "Study with commercial reasoning and market mechanics — physical arbs, cross-market reads, freight, and supply disruptions — price dynamics, risk decisions, and lessons learned.",
  disclaimer: DEFAULT_CASE_STUDIES_DISCLAIMER,
};

/** Pull an inline “Disclaimer:” block out of a CMS description so it can render separately. */
export function splitCaseStudiesHeroDisclaimer(description?: string | null): {
  description: string;
  disclaimer?: string;
} {
  const raw = description ?? "";
  const match = raw.match(/\s+(Disclaimer:[\s\S]*)$/i);
  if (!match || match.index === undefined) {
    return { description: raw.trim() };
  }
  return {
    description: raw.slice(0, match.index).trim(),
    disclaimer: match[1].trim(),
  };
}

export interface CaseStudiesPayload {
  studies: CaseStudyCard[];
  details: Record<string, CaseStudySection[]>;
  hero?: Partial<CaseStudiesHeroCopy>;
}

export function mergeCaseStudiesHero(
  cms?: Partial<CaseStudiesHeroCopy> | null
): CaseStudiesHeroCopy {
  const raw = cms ?? {};
  const split = splitCaseStudiesHeroDisclaimer(raw.description);
  const description = split.description || DEFAULT_CASE_STUDIES_HERO.description;
  const disclaimer =
    raw.disclaimer?.trim() || split.disclaimer || DEFAULT_CASE_STUDIES_HERO.disclaimer;
  return {
    ...mergeCmsSimpleHero(DEFAULT_CASE_STUDIES_HERO, { ...raw, description }),
    disclaimer,
  };
}

export function formatCaseStudiesHeroCopy(template: string, studyCount: number): string {
  return formatCmsHeroCopy(template, { studyCount, brandName: BRAND_NAME });
}

export function resolveCaseStudiesPayload(payload: unknown): {
  studies: CaseStudyCard[];
  details: Record<string, CaseStudySection[]>;
  hero: CaseStudiesHeroCopy;
} {
  if (Array.isArray(payload)) {
    return {
      studies: payload.length ? (payload as CaseStudyCard[]) : CASE_STUDIES,
      details: CASE_STUDY_DETAILS,
      hero: mergeCaseStudiesHero(undefined),
    };
  }
  const data = (payload ?? {}) as Partial<CaseStudiesPayload>;
  return {
    studies: data.studies?.length ? data.studies : CASE_STUDIES,
    details: data.details && Object.keys(data.details).length > 0 ? data.details : CASE_STUDY_DETAILS,
    hero: mergeCaseStudiesHero(data.hero),
  };
}

export function buildDefaultCaseStudiesPayload(): CaseStudiesPayload {
  return {
    studies: CASE_STUDIES,
    details: CASE_STUDY_DETAILS,
    hero: DEFAULT_CASE_STUDIES_HERO,
  };
}
