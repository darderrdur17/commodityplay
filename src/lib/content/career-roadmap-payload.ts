import { CAREER_ROLES } from "@/data/career-roadmap";
import {
  COMP_BENCHMARKS,
  FUNCTION_MATRIX,
  TIMELINE_12_MONTH,
  type CompBenchmarks,
  type FunctionMatrixRow,
  type TimelineQuarter,
} from "@/data/career-roadmap-extras";
import type { CmsPageHero, CmsSectionHeading } from "@/lib/content/cms-page-copy";
import {
  formatCmsHeroCopy,
  mergeCmsPageHero,
  mergeCmsSectionHeading,
  sanitizeMemberHref,
} from "@/lib/content/cms-page-copy";

export interface GuideAttachment {
  label: string;
  fileName: string;
  assetId: string;
  mimeType: string;
}

export type CareerRoadmapPageHero = CmsPageHero;
export type CareerRoadmapSectionCopy = CmsSectionHeading;

export const DEFAULT_CAREER_ROADMAP_HERO: CareerRoadmapPageHero = {
  eyebrow: "Pro Pack · Differentiated Roles",
  title: "Career Roadmap.",
  titleAccent: "Role by Role.",
  description:
    "{roleCount} entry blueprints for downstream commodity trading. The paths that actually work, the filters that actually eliminate candidates, and the upgrade move for each role — built from 20+ years inside the industry.",
  stats: [
    { num: "{roleCount}", label: "Role blueprints" },
    { num: "4", label: "Markets: SG · LN · ME · NA" },
    { num: "Live", label: "Job board — coming soon" },
    { num: "SGD", label: "Comp benchmarks" },
  ],
};

export const DEFAULT_FUNCTION_MATRIX_SECTION: CareerRoadmapSectionCopy = {
  eyebrow: "At a glance",
  title: "The Function Matrix",
  description:
    "Ten roles across five dimensions. Use this to identify your strongest entry angle before reading the full blueprints below.",
};

export const DEFAULT_TIMELINE_SECTION: CareerRoadmapSectionCopy = {
  eyebrow: "The plan",
  title: "12-Month Action Plan",
  description:
    "Specific knowledge targets and actions calibrated to where a serious candidate actually is, quarter by quarter.",
};

export interface CareerRoadmapCtaButton {
  label: string;
  href: string;
}

export interface CareerRoadmapBottomStrip {
  eyebrow: string;
  title: string;
  description: string;
  buttons: CareerRoadmapCtaButton[];
}

export const DEFAULT_CAREER_ROADMAP_BOTTOM_STRIP: CareerRoadmapBottomStrip = {
  eyebrow: "PRO ACCESS · NEXT STEPS",
  title: "Keep going from here.",
  description:
    "Rehearse the desk interview, then build the resume that matches the role path above.",
  buttons: [
    { label: "Go to Questions Bank", href: "/interview-questions" },
    { label: "Go to Resume Building", href: "/resume-templates" },
  ],
};

export function interpolateRoleCount(text: string, roleCount: number): string {
  return formatCmsHeroCopy(text, { roleCount });
}

export function mergeCareerRoadmapBottomStrip(
  cms?: Partial<CareerRoadmapBottomStrip> | null
): CareerRoadmapBottomStrip {
  const raw = cms ?? {};
  const defaults = DEFAULT_CAREER_ROADMAP_BOTTOM_STRIP;
  const buttons =
    Array.isArray(raw.buttons) && raw.buttons.length > 0
      ? raw.buttons.map((btn, i) => {
          const fallback = defaults.buttons[i] ?? defaults.buttons[0]!;
          return {
            label: btn.label?.trim() || fallback.label,
            href: sanitizeMemberHref(btn.href, fallback.href),
          };
        })
      : defaults.buttons;
  return {
    eyebrow: raw.eyebrow?.trim() || defaults.eyebrow,
    title: raw.title?.trim() || defaults.title,
    description: raw.description?.trim() || defaults.description,
    buttons,
  };
}

function mergeSectionCopy(
  cms: Partial<CareerRoadmapSectionCopy> | null | undefined,
  defaults: CareerRoadmapSectionCopy
): CareerRoadmapSectionCopy {
  return mergeCmsSectionHeading(defaults, cms);
}

