"use client";

import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CaseStudyPreviewCard } from "@/data/landing-content";

const CATEGORY_STYLES: Record<string, { bg: string; text: string }> = {
  "Physical arbitrage": { bg: "#dbeafe", text: "#2563eb" },
  "Physical Arbitrage": { bg: "#dbeafe", text: "#2563eb" },
  "Cross-market": { bg: "#ede9fe", text: "#7c3aed" },
  "Cross-Market": { bg: "#ede9fe", text: "#7c3aed" },
  "Freight & logistics": { bg: "#e0f2fe", text: "#0369a1" },
  "Freight & Logistics": { bg: "#e0f2fe", text: "#0369a1" },
  "Supply disruption": { bg: "#fce7f3", text: "#db2777" },
  "Supply Disruption": { bg: "#fce7f3", text: "#db2777" },
};

interface Props {
  cards: CaseStudyPreviewCard[];
  categoryTags: string[];
  disclaimer: string;
  viewMoreHref?: string;
}

export function CaseStudiesPreview({
  cards,
  categoryTags,
  disclaimer,
  viewMoreHref = "/case-studies",
}: Props) {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 lg:gap-6">
        {cards.map((card) => {
          const style = CATEGORY_STYLES[card.category] ?? { bg: "#eef2ff", text: "#3280ff" };
          return (
            <article
              key={card.slug}
              className="rounded-2xl border border-border bg-white p-6 flex flex-col h-full shadow-[0_2px_16px_rgba(8,48,160,0.05)] hover:shadow-[0_8px_28px_rgba(8,48,160,0.08)] transition-shadow"
            >
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span
                  className="inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide"
                  style={{ backgroundColor: style.bg, color: style.text }}
                >
                  {card.category}
                </span>
                <span className="text-[11px] font-semibold text-green-600">Full breakdown</span>
              </div>
              <h3 className="font-serif text-lg font-bold text-gray-900 mb-3 leading-snug">
                {card.title}
              </h3>
              <p className="text-sm text-muted-fg italic leading-relaxed mb-3">{card.catchLine}</p>
              <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 flex-1">{card.excerpt}</p>
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-fg">
                  <Clock className="w-3.5 h-3.5" />
                  {card.readMinutes} min
                </span>
                <Link
                  href={`/case-studies/${card.slug}`}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-primary-400 hover:text-primary-800 transition-colors"
                >
                  Read <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      <div className="flex flex-col items-center gap-6 mt-10 sm:mt-12">
        <Link href={viewMoreHref}>
          <Button variant="outline" size="lg" className="rounded-full px-8">
            View more <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
        <p className="text-xs text-muted-fg text-center tracking-wide">
          {categoryTags.join(" • ")}
        </p>
        <p className="text-[11px] text-muted-fg/80 text-center max-w-3xl leading-relaxed">
          {disclaimer}
        </p>
      </div>
    </div>
  );
}
