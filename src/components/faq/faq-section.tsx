"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/animations";
import { ContactModal } from "@/components/landing/contact-modal";
import { SectionCategoryLabel } from "@/components/landing/section-category-label";
import { cn } from "@/lib/utils";
import { LANDING_CTA } from "@/lib/landing-cta";
import type { FaqFooterCta, FaqHero, FaqItem } from "@/data/faq";

export interface FaqSectionProps {
  hero: FaqHero;
  items: FaqItem[];
  footerCta: FaqFooterCta;
}

function FooterSubtext({ subtext, email }: { subtext: string; email: string }) {
  const parts = subtext.split(email);
  if (parts.length === 1) {
    return <span>{subtext}</span>;
  }
  return (
    <>
      {parts[0]}
      <a href={`mailto:${email}`} className="text-primary-400 hover:underline">
        {email}
      </a>
      {parts.slice(1).join(email)}
    </>
  );
}

/**
 * The FAQ accordion, rendered as a SECTION rather than a page.
 *
 * HISTORY: this was `/faq` — its own route with a full dark hero banner, its own
 * sitemap entry, and a footer link. At the owner's request (11 Oct 2026) the
 * whole thing moved to the bottom of `/pricing`, and the footer FAQ link now
 * deep-links to `#faq` here. `/faq` itself 308-redirects to `/pricing#faq` so
 * existing inbound links and the old Google index entry keep working.
 *
 * The copy is unchanged and still CMS-owned (module `faq`), so the admin editor
 * needed no new fields — only its hint text, which pointed at the old route.
 *
 * WHY THE DARK HERO DID NOT COME ALONG: `/pricing` is a light page with a white
 * plan grid directly above this section. Dropping a second full-bleed navy hero
 * between them would have read as a different page starting mid-scroll, so the
 * eyebrow/title/subtitle are rendered in the site's standard centred section
 * header instead. Every word of the hero is still on the page.
 */
export function FaqSection({ hero, items, footerCta }: FaqSectionProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <section
      id="faq"
      className="scroll-mt-24 border-t border-border bg-secondary py-16 sm:py-24"
    >
      <div className="page-container">
        <Reveal className="mx-auto mb-10 max-w-3xl text-center sm:mb-14">
          <SectionCategoryLabel>{hero.eyebrow}</SectionCategoryLabel>
          <h2 className="mb-4 font-serif text-[clamp(28px,4vw,44px)] font-bold leading-[1.1] tracking-tight text-gray-900">
            {hero.title}
          </h2>
          <p className="text-base leading-relaxed text-muted-fg sm:text-lg">{hero.subtitle}</p>
        </Reveal>

        <div className="mx-auto max-w-[700px] space-y-3">
          {items.map((faq, i) => (
            <Reveal key={`${faq.q}-${i}`} delay={i * 0.04}>
              <div className="overflow-hidden rounded-xl border border-border bg-white">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                >
                  <span className="text-sm font-medium text-gray-900">{faq.q}</span>
                  <HelpCircle
                    className={cn(
                      "h-4 w-4 flex-shrink-0 transition-colors",
                      openFaq === i ? "text-primary-400" : "text-muted-fg"
                    )}
                  />
                </button>
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-5 pb-4"
                  >
                    <p className="text-sm leading-relaxed text-muted-fg">{faq.a}</p>
                  </motion.div>
                )}
              </div>
            </Reveal>
          ))}
        </div>

        {/* "Still have questions?" — was the FAQ page's own closing band. Kept
            inline in the same section so the whole FAQ reads as one block at the
            foot of /pricing. */}
        <div className="mx-auto mt-14 max-w-[600px] text-center sm:mt-16">
          <Reveal>
            <HelpCircle className="mx-auto mb-4 h-8 w-8 text-primary-400" />
            <h3 className="mb-3 font-serif text-2xl font-bold text-gray-900">
              {footerCta.heading}
            </h3>
            <p className="mb-6 text-sm text-muted-fg">
              <FooterSubtext subtext={footerCta.subtext} email={footerCta.email} />
            </p>
            <Button size="lg" className={LANDING_CTA} onClick={() => setContactOpen(true)}>
              {footerCta.buttonLabel}
            </Button>
          </Reveal>
        </div>
      </div>

      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </section>
  );
}
