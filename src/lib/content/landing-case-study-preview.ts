import type { CaseStudyCard } from "@/data/case-studies";
import type { CaseStudyPreviewCard, LandingContent } from "@/data/landing-content";

export function landingCaseStudyPreviewFromCard(study: CaseStudyCard): CaseStudyPreviewCard {
  return {
    slug: study.slug,
    category: study.category,
    title: study.title,
    catchLine: study.catchLine,
    excerpt: study.description,
    readMinutes: study.readMinutes,
  };
}

export function landingFeaturedSlugs(sample: LandingContent["caseStudySample"]): string[] {
  const fromFeatured = (sample.featuredSlugs ?? []).map((slug) => slug.trim()).filter(Boolean);
  if (fromFeatured.length > 0) return fromFeatured;
  return sample.cards.map((card) => card.slug).filter(Boolean);
}

/** Public landing cards follow featured slugs, then live Case Studies CMS copy. */
export function hydrateLandingCaseStudyCards(
  sample: LandingContent["caseStudySample"],
  studies: CaseStudyCard[]
): CaseStudyPreviewCard[] {
  const bySlug = new Map(studies.map((study) => [study.slug, study]));
  const fallbackBySlug = new Map(sample.cards.map((card) => [card.slug, card]));
  const cards: CaseStudyPreviewCard[] = [];
  for (const slug of landingFeaturedSlugs(sample)) {
    const study = bySlug.get(slug);
    if (study) {
      cards.push(landingCaseStudyPreviewFromCard(study));
      continue;
    }
    const fallback = fallbackBySlug.get(slug);
    if (fallback) cards.push(fallback);
  }
  return cards.length > 0 ? cards : sample.cards;
}
