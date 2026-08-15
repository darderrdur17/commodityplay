"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowRight, BookOpen, Users,
  Star, Zap, ChevronRight,
  MessageSquare, FileText, Map, Target,
  Check, X, Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Reveal, StaggerChildren, StaggerItem, AnimatedCounter,
  HeroParticles, GradientOrbs,
} from "@/components/animations";
import { StarterPackModal } from "@/components/landing/starter-pack-modal";
import { ContactModal } from "@/components/landing/contact-modal";
import { SalesLandingPanel } from "@/components/landing/sales-landing-panel";
import { SectionCategoryLabel } from "@/components/landing/section-category-label";
import { MembersStrip } from "@/components/landing/members-strip";
import { ChapterAccordion } from "@/components/landing/chapter-accordion";
import { CaseStudiesSection } from "@/components/landing/case-studies-section";
import { MarketNoteStrip } from "@/components/landing/market-note-strip";
import { PricingTierGrid } from "@/components/pricing/pricing-tier-grid";
import {
  LANDING_HERO_TOP,
  LANDING_HERO_BOTTOM,
  HERO_EYEBROW_BASE,
  PAGE_SECTION_PY,
} from "@/lib/layout-constants";
import {
  type LandingContent,
  type LandingFeature,
} from "@/data/landing-content";
import { CAREER_MARKET_NOTE } from "@/data/market-notes";

type Track = "career" | "sales";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  BookOpen, Target, Map, FileText, MessageSquare, Users,
};

interface Props {
  /** Server-merged landing content from getLandingContent() — never re-merge on the client. */
  content: LandingContent;
}

