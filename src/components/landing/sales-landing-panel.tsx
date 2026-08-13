"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowRight, AlertCircle, Users, TrendingUp, Check, Download, Star,
  ChevronDown, ChevronRight, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal, StaggerChildren, StaggerItem } from "@/components/animations";
import { SectionCategoryLabel } from "@/components/landing/section-category-label";
import { MembersStrip } from "@/components/landing/members-strip";
import { MarketNoteStrip } from "@/components/landing/market-note-strip";
import { startCheckout } from "@/lib/start-checkout";
import { cn } from "@/lib/utils";
import {
  LANDING_HERO_TOP,
  LANDING_HERO_BOTTOM,
  HERO_EYEBROW_BASE,
  PAGE_SECTION_PY,
} from "@/lib/layout-constants";
import type { LandingContent } from "@/data/landing-content";
import { SALES_MARKET_NOTE } from "@/data/market-notes";

const SALES_COLOR = "#0F766E";

const SALES_TESTIMONIALS = [
  {
    quote: "After the Playbook, I stopped presenting to operations and started having commercial conversations with the desk. First call conversion improved immediately.",
    name: "Marcus L.",
    role: "Enterprise Software Sales, Singapore",
  },
  {
    quote: "Understanding how desks actually use AIS data changed how I demo. Win rate on enterprise accounts up 35%.",
    name: "Nadia R.",
    role: "Market Data Sales, China",
  },
  {
    quote: "The Playbook's risk chapter gave me the vocabulary to have real conversations with the CRO. Accelerated our deal cycle by 6 weeks.",
    name: "Chris B.",
    role: "Risk Technology Sales, London",
  },
];

const PAIN_POINTS = [
  {
    icon: AlertCircle,
    title: "You're Pitching to People Who Think in Barrels",
    desc: "Traders don't think in annual recurring revenue, user seats, or implementation timelines. They think in cargo positions, freight rates, and margin at risk. If your discovery call sounds like a software demo instead of a market conversation, you've already lost them.",
  },
  {
    icon: Users,
    title: "Your Champion Can't Sell You Internally",
    desc: "Even when your champion sees the value, they struggle to articulate it to a trading desk in commercial terms. They need to explain how your solution maps to their P&L, their risk exposure, or their operational workflow — and most vendors don't give them the language to do it.",
  },
  {
    icon: TrendingUp,
    title: "You Can't Differentiate on Product Alone",
    desc: "Your competitors have similar feature sets. The vendor who wins is the one who understands the buyer's commercial context deeply enough to position their solution as the answer to a specific, felt problem — not just another capability on a slide.",
  },
];

const LEARN_ITEMS = [
  {
    num: "01",
    title: "How the desk actually makes money",
    desc: "The six revenue levers — flat price, spread, freight, timing, quality, and optionality. Where each function in a trading firm contributes to P&L, and where they lose it. The vocabulary traders use to describe commercial performance.",
  },
  {
    num: "02",
    title: "How trading desks use data and intelligence",
    desc: "How desks consume Platts, Argus, Kpler, Vortexa, and the Baltic Exchange. What signals matter, how frequently they're checked, and what decisions they support. If you sell data or intelligence tools, this is your discovery framework.",
  },
  {
    num: "03",
    title: "How operations and scheduling work",
    desc: "The cargo lifecycle — nomination, NOR, laytime, demurrage, B/L, and vessel scheduling. What an ETRM system does and why it matters. The language of operations teams who control implementation and adoption of your product.",
  },
  {
    num: "04",
    title: "How risk and compliance think",
    desc: "VaR, position limits, basis risk, counterparty credit, sanctions — the constraints that shape every commercial decision. If your product touches risk or compliance functions, you need to understand these frameworks before your first meeting.",
  },
  {
    num: "05",
    title: "How to map your solution to their P&L",
    desc: "The 15 Asia case studies in the Pro tier are real market events with commercial impact analysis. Reading them teaches you how traders think about market signals and decisions — and how to connect your solution to that exact thinking.",
  },
  {
    num: "06",
    title: "The language that builds immediate credibility",
    desc: "The Desk Channel's 40 Q&As are real questions from real practitioners with real answers. Reading them tells you what trading professionals care about, how they frame problems, and which vocabulary signals that you understand their world.",
  },
];

