import index from "./case-studies-index.json";
import details from "./case-studies-details.json";

export interface CaseStudyCard {
  slug: string;
  id: string;
  category: string;
  title: string;
  catchLine: string;
  description: string;
  readMinutes: number;
  status: "published" | "coming-soon";
  hasFullContent: boolean;
}

export interface CaseStudySection {
  id: string;
  label: string;
  title: string;
  paragraphs: string[];
}

function slugify(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export const CASE_STUDIES: CaseStudyCard[] = (index as Array<{
  id: string;
  category: string;
  title: string;
  catchLine: string;
  description: string;
  readMinutes: number;
  status: string;
}>)
  .filter((c) => c.status === "published")
  .map((c) => {
    const slug = slugify(c.title);
    return {
      slug,
      id: c.id,
      category: c.category.replace(/&amp;/g, "&"),
      title: c.title,
      catchLine: c.catchLine,
      description: c.description,
      readMinutes: c.readMinutes,
      status: "published" as const,
      hasFullContent: Boolean((details as Record<string, CaseStudySection[]>)[slug]?.length),
    };
  });

export const CASE_STUDY_DETAILS = details as Record<string, CaseStudySection[]>;

export function getCaseStudy(slug: string) {
  const card = CASE_STUDIES.find((c) => c.slug === slug);
  if (!card) return null;
  const sections = CASE_STUDY_DETAILS[slug] || null;
  return { card, sections };
}