export function LandingPageClient({ content }: Props) {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const [activeTrack, setActiveTrack] = useState<Track>("career");
  const [modalOpen, setModalOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [showFeatureComparison, setShowFeatureComparison] = useState(false);

  useEffect(() => {
    const track = searchParams.get("track");
    if (track === "sales" || track === "career") {
      setActiveTrack(track);
    }
  }, [searchParams]);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const timer = window.setTimeout(() => {
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      if (hash === "pricing") setShowFeatureComparison(true);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [activeTrack]);

  // getLandingContent() already merges CMS edits with repo defaults on the server.
  const career = content.career;
  const tierColors: Record<string, string> = { Pro: "#3280ff", Elite: "#B45309" };
  const whatsInside = content.whatsInside;
  const chapterCoverage = content.chapterCoverage;
  const caseStudySample = content.caseStudySample;
  const pricing = content.pricing;
  const testimonials = content.testimonials;
  const sales = content.sales;

  return (
    <>
      {isAdmin && (
        <Link
          href={`/admin?tab=content&track=${activeTrack}`}
          className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-gray-900 text-white text-sm font-semibold px-4 py-2.5 shadow-xl hover:bg-gray-800 transition-colors"
        >
          <Pencil className="w-4 h-4" /> Edit this page
        </Link>
      )}

      {activeTrack === "sales" ? (
        <SalesLandingPanel
          content={sales}
          membersStrip={content.membersStrip}
          onOpenModal={() => setModalOpen(true)}
          onOpenContactModal={() => setContactOpen(true)}
        />
      ) : (
        <>
          {/* Career Hero — eyebrow stays outside Reveal; overflow-x only so top padding is not clipped */}
          <section className={`relative bg-navy section-dark overflow-x-hidden ${LANDING_HERO_TOP} ${LANDING_HERO_BOTTOM}`}>
            <GradientOrbs />
            <HeroParticles count={16} />
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
                backgroundSize: "60px 60px",
              }}
            />
            <div className="relative z-10 page-container">
              <div className="max-w-3xl">
                <p
                  className={cn(
                    HERO_EYEBROW_BASE,
                    "border border-accent/30 bg-accent/10 text-accent not-prose"
                  )}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" aria-hidden />
                  {career.eyebrow}
                </p>
                <Reveal>
                  <h1 className="font-serif text-[clamp(32px,6.5vw,68px)] font-bold leading-[1.04] tracking-tight text-white mb-6">
                    {career.headline}{" "}
                    <span className="text-accent italic">{career.headlineAccent}</span>
                  </h1>
                  <p className="text-white/65 text-base sm:text-lg font-light leading-relaxed max-w-2xl mb-8 sm:mb-10">
                    {career.description}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <Button
                      size="xl"
                      variant="primary-dark"
                      className="group shadow-xl shadow-black/20 w-full sm:w-auto"
                      onClick={() => setModalOpen(true)}
                    >
                      {career.ctaPrimary}
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                    <Link href="/starter-pack" className="w-full sm:w-auto">
                      <Button size="xl" variant="outline-dark" className="w-full sm:w-auto">
                        {career.ctaSecondary}
                      </Button>
                    </Link>
                  </div>
                </Reveal>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 mt-12 sm:mt-14 pt-10 border-t border-white/10 max-w-4xl">
                {career.heroStats.map((stat, i) => (
                  <Reveal key={stat.label} delay={0.2 + i * 0.08}>
                    <div className="text-left sm:text-center">
                      <p className="font-serif text-2xl sm:text-3xl font-bold text-white">
                        <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                      </p>
                      <p className="text-white/50 text-xs font-medium mt-1 max-w-[160px] sm:mx-auto">{stat.label}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          <MembersStrip label={content.membersStrip.label} companies={content.membersStrip.companies} variant="light" />

          {/* What's Inside */}
          <section className="py-16 sm:py-24 page-container">
            <Reveal className="text-center mb-14">
              <SectionCategoryLabel>What&apos;s Inside</SectionCategoryLabel>
              <h2 className="font-serif text-[clamp(28px,4vw,44px)] font-bold tracking-tight text-gray-900 mb-4 leading-[1.1] normal-case">
                {whatsInside.titleLine1}
                <br />
                <span className="text-primary-400 italic normal-case">{whatsInside.titleLine2}</span>
              </h2>
              <p className="text-muted-fg text-base sm:text-lg max-w-3xl mx-auto leading-relaxed">
                {whatsInside.description}
              </p>
            </Reveal>
            <StaggerChildren staggerDelay={0.08} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {whatsInside.features.map((f: LandingFeature) => {
                const Icon = ICON_MAP[f.icon] || BookOpen;
                const color = f.tier ? tierColors[f.tier] : "#3280ff";
                return (
                  <StaggerItem key={f.title}>
                    <div className="card-hover group h-full rounded-xl border border-border bg-white p-6 flex flex-col gap-4">
                      <div className="flex items-start justify-between">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}12` }}>
                          <Icon className="w-5 h-5" style={{ color }} />
                        </div>
                        {f.tier && (
                          <Badge variant={f.tier === "Elite" ? "elite" : "pro"} size="sm">{f.tier}</Badge>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-serif font-semibold text-gray-900 mb-2">{f.title}</h3>
                        <p className="text-sm text-muted-fg leading-relaxed">{f.desc}</p>
                      </div>
                    </div>
                  </StaggerItem>
                );
              })}
            </StaggerChildren>
          </section>

          {/* Chapter Coverage — accordion */}
          <section className="py-16 sm:py-24 bg-secondary border-y border-border">
            <div className="page-container">
              <Reveal className="text-center mb-10 sm:mb-14 max-w-3xl mx-auto">
                <SectionCategoryLabel>{chapterCoverage.eyebrow}</SectionCategoryLabel>
                <h2 className="font-serif text-[clamp(28px,4vw,44px)] font-bold tracking-tight text-gray-900 mb-4">
                  {chapterCoverage.title}
                </h2>
                <p className="text-muted-fg text-base sm:text-lg leading-relaxed">
                  {chapterCoverage.description}
                </p>
              </Reveal>
              <div className="w-full min-w-0">
                <ChapterAccordion chapters={chapterCoverage.chapters} />
              </div>
            </div>
          </section>

          <MarketNoteStrip {...CAREER_MARKET_NOTE} variant="tags" />

          <CaseStudiesSection content={caseStudySample} />

          {/* Pricing */}
          <section id="pricing" className={`bg-primary-800 section-dark ${PAGE_SECTION_PY} relative overflow-hidden scroll-mt-24`}>
            <GradientOrbs />
            <div className="relative z-10 page-container">
              <Reveal className="text-center mb-12 sm:mb-14">
                <SectionCategoryLabel colorClass="text-white/50">Choose Your Plan</SectionCategoryLabel>
                <h2 className="font-serif text-[clamp(28px,4vw,44px)] font-bold tracking-tight text-white mb-4">
                  {pricing.title}
                </h2>
                <p className="text-white/65 text-base sm:text-lg max-w-none leading-relaxed px-0">
                  {pricing.subtitle}
                </p>
              </Reveal>
              <PricingTierGrid
                tiers={pricing.tiers}
                variant="landing"
                onStarterModal={() => setModalOpen(true)}
              />
              <Reveal className="text-center mt-8">
                <button
                  type="button"
                  onClick={() => setShowFeatureComparison((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors"
                  aria-expanded={showFeatureComparison}
                >
                  View full feature comparison
                  <ChevronRight
                    className={cn(
                      "w-4 h-4 transition-transform duration-200",
                      showFeatureComparison && "rotate-90"
                    )}
                  />
                </button>
              </Reveal>

              {showFeatureComparison && (
                <Reveal className="mt-8 sm:mt-10">
                  <div className="text-center mb-6 sm:mb-8">
                    <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white">Feature Comparison</h3>
                    <p className="text-xs text-white/50 mt-2 sm:hidden">Swipe to compare plans →</p>
                  </div>
                  <div className="rounded-2xl border border-white/15 bg-white overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                    <div className="min-w-[560px]">
                      <div className="grid grid-cols-4 gap-0 bg-secondary">
                        <div className="p-4 col-span-1" />
                        {pricing.tiers.map((tier) => (
                          <div key={tier.name} className="p-4 text-center border-l border-border">
                            <p className="font-semibold text-sm text-gray-900">{tier.name}</p>
                            <p className="text-xs text-muted-fg">{tier.price === "Free" ? "Free" : `${tier.price} · ${tier.billing}`}</p>
                          </div>
                        ))}
                      </div>
                      {pricing.comparison.groups.map((group) => (
                        <React.Fragment key={group.category}>
                          <div className="px-4 py-2.5 border-t border-border" style={{ background: `${group.color}08` }}>
                            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: group.color }}>
                              {group.category}
                            </p>
                          </div>
                          {group.items.map((item) => (
                            <div
                              key={item.name}
                              className="grid grid-cols-4 border-t border-border hover:bg-secondary transition-colors"
                            >
                              <div className="p-3.5 col-span-1 text-sm text-gray-700">{item.name}</div>
                              {(["starter", "pro", "elite"] as const).map((tierKey) => (
                                <div key={tierKey} className="p-3.5 flex items-center justify-center border-l border-border">
                                  {item[tierKey] ? (
                                    <Check className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <X className="w-4 h-4 text-gray-300" />
                                  )}
                                </div>
                              ))}
                            </div>
                          ))}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </Reveal>
              )}
            </div>
          </section>

          {/* Testimonials */}
          <section className="py-16 sm:py-24 page-container">
            <Reveal className="text-center mb-14">
              {testimonials.eyebrow ? (
                <SectionCategoryLabel>{testimonials.eyebrow}</SectionCategoryLabel>
              ) : (
                <div className="flex items-center justify-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
              )}
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
                        style={{ background: t.avatarColor ?? "#3280ff" }}
                      >
                        {t.avatarLetter ?? t.name[0]}
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

          {/* CTA — flush against footer (no white gap) */}
          <section className={`bg-primary-800 section-dark ${LANDING_HERO_TOP} ${LANDING_HERO_BOTTOM} relative overflow-hidden`}>
            <GradientOrbs />
            <div className="relative z-10 page-container text-center">
              <Reveal>
                <h2 className="font-serif text-[clamp(28px,5vw,52px)] font-bold tracking-tight text-white mb-5">
                  {career.finalCtaTitle}
                  <br />
                  <span className="text-accent italic font-normal">{career.finalCtaAccent}</span>
                </h2>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mt-8">
                  <Button size="xl" variant="primary-dark" className="shadow-xl w-full sm:w-auto" onClick={() => setModalOpen(true)}>
                    {career.ctaPrimary} <ArrowRight className="w-5 h-5" />
                  </Button>
                  <Button
                    size="xl"
                    variant="outline-dark"
                    className="w-full sm:w-auto"
                    onClick={() => setContactOpen(true)}
                  >
                    Contact Us
                  </Button>
                </div>
              </Reveal>
            </div>
          </section>
        </>
      )}

      <StarterPackModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </>
  );
}
