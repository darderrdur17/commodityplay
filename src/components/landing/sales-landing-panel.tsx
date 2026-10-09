"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle, Users, TrendingUp, Check, Download, Star,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal, StaggerChildren, StaggerItem } from "@/components/animations";
import { SectionCategoryLabel } from "@/components/landing/section-category-label";
import { MembersStrip } from "@/components/landing/members-strip";
import { MarketNoteStrip } from "@/components/landing/market-note-strip";
import { LandingPlaceholderSection } from "@/components/landing/landing-placeholder-section";
import { PricingCtaBand } from "@/components/landing/pricing-cta-band";
import { cn } from "@/lib/utils";
import {
  LANDING_HERO_TOP,
  LANDING_HERO_BOTTOM,
  HERO_EYEBROW_BASE,
  PAGE_SECTION_PY,
} from "@/lib/layout-constants";
import type { LandingContent, LandingTestimonials } from "@/data/landing-content";
import { SALES_MARKET_NOTE } from "@/data/market-notes";
import { toMarketNoteStripProps, type WeeklyEdgeNote } from "@/lib/content/edge-notes";
import { SALES_HERO_GREEN } from "@/lib/sales-brand-colors";

const SALES_COLOR = "#0F766E";

const PROBLEM_ICONS = [AlertCircle, Users, TrendingUp] as const;

type SalesLearnItem = LandingContent["sales"]["learn"]["items"][number];

