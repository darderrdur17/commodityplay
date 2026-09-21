export type CaseStudyCategoryStyle = { bg: string; text: string };

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

export const CASE_STUDY_CATEGORY_HERO_STYLE: CaseStudyCategoryStyle = {
  bg: "#dbeafe",
  text: "#2563eb",
};

const CASE_STUDY_CATEGORY_PREVIEW_FALLBACK: CaseStudyCategoryStyle = {
  bg: "#eef2ff",
  text: "#3280ff",
};

export function caseStudyCategoryPreviewStyle(category: string): CaseStudyCategoryStyle {
  return CASE_STUDY_CATEGORY_PREVIEW_STYLES[category] ?? CASE_STUDY_CATEGORY_PREVIEW_FALLBACK;
}

export function caseStudyCategoryHeroStyle(_category?: string): CaseStudyCategoryStyle {
  return CASE_STUDY_CATEGORY_HERO_STYLE;
}
