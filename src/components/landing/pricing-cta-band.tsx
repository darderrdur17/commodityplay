import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/animations";
import { SectionCategoryLabel } from "@/components/landing/section-category-label";
import { PRICING_CTA_BAND } from "@/data/pricing-shared";
import { PAGE_CTA_PY } from "@/lib/layout-constants";
import { cn } from "@/lib/utils";
import { LANDING_CTA } from "@/lib/landing-cta";

export interface PricingCtaBandProps {
  eyebrow?: string;
  title?: string;
  description?: string;
  button?: string;
  href?: string;
}

/**
 * Centered "choose a plan" band for the two landing pages (PRD E3/E4).
 *
 * Sits where the old in-page pricing section used to be, so the page keeps its
 * "you've read the pitch — now pick a plan" rhythm, and sends visitors to the
 * dedicated `/pricing` page. Copy defaults come from `PRICING_CTA_BAND`, the same
 * single source the rest of the pricing copy uses.
 *
 * Deliberately a light, full-width band (`bg-primary-soft`) so it reads as its own
 * moment and never as a duplicate of the career page's dark `bg-primary-800` final
 * CTA further down the page.
 */
export function PricingCtaBand({
  eyebrow = PRICING_CTA_BAND.eyebrow,
  title = PRICING_CTA_BAND.title,
  description = PRICING_CTA_BAND.description,
  button = PRICING_CTA_BAND.button,
  href = "/pricing",
}: PricingCtaBandProps) {
  return (
    <section className={`border-y border-border bg-primary-soft ${PAGE_CTA_PY}`}>
      <div className="page-container text-center">
        <Reveal className="mx-auto max-w-2xl">
          <SectionCategoryLabel>{eyebrow}</SectionCategoryLabel>
          {/* Type scale matches the site's standard section headline
              (`clamp(28px,4vw,44px)` — see "What's Inside", "Chapter Coverage",
              Case Studies and the testimonials). It used to run one step smaller
              at `clamp(26px,4vw,40px)`, which the owner flagged (11 Oct 2026):
              "Find the Plan that Fits your Desk." read lighter than every other
              heading around it. */}
          <h2 className="font-serif text-[clamp(28px,4vw,44px)] font-bold tracking-tight text-gray-900 mb-4 leading-[1.1]">
            {title}
          </h2>
          <p className="text-muted-fg text-base sm:text-lg leading-relaxed mb-8 max-w-xl mx-auto">
            {description}
          </p>
          <Link href={href} className="inline-block">
            <Button
              size="xl"
              variant="default"
              className={cn("shadow-lg shadow-primary-400/20", LANDING_CTA)}
            >
              {button}
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
