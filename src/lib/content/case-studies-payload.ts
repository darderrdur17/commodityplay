import { CASE_STUDIES, CASE_STUDY_DETAILS, type CaseStudyCard, type CaseStudySection } from "@/data/case-studies";
import { formatCmsHeroCopy, mergeCmsSimpleHero, type CmsSimpleHero } from "@/lib/content/cms-page-copy";

export type CaseStudiesHeroCopy = CmsSimpleHero;

export const DEFAULT_CASE_STUDIES_HERO: CaseStudiesHeroCopy = {
  eyebrow: "ELITE · {studyCount} STUDIES",
  title: "Case Studies",
  description:
    "Real-world trading scenarios with full P&L breakdowns — physical arbs, cross-market reads, freight, and supply disruptions.",
};

export interface CaseStudiesPayload {
  studies: CaseStudyCard[];
  details: Record<string, CaseStudySection[]>;
  hero?: Partial<CaseStudiesHeroCopy>;
}

export function mergeCaseStudiesHero(
  cms?: Partial<CaseStudiesHeroCopy> | null
): CaseStudiesHeroCopy {
  return mergeCmsSimpleHero(DEFAULT_CASE_STUDIES_HERO, cms);
}

export function formatCaseStudiesHeroCopy(template: string, studyCount: number): string {
  return formatCmsHeroCopy(template, { studyCount });
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
