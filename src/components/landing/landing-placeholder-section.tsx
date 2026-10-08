import { SectionCategoryLabel } from "@/components/landing/section-category-label";
import { PAGE_SECTION_PY } from "@/lib/layout-constants";

export interface LandingPlaceholderSectionProps {
  /** Anchor id, e.g. "coming-soon". */
  id?: string;
  eyebrow?: string;
  title?: string;
  note?: string;
}

/**
 * A deliberately-unfinished placeholder that stands in for the pricing section
 * removed from the two landing pages (PRD B1/B2). It carries NO pricing logic and
 * no data dependencies, so it can be deleted and replaced by the next real
 * landing section without touching anything else.
 *
 * TODO(content): replace this placeholder section with the next real landing
 * section. The dashed border + "TODO · Placeholder" chip are intentional and
 * should disappear along with the component.
 */
export function LandingPlaceholderSection({
  id = "coming-soon",
  eyebrow = "Coming soon",
  title = "New content on the way",
  note = "This space is being rebuilt. Pricing now lives on its own page — see the plans and feature comparison there.",
}: LandingPlaceholderSectionProps) {
  return (
    <section id={id} className={`${PAGE_SECTION_PY} page-container scroll-mt-24`}>
      <div className="mx-auto max-w-2xl rounded-2xl border-2 border-dashed border-border bg-secondary/40 px-6 py-12 text-center">
        <span className="inline-block mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5">
          TODO · Placeholder
        </span>
        <SectionCategoryLabel>{eyebrow}</SectionCategoryLabel>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 mb-3">
          {title}
        </h2>
        <p className="text-sm sm:text-base text-muted-fg leading-relaxed">{note}</p>
      </div>
    </section>
  );
}
