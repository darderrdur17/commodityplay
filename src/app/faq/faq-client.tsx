"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { HelpCircle, ArrowRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal, GradientOrbs } from "@/components/animations";
import { PAGE_HERO_TOP } from "@/lib/layout-constants";
import type { FaqHero, FaqItem } from "@/data/faq";
import { CAREER_PRICING_HREF } from "@/lib/pricing-routes";

interface FaqClientProps {
  hero: FaqHero;
  items: FaqItem[];
}

export function FaqClient({ hero, items }: FaqClientProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="overflow-hidden">
      <section className={`bg-primary-800 section-dark ${PAGE_HERO_TOP} pb-14 sm:pb-20 relative overflow-hidden`}>
        <GradientOrbs />
        <div className="relative z-10 page-container text-center">
          <Reveal>
            <div className="pill pill-dark mb-5 mx-auto">
              <HelpCircle className="w-3 h-3" /> {hero.eyebrow}
            </div>
            <h1 className="font-serif text-[clamp(36px,6vw,60px)] font-bold text-white mb-4 tracking-tight">
              {hero.title}
            </h1>
            <p className="text-white/65 text-lg max-w-xl mx-auto">{hero.subtitle}</p>
          </Reveal>
        </div>
      </section>

      <section className="max-w-[700px] mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="space-y-3">
          {items.map((faq, i) => (
            <Reveal key={`${faq.q}-${i}`} delay={i * 0.05}>
              <div className="rounded-xl border border-border overflow-hidden">
                <button
                  type="button"
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-3"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                >
                  <span className="font-medium text-sm text-gray-900">{faq.q}</span>
                  <HelpCircle
                    className={`w-4 h-4 flex-shrink-0 transition-colors ${
                      openFaq === i ? "text-primary-400" : "text-muted-fg"
                    }`}
                  />
                </button>
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-5 pb-4"
                  >
                    <p className="text-sm text-muted-fg leading-relaxed">{faq.a}</p>
                  </motion.div>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-secondary py-12 sm:py-16">
        <div className="max-w-[600px] mx-auto px-4 sm:px-6 text-center">
          <Reveal>
            <Shield className="w-8 h-8 text-primary-400 mx-auto mb-4" />
            <h2 className="font-serif text-2xl font-bold text-gray-900 mb-3">Still have questions?</h2>
            <p className="text-muted-fg text-sm mb-6">
              Compare plans on the career landing page or reach out at hello@commodityplaybook.com.
            </p>
            <Link href={CAREER_PRICING_HREF}>
              <Button size="lg">
                View plans <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