function LearnAccordionItem({
  item,
  isOpen,
  onToggle,
}: {
  item: (typeof LEARN_ITEMS)[number];
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

function LearnAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="grid w-full min-w-0 grid-cols-1 md:grid-cols-2 gap-4 items-start">
      {LEARN_ITEMS.map((item, i) => (
        <LearnAccordionItem
          key={item.num}
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
  membersStrip: LandingContent["membersStrip"];
  onOpenModal: () => void;
  onOpenContactModal: () => void;
}

export function SalesLandingPanel({ content, membersStrip, onOpenContactModal }: Props) {
  const learnRef = useRef<HTMLElement>(null);
  const router = useRouter();
  const { data: session } = useSession();
  const [email, setEmail] = useState("");
  const [subscribeStatus, setSubscribeStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [showFeatureComparison, setShowFeatureComparison] = useState(false);
  const featureTable = content.comparison.groups;

  async function handleStarterPackSubscribe(e: React.FormEvent) {
    e.preventDefault();
    setSubscribeStatus("loading");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setSubscribeStatus("success");
      setEmail("");
    } catch {
      setSubscribeStatus("error");
    }
  }

  async function handlePurchase(plan: "pro" | "elite") {
    if (!session?.user) {
      router.push(`/signup?plan=${plan}&callbackUrl=/?track=sales`);
      return;
    }
    setLoadingPlan(plan);
    try {
      const url = await startCheckout(plan);
      if (url) window.location.href = url;
      else router.push("/pricing");
    } catch {
      router.push("/pricing");
    } finally {
      setLoadingPlan(null);
    }
  }

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
              <Reveal key={stat.label} delay={i * 0.1}>
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
          <SectionCategoryLabel colorClass="text-teal-700">The Problem</SectionCategoryLabel>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Your Buyers Know When You Don&apos;t Get It.
          </h2>
          <p className="text-muted-fg text-base sm:text-lg leading-relaxed">
            Commodity trading firms buy from people who understand their business. Most vendors don&apos;t.
          </p>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PAIN_POINTS.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.1}>
              <div className="rounded-xl border border-border bg-white p-6 h-full hover:border-teal-200 hover:-translate-y-1 transition-all">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: "#CCFBF1", color: SALES_COLOR }}>
                  <p.icon className="w-5 h-5" />
                </div>
                <h3 className="font-serif font-semibold text-gray-900 mb-2">{p.title}</h3>
                <p className="text-sm text-muted-fg leading-relaxed">{p.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* What you'll learn */}
      <section ref={learnRef} id="sales-learn" className="py-16 sm:py-24 bg-secondary border-y border-border">
        <div className="page-container">
          <Reveal className="text-center mb-12 max-w-3xl mx-auto">
            <SectionCategoryLabel colorClass="text-teal-700">What You&apos;ll Learn</SectionCategoryLabel>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              The Commercial Context Your Buyers Live In.
            </h2>
            <p className="text-muted-fg text-base sm:text-lg leading-relaxed">
              A working understanding of how commodity trading desks make money, manage risk, and evaluate vendors.
            </p>
          </Reveal>
          <Reveal delay={0.1} className="w-full min-w-0">
            <LearnAccordion />
          </Reveal>
        </div>
      </section>

      <MarketNoteStrip
        {...SALES_MARKET_NOTE}
        accentColor={SALES_COLOR}
        variant="tags"
      />

      {/* Who this is for */}
      <section className="py-16 sm:py-24 page-container">
        <Reveal className="text-center mb-12 max-w-3xl mx-auto">
          <SectionCategoryLabel colorClass="text-teal-700">Who This Is For</SectionCategoryLabel>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900">
            Six Sales Roles. One Shared Problem.
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
                  <blockquote className="text-xs text-gray-600 italic border-l-2 border-teal-300 pl-3 leading-relaxed">
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
                  <Reveal key={stat.label} delay={i * 0.08}>
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

      {/* Sales pricing — Pro & Elite only */}
      <section className="py-16 sm:py-24 page-container">
        <Reveal className="text-center mb-12">
          <SectionCategoryLabel colorClass="text-teal-700">Pricing</SectionCategoryLabel>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900">Built for Sales Professionals.</h2>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {content.pricing.map((tier, i) => (
            <Reveal key={tier.name} delay={i * 0.1}>
              <div
                className={`rounded-2xl h-full flex flex-col ${
                  tier.featured
                    ? "bg-teal-900 text-white border-2 border-teal-500 shadow-xl"
                    : "bg-white border border-border"
                }`}
              >
                <div className="p-6 sm:p-7 flex-1">
                  {tier.featured && (
                    <span className="inline-block text-[10px] font-bold uppercase tracking-widest bg-teal-600 text-white px-2 py-0.5 rounded mb-3">
                      Recommended
                    </span>
                  )}
                  <h3 className="font-serif text-xl font-bold mb-1">{tier.name}</h3>
                  <div className="mb-3">
                    <span className="font-serif text-3xl font-bold">{tier.price}</span>
                    <span className={`text-sm ml-2 ${tier.featured ? "text-teal-200/70" : "text-muted-fg"}`}>{tier.billing}</span>
                  </div>
                  <p className={`text-sm mb-5 leading-relaxed ${tier.featured ? "text-teal-100/75" : "text-muted-fg"}`}>{tier.description}</p>
                  <ul className="space-y-2.5">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${tier.featured ? "text-teal-300" : "text-teal-600"}`} />
                        <span className={tier.featured ? "text-white/90" : "text-gray-700"}>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-6 sm:p-7 pt-0">
                  <Button
                    className={`w-full ${tier.featured ? "bg-teal-600 hover:bg-teal-500 text-white border-0" : ""}`}
                    variant={tier.featured ? "default" : "outline"}
                    size="lg"
                    onClick={() => handlePurchase(tier.name.toLowerCase() as "pro" | "elite")}
                    loading={loadingPlan === tier.name.toLowerCase()}
                  >
                    {tier.cta}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="text-center mt-8">
          <button
            type="button"
            onClick={() => setShowFeatureComparison((prev) => !prev)}
            className="inline-flex items-center gap-1.5 text-sm text-teal-700 hover:text-teal-900 transition-colors"
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
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900">Feature Comparison</h3>
              <p className="text-xs text-muted-fg mt-2 sm:hidden">Swipe to compare plans →</p>
            </div>
            <div className="rounded-2xl border border-border overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <div className="min-w-[480px]">
                <div className="grid grid-cols-3 gap-0 bg-secondary">
                  <div className="p-4 col-span-1" />
                  {content.pricing.map((tier) => (
                    <div key={tier.name} className="p-4 text-center border-l border-border">
                      <p className="font-semibold text-sm text-gray-900">{tier.name}</p>
                      <p className="text-xs text-muted-fg">{tier.price} · {tier.billing}</p>
                    </div>
                  ))}
                </div>
                {featureTable.map((group) => (
                  <React.Fragment key={group.category}>
                    <div className="px-4 py-2.5 border-t border-border" style={{ background: `${group.color}08` }}>
                      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: group.color }}>
                        {group.category}
                      </p>
                    </div>
                    {group.items.map((item) => (
                      <div
                        key={item.name}
                        className="grid grid-cols-3 border-t border-border hover:bg-secondary transition-colors"
                      >
                        <div className="p-3.5 col-span-1 text-sm text-gray-700">{item.name}</div>
                        {(["pro", "elite"] as const).map((tier) => (
                          <div key={tier} className="p-3.5 flex items-center justify-center border-l border-border">
                            {item[tier] ? (
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
      </section>

      {/* Free Starter Pack signup */}
      <section className="py-16 sm:py-20 page-container">
        <Reveal>
          <div className="rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-8 lg:gap-10 p-8 sm:p-10 relative" style={{ background: "#065F46" }}>
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-15 blur-3xl" style={{ background: SALES_COLOR }} />
            <div className="relative z-10">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-3 leading-tight">
                Get 5 desk infographics.
                <br />
                Download instantly, free.
              </h2>
              <p className="text-teal-100/75 text-sm sm:text-base leading-relaxed mb-5 max-w-md">
                Five A4 reference sheets that show how commodity desks actually operate — before you walk into your next account meeting.
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {["Ecosystem Map", "LNG Cargo Flow", "Crack Spread Guide", "Price Benchmarks 101", "Trade Finance Flow"].map((item) => (
                  <p key={item} className="flex items-center gap-1.5 text-sm text-teal-100/85">
                    <Check className="w-3.5 h-3.5 text-teal-300 flex-shrink-0" /> {item}
                  </p>
                ))}
              </div>
            </div>
            <div className="relative z-10 flex flex-col justify-center gap-2.5">
              <form onSubmit={handleStarterPackSubscribe} className="flex flex-col gap-2.5">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  disabled={subscribeStatus === "loading"}
                  className="w-full h-12 px-4 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 text-sm outline-none focus:ring-2 focus:ring-teal-300 disabled:opacity-60"
                />
                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-white text-teal-900 hover:bg-white/90 border-0"
                  loading={subscribeStatus === "loading"}
                >
                  <Download className="w-4 h-4" />
                  Join Free - Upgrade Later
                </Button>
              </form>
              <p className="text-xs text-teal-100/60 text-center">
                {subscribeStatus === "success"
                  ? "You're on the list — check your inbox!"
                  : subscribeStatus === "error"
                    ? "Something went wrong. Please try again."
                    : "No spam. Unsubscribe anytime."}
              </p>
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
            Used by practitioners who mean it.
          </h2>
        </Reveal>
        <StaggerChildren className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {SALES_TESTIMONIALS.map((t) => (
            <StaggerItem key={t.name} className="h-full">
              <div className="card-hover rounded-xl border border-border bg-white p-6 h-full flex flex-col gap-4">
                <p className="text-gray-700 text-sm leading-relaxed flex-1 italic">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3 pt-2 border-t border-border">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: SALES_COLOR }}>
                    {t.name[0]}
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
            <SectionCategoryLabel colorClass="text-teal-700">Team Licences</SectionCategoryLabel>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-teal-900 mb-3">
              Start Speaking the Desk&apos;s Language.
            </h2>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              If you want to upskill your entire sales team on commodity trading before a major campaign or account push, contact us for team pricing. Available for 5+ seats with a custom onboarding session.
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
