"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { TierGate } from "@/components/tier-gate";
import { Reveal, StaggerChildren, StaggerItem } from "@/components/animations";
import { CaseStudyCategoryPill } from "@/components/case-studies/case-study-category-pill";
import type { CaseStudyCard } from "@/data/case-studies";
import {
  caseStudyDisplayNumber,
  DEFAULT_CASE_STUDIES_HERO,
  formatCaseStudiesHeroCopy,
  isCaseStudyComingSoon,
  isCaseStudyPublished,
  type CaseStudiesHeroCopy,
} from "@/lib/content/case-studies-payload";

interface Props {
  userTier: string;
  studies: CaseStudyCard[];
  hero?: CaseStudiesHeroCopy;
  requiredTier?: "PRO" | "ELITE";
}

export function CaseStudiesClient({
  userTier,
  studies,
  hero = DEFAULT_CASE_STUDIES_HERO,
  requiredTier = "ELITE",
}: Props) {
  const publishedCount = studies.filter(isCaseStudyPublished).length;
  const eyebrow = formatCaseStudiesHeroCopy(hero.eyebrow, publishedCount);
  const title = formatCaseStudiesHeroCopy(hero.title, publishedCount);
  const description = formatCaseStudiesHeroCopy(hero.description, publishedCount);
  const disclaimer = formatCaseStudiesHeroCopy(hero.disclaimer, publishedCount);

  return (
    <div className="page-container py-6 sm:py-10">
      <section className="rounded-2xl bg-primary-800 px-5 sm:px-8 py-8 sm:py-10 mb-6 sm:mb-8 relative overflow-hidden">
        <Reveal className="relative z-10">
          <div className="pill pill-dark mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" /> {eyebrow}
          </div>
          <h1 className="font-serif text-2xl sm:text-4xl font-bold text-white mb-3">{title}</h1>
          <p className="text-white/65 text-sm sm:text-lg max-w-xl">{description}</p>
          {disclaimer.trim() ? (
            <p className="mt-6 text-white/70 text-xs sm:text-sm max-w-xl leading-relaxed">{disclaimer}</p>
          ) : null}
        </Reveal>
      </section>

      <TierGate requiredTier={requiredTier} userTier={userTier}>
        <StaggerChildren className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {studies.map((study, index) => {
            const comingSoon = isCaseStudyComingSoon(study);
            const displayNumber = caseStudyDisplayNumber(study, index);

            if (comingSoon) {
              return (
                <StaggerItem key={study.slug || `${study.id}-${index}`}>
                  <div className="rounded-2xl border border-dashed border-border bg-secondary/30 p-5 sm:p-6 h-full opacity-90">
                    <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                      <CaseStudyCategoryPill category={study.category} track={study.track} />
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-fg bg-white px-2 py-0.5 rounded-full border border-border">
                        Coming soon
                      </span>
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-fg mb-2">
                      Case Study {displayNumber}
                    </p>
                    <h2 className="font-serif text-lg sm:text-xl font-bold text-gray-700 mb-2">{study.title}</h2>
                    {study.catchLine ? (
                      <p className="text-sm italic text-muted-fg mb-3 line-clamp-2">{study.catchLine}</p>
                    ) : null}
                    <div className="flex items-center gap-1.5 text-sm text-muted-fg mt-4">
                      <Clock className="w-4 h-4 shrink-0" />
                      {study.readMinutes} min · available soon
                    </div>
                  </div>
                </StaggerItem>
              );
            }

            return (
              <StaggerItem key={study.slug}>
                <Link
                  href={`/case-studies/${study.slug}`}
                  className="block rounded-2xl border border-border bg-white p-5 sm:p-6 hover:border-primary-line hover:shadow-md transition-all h-full"
                >
                  <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                    <CaseStudyCategoryPill category={study.category} track={study.track} />
                    {study.hasFullContent && (
                      <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                        Full breakdown
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-fg mb-2">
                    Case Study {displayNumber}
                  </p>
                  <h2 className="font-serif text-lg sm:text-xl font-bold text-gray-900 mb-2">{study.title}</h2>
                  <p className="text-sm italic text-muted-fg mb-3 line-clamp-2">{study.catchLine}</p>
                  <p className="text-sm text-gray-700 mb-4 line-clamp-3">{study.description}</p>
                  <div className="flex items-center justify-between text-sm gap-2">
                    <span className="flex items-center gap-1.5 text-muted-fg shrink-0">
                      <Clock className="w-4 h-4" /> {study.readMinutes} min
                    </span>
                    <span className="flex items-center gap-1 text-primary-400 font-medium">
                      Read <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              </StaggerItem>
            );
          })}
        </StaggerChildren>
      </TierGate>
    </div>
  );
}