export function mergeCareerRoadmapHero(
  cms: Partial<CareerRoadmapPageHero> | null | undefined,
  defaults: CareerRoadmapPageHero = DEFAULT_CAREER_ROADMAP_HERO
): CareerRoadmapPageHero {
  return mergeCmsPageHero(defaults, cms);
}

export function mergeCompBenchmarks(
  cms: Partial<CompBenchmarks> | null | undefined,
  defaults: CompBenchmarks = COMP_BENCHMARKS
): CompBenchmarks {
  const raw = cms ?? {};
  return {
    eyebrow: raw.eyebrow?.trim() || defaults.eyebrow,
    title: raw.title?.trim() || defaults.title,
    description: raw.description?.trim() || defaults.description,
    cards: raw.cards?.length ? raw.cards : defaults.cards,
    footnote: raw.footnote?.trim() || defaults.footnote,
  };
}

export function resolveCareerNavigationGuide(
  guide?: GuideAttachment | NavigationGuideLike | null
): GuideAttachment | null {
  if (!guide?.assetId || !guide.label) return null;
  return {
    label: guide.label,
    fileName: guide.fileName ?? "",
    assetId: guide.assetId,
    mimeType: guide.mimeType ?? "application/pdf",
  };
}

type NavigationGuideLike = {
  label?: string;
  fileName?: string;
  assetId?: string;
  mimeType?: string;
};

export interface CareerRoadmapResolvedPayload {
  roles: typeof CAREER_ROLES;
  functionMatrix: FunctionMatrixRow[];
  timeline12Month: TimelineQuarter[];
  compBenchmarks: CompBenchmarks;
  pageHero: CareerRoadmapPageHero;
  functionMatrixSection: CareerRoadmapSectionCopy;
  timelineSection: CareerRoadmapSectionCopy;
  bottomStrip: CareerRoadmapBottomStrip;
  careerNavigationGuide: GuideAttachment | null;
}

export function resolveCareerRoadmapPayload(payload: unknown): CareerRoadmapResolvedPayload {
  const raw =
    payload && typeof payload === "object" && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : Array.isArray(payload)
        ? { roles: payload }
        : {};

  return {
    roles: (raw.roles as typeof CAREER_ROLES | undefined)?.length
      ? (raw.roles as typeof CAREER_ROLES)
      : CAREER_ROLES,
    functionMatrix: (raw.functionMatrix as FunctionMatrixRow[] | undefined)?.length
      ? (raw.functionMatrix as FunctionMatrixRow[])
      : FUNCTION_MATRIX,
    timeline12Month: (raw.timeline12Month as TimelineQuarter[] | undefined)?.length
      ? (raw.timeline12Month as TimelineQuarter[])
      : TIMELINE_12_MONTH,
    compBenchmarks: mergeCompBenchmarks(raw.compBenchmarks as Partial<CompBenchmarks> | undefined),
    pageHero: mergeCareerRoadmapHero(raw.pageHero as Partial<CareerRoadmapPageHero> | undefined),
    functionMatrixSection: mergeSectionCopy(
      raw.functionMatrixSection as Partial<CareerRoadmapSectionCopy> | undefined,
      DEFAULT_FUNCTION_MATRIX_SECTION
    ),
    timelineSection: mergeSectionCopy(
      raw.timelineSection as Partial<CareerRoadmapSectionCopy> | undefined,
      DEFAULT_TIMELINE_SECTION
    ),
    bottomStrip: mergeCareerRoadmapBottomStrip(
      raw.bottomStrip as Partial<CareerRoadmapBottomStrip> | undefined
    ),
    careerNavigationGuide: resolveCareerNavigationGuide(
      raw.careerNavigationGuide as GuideAttachment | null | undefined
    ),
  };
}

export function buildDefaultCareerRoadmapPayload() {
  return {
    roles: CAREER_ROLES,
    functionMatrix: FUNCTION_MATRIX,
    timeline12Month: TIMELINE_12_MONTH,
    compBenchmarks: COMP_BENCHMARKS,
    pageHero: DEFAULT_CAREER_ROADMAP_HERO,
    functionMatrixSection: DEFAULT_FUNCTION_MATRIX_SECTION,
    timelineSection: DEFAULT_TIMELINE_SECTION,
    bottomStrip: DEFAULT_CAREER_ROADMAP_BOTTOM_STRIP,
    careerNavigationGuide: null as GuideAttachment | null,
  };
}
