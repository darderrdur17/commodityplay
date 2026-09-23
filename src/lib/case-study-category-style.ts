import { SALES_ACCENT, SALES_LIGHT_MINT } from "@/lib/sales-brand-colors";

export type CaseStudyCategoryStyle = { bg: string; text: string };

export type CaseStudyTrackTone = "career" | "sales" | "both";

export const CASE_STUDY_CATEGORY_PREVIEW_STYLES: Record<string, CaseStudyCategoryStyle> = {
  "Physical arbitrage": { bg: "#dbeafe", text: "#2563eb" },
  "Physical Arbitrage": { bg: "#dbeafe", text: "#2563eb" },
  "Cross-market": { bg: "#ede9fe", text: "#7c3aed" },
  "Cross-Market": { bg: "#ede9fe", text: "#7c3aed" },
  "Freight & logistics": { bg: "#e0f2fe", text: "#0369a1" },
  "Freight & Logistics": { bg: "#e0f2fe", text: "#0369a1" },
  "Supply disruption": { bg: "#fce7f3", text: "#db2777" },
  "Supply Disruption": { bg: "#fce7f3", text: "#db2777" },
};

/** Career + Both — default light blue category pill on list/detail hero. */
export const CASE_STUDY_CATEGORY_CAREER_HERO_STYLE: CaseStudyCategoryStyle = {
  bg: "#dbeafe",
  text: "#2563eb",
};

/** Sales track — mint/teal pills (matches sales-case-study HTML `.meta-cat`). */
export const CASE_STUDY_CATEGORY_SALES_STYLE: CaseStudyCategoryStyle = {
  bg: SALES_LIGHT_MINT,
  text: SALES_ACCENT,
};

const CASE_STUDY_CATEGORY_PREVIEW_FALLBACK: CaseStudyCategoryStyle = {
  bg: "#eef2ff",
  text: "#3280ff",
};

/** @deprecated Use CASE_STUDY_CATEGORY_CAREER_HERO_STYLE */
export const CASE_STUDY_CATEGORY_HERO_STYLE = CASE_STUDY_CATEGORY_CAREER_HERO_STYLE;

export function normalizeCaseStudyTrack(track?: string | null): CaseStudyTrackTone {
  if (track === "sales") return "sales";
  if (track === "career") return "career";
  return "both";
}

export function caseStudyCategoryPreviewStyle(
  category: string,
  track?: CaseStudyTrackTone | string | null
): CaseStudyCategoryStyle {
  if (normalizeCaseStudyTrack(track) === "sales") {
    return CASE_STUDY_CATEGORY_SALES_STYLE;
  }
  return CASE_STUDY_CATEGORY_PREVIEW_STYLES[category] ?? CASE_STUDY_CATEGORY_PREVIEW_FALLBACK;
}

export function caseStudyCategoryHeroStyle(
  _category?: string,
  track?: CaseStudyTrackTone | string | null
): CaseStudyCategoryStyle {
  if (normalizeCaseStudyTrack(track) === "sales") {
    return CASE_STUDY_CATEGORY_SALES_STYLE;
  }
  return CASE_STUDY_CATEGORY_CAREER_HERO_STYLE;
}