function LearnAccordionItem({
  item,
  isOpen,
  onToggle,
}: {
  item: SalesLearnItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-white overflow-hidden hover:border-teal-200 transition-colors self-start w-full min-w-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-start gap-4 p-5 text-left hover:bg-secondary/40 transition-colors"
        aria-expanded={isOpen}
      >
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center font-serif font-bold text-sm flex-shrink-0"
          style={{ background: "#CCFBF1", color: SALES_COLOR }}
        >
          {item.num}
        </div>
        <span className="flex-1 min-w-0 pt-1.5">
          <span className="block font-semibold text-gray-900">{item.title}</span>
        </span>
        <ChevronDown
          aria-hidden
          className={cn(
            "w-4 h-4 text-muted-fg shrink-0 mt-2 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>
      {isOpen && (
        <div className="px-5 pb-5 pl-[4.25rem] border-t border-border/60">
          <p className="text-sm text-muted-fg leading-relaxed pt-3">{item.desc}</p>
        </div>
      )}
    </div>
  );
}

function LearnAccordion({ items }: { items: SalesLearnItem[] }) {
  /** All items start collapsed — user expands on tap/click. */
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="grid w-full min-w-0 grid-cols-1 md:grid-cols-2 gap-4 items-start">
      {items.map((item, i) => (
        <LearnAccordionItem
          key={`${item.num}-${item.title}`}
          item={item}
          isOpen={openIndex === i}
          onToggle={() => setOpenIndex((prev) => (prev === i ? null : i))}
        />
      ))}
    </div>
  );
}

interface Props {
  content: LandingContent["sales"];
  testimonials: LandingTestimonials;
  membersStrip: LandingContent["salesMembersStrip"];
  edgeNote: WeeklyEdgeNote;
  onOpenModal: () => void;
  onOpenContactModal: () => void;
  /** Live Starter Pack titles — one list with /starter-pack and the free-pack popup. */
  starterPackItems?: string[];
  /**
   * Shared "Plans & pricing" band copy. Top-level on LandingContent (one band for
   * both tracks), so it does not arrive with `content`, which is the sales slice.
   */
  pricingCtaBand: LandingContent["pricingCtaBand"];
}

export function SalesLandingPanel({
  content,
  testimonials,
  membersStrip,
  edgeNote,
  onOpenContactModal,
  starterPackItems,
  pricingCtaBand,
}: Props) {
  const learnRef = useRef<HTMLElement>(null);

  return (
    <div className="sales-panel">
      {/* Hero — eyebrow outside Reveal; overflow-x only so top padding is not clipped */}
      <section className={`relative overflow-x-hidden flex flex-col ${LANDING_HERO_TOP} ${LANDING_HERO_BOTTOM}`} style={{ background: "#065F46" }}>
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ background: SALES_COLOR }} />
        <div className="relative z-10 page-container w-full">
          <p className={cn(HERO_EYEBROW_BASE, "border border-teal-200/30 bg-teal-200/10 text-teal-100 not-prose")}>
            <span className="w-1.5 h-1.5 rounded-full bg-teal-200 animate-pulse shrink-0" aria-hidden />
            {content.eyebrow}
          </p>
          <Reveal>
            <h1 className="font-serif text-[clamp(32px,6vw,64px)] font-bold leading-[1.05] text-white mb-6 max-w-3xl">
              {content.headline}{" "}
              <span className="text-teal-100 italic">{content.headlineAccent}</span>
            </h1>
            <p className="text-teal-100/75 text-base sm:text-lg font-light leading-relaxed max-w-2xl mb-8">
              {content.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="xl"
                variant="outline-dark"
                className="border-teal-200/40 text-white hover:bg-teal-200/10 w-full sm:w-auto"
                onClick={() => learnRef.current?.scrollIntoView({ behavior: "smooth" })}
              >
                {content.ctaSecondary}
              </Button>
            </div>
          </Reveal>

          <div className="flex flex-wrap gap-6 sm:gap-10 mt-12 sm:mt-14 pt-8 sm:pt-10 border-t border-white/10">
            {content.stats.map((stat, i) => (
              <Reveal key={`${stat.label}-${i}`} delay={i * 0.1}>
                <div>
                  <p className="font-serif text-2xl sm:text-3xl font-bold text-white">
                    {stat.value}{stat.suffix}
                  </p>
                  <p className="text-teal-100/55 text-xs font-medium mt-1 max-w-[160px]">{stat.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <MembersStrip label={membersStrip.label} companies={membersStrip.companies} variant="dark" />

      {/* Pain points */}
      <section className="py-16 sm:py-24 page-container">
        <Reveal className="text-center mb-12 max-w-3xl mx-auto">
          <SectionCategoryLabel colorClass="text-teal-700">{content.problem.eyebrow}</SectionCategoryLabel>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            {content.problem.headline}
          </h2>
          <p className="text-muted-fg text-base sm:text-lg leading-relaxed">
            {content.problem.description}
          </p>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {content.problem.cards.map((p, i) => {
            const Icon = PROBLEM_ICONS[i % PROBLEM_ICONS.length];
            return (
            <Reveal key={`${p.title}-${i}`} delay={i * 0.1}>
              <div className="rounded-xl border border-border bg-white p-6 h-full hover:border-teal-200 hover:-translate-y-1 transition-all">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: "#CCFBF1", color: SALES_COLOR }}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-serif font-semibold text-gray-900 mb-2">{p.title}</h3>
                <p className="text-sm text-muted-fg leading-relaxed">{p.desc}</p>
              </div>
            </Reveal>
            );
          })}
        </div>
      </section>

      {/* What you'll learn */}
      <section ref={learnRef} id="sales-learn" className="py-16 sm:py-24 bg-secondary border-y border-border">
        <div className="page-container">
          <Reveal className="text-center mb-12 max-w-3xl mx-auto">
            <SectionCategoryLabel colorClass="text-teal-700">{content.learn.eyebrow}</SectionCategoryLabel>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              {content.learn.headline}
            </h2>
            <p className="text-muted-fg text-base sm:text-lg leading-relaxed">
              {content.learn.description}
            </p>
          </Reveal>
          <Reveal delay={0.1} className="w-full min-w-0">
            <LearnAccordion items={content.learn.items} />
          </Reveal>
        </div>
      </section>

      <MarketNoteStrip
        {...toMarketNoteStripProps(edgeNote, SALES_MARKET_NOTE.topics, {
          accentColor: SALES_HERO_GREEN,
          variant: "tags",
          demoOnClick: onOpenContactModal,
          secondaryCtaAccent: true,
        })}
        eyebrow={content.trackTools.eyebrow}
        title={content.trackTools.headline}
        description={content.trackTools.description}
        features={content.trackTools.features}
      />

      {/* Who this is for */}
      <section className="py-16 sm:py-24 page-container">
        <Reveal className="text-center mb-12 max-w-3xl mx-auto">
          <SectionCategoryLabel colorClass="text-teal-700">{content.whoSection.label}</SectionCategoryLabel>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900">
            {content.whoSection.headline}
          </h2>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {content.whoCards.map((card, i) => (
            <Reveal key={card.title} delay={i * 0.06}>
              <div className="rounded-xl border border-border bg-white p-6 h-full hover:border-teal-200 transition-all flex flex-col">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: SALES_COLOR }}>{card.role}</p>
                <h3 className="font-serif font-semibold text-gray-900 mb-2">{card.title}</h3>
                <p className="text-sm text-muted-fg mb-4 flex-1 leading-relaxed">{card.desc}</p>
                {card.outcome && (
                  <blockquote className="text-xs text-primary-400 italic border-l-2 border-primary-400 pl-3 leading-relaxed">
                    &ldquo;{card.outcome}&rdquo;
                  </blockquote>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Commercial Case — ROI */}
      <section className={`${PAGE_SECTION_PY} bg-primary-800 section-dark relative overflow-hidden`}>
        <div className="page-container">
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8 lg:gap-12 items-start">
            <div>
              <Reveal>
                <SectionCategoryLabel colorClass="text-white/50">{content.roi.eyebrow}</SectionCategoryLabel>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-4 mt-3">
                  {content.roi.title}{" "}
                  <span className="italic" style={{ color: "#dcfce7" }}>{content.roi.titleAccent}</span>
                </h2>
                <p className="text-white/65 text-base sm:text-lg leading-relaxed mb-6">
                  {content.roi.description}
                </p>
              </Reveal>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {content.roi.stats.map((stat, i) => (
                  <Reveal key={`${stat.label}-${i}`} delay={i * 0.08}>
                    <div className="rounded-xl p-4 sm:p-5" style={{ background: "#dcfce7" }}>
                      <p className="font-serif text-xl sm:text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
                      <p className="text-xs sm:text-sm text-gray-700 leading-snug">{stat.label}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
            <Reveal delay={0.2}>
              <blockquote className="rounded-xl border border-accent/40 bg-white/5 p-6 sm:p-8 h-full flex flex-col justify-center">
                <p className="font-serif text-lg sm:text-xl text-white italic leading-relaxed mb-4">
                  &ldquo;{content.roi.quote}&rdquo;
                </p>
                <footer>
                  <p className="text-sm font-semibold text-white/80">— {content.roi.quoteAuthor}</p>
                  {content.roi.quoteSubtitle && (
                    <p className="text-sm text-white/50 mt-1">{content.roi.quoteSubtitle}</p>
                  )}
                </footer>
              </blockquote>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Sales pricing section removed (PR1 / T02) — Sales pricing now lives on
          /pricing?track=sales. A clearly-marked placeholder stands in until the
          next real landing section lands. */}
      <LandingPlaceholderSection id="coming-soon" />

      {/* Centered "choose a plan" band, mounted where pricing used to sit. */}
      <PricingCtaBand
        eyebrow={pricingCtaBand.eyebrow}
        title={pricingCtaBand.title}
        description={pricingCtaBand.description}
        button={pricingCtaBand.button}
      />

      {/* Free Starter Pack signup */}
      <section className="py-16 sm:py-20 page-container">
        <Reveal>
          <div className="rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-8 lg:gap-10 p-8 sm:p-10 relative" style={{ background: "#065F46" }}>
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-15 blur-3xl" style={{ background: SALES_COLOR }} />
            <div className="relative z-10">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-3 leading-tight">
                {content.starterCard.title.split("\n").map((line, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <br />}
                    {line}
                  </React.Fragment>
                ))}
              </h2>
              <p className="text-teal-100/75 text-sm sm:text-base leading-relaxed mb-5 max-w-md">
                {content.starterCard.description}
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {(starterPackItems && starterPackItems.length > 0
                  ? starterPackItems
                  : content.starterCard.items
                ).map((item, i) => (
                  <p key={`${item}-${i}`} className="flex items-center gap-1.5 text-sm text-teal-100/85">
                    <Check className="w-3.5 h-3.5 text-teal-300 flex-shrink-0" /> {item}
                  </p>
                ))}
              </div>
            </div>
            <div className="relative z-10 flex flex-col justify-center">
              <Link href="/signup?plan=starter&track=sales&callbackUrl=/?track=sales">
                <Button
                  size="lg"
                  className="w-full bg-white text-teal-900 hover:bg-white/90 border-0"
                >
                  <Download className="w-4 h-4" />
                  Join Free - Upgrade Later
                </Button>
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Testimonials */}
      <section className="py-16 sm:py-24 page-container">
        <Reveal className="text-center mb-14">
          <div className="flex items-center justify-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
            ))}
          </div>
          <h2 className="font-serif text-[clamp(28px,4vw,44px)] font-bold tracking-tight text-gray-900">
            {testimonials.title}
          </h2>
        </Reveal>
        <StaggerChildren className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {testimonials.items.map((t) => (
            <StaggerItem key={t.id} className="h-full">
              <div className="card-hover rounded-xl border border-border bg-white p-6 h-full flex flex-col gap-4">
                <p className="text-gray-700 text-sm leading-relaxed flex-1 italic">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3 pt-2 border-t border-border">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ background: t.avatarColor ?? SALES_COLOR }}
                  >
                    {(t.avatarLetter ?? t.name[0])?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{t.name}</p>
                    <p className="text-xs text-muted-fg">{t.role}</p>
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </section>

      {/* Team licences */}
      <section className="py-10 sm:py-12 bg-[#ecfdf5] border-t border-teal-100">
        <div className="page-container max-w-3xl text-center">
          <Reveal>
            <SectionCategoryLabel colorClass="text-teal-700">{content.teamLicences.label}</SectionCategoryLabel>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-teal-900 mb-3">
              {content.teamLicences.heading}
            </h2>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              {content.teamLicences.body}
            </p>
            <Button
              variant="outline"
              className="border-teal-300 text-teal-800 hover:bg-teal-50 mt-4"
              onClick={onOpenContactModal}
            >
              Contact Us
            </Button>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
