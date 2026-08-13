"use client";

import React, { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Check, X, ArrowRight, Zap, Shield, HelpCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Reveal, GradientOrbs } from "@/components/animations";
import { PricingTierGrid } from "@/components/pricing/pricing-tier-grid";
import { startCheckout } from "@/lib/start-checkout";
import { PAGE_HERO_TOP } from "@/lib/layout-constants";
import { PRICING_CTA, PRICING_HERO } from "@/data/pricing-shared";
import type { FeatureComparisonGroup, LandingTier } from "@/data/landing-content";

const FAQS = [
  {
    q: "Can I upgrade from Starter or Pro later?",
    a: "Yes — you can upgrade at any time. When upgrading to Pro or Elite, your subscription starts immediately. Cancel either plan anytime.",
  },
  {
    q: "Can I cancel Pro or Elite anytime?",
    a: "Yes. Pro and Elite are monthly subscriptions — cancel anytime from your account. Your access continues until the end of the current billing period.",
  },
  {
    q: "What happens to my Pro content if I cancel Elite?",
    a: "Your Pro access remains active while your Pro subscription is active. Elite-only features (case studies, Desk Channel, Mentor Connect, job openings) are removed when Elite is cancelled.",
  },
  {
    q: "What payment methods are accepted?",
    a: "We accept all major credit and debit cards via Stripe. Pro and Elite are billed monthly on the same date each month.",
  },
  {
    q: "Is there a student or team discount?",
    a: "Yes — reach out to hello@commodityplaybook.com for student pricing or team licences for 5+ seats.",
  },
  {
    q: "How does the Mentor Connect credit work?",
    a: "Elite members receive mentor credits each month (quantity TBD at launch). Each credit allows one question to one anonymous practitioner across 5 desk segments.",
  },
];

interface PricingPageClientProps {
  tiers: LandingTier[];
  comparisonGroups: FeatureComparisonGroup[];
}

function PricingPageContent({ tiers, comparisonGroups }: PricingPageClientProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const plan = searchParams.get("plan");
    if (plan !== "pro" && plan !== "elite") return;
    const el = document.getElementById(`plan-${plan}`);
    if (!el) return;
    const timer = window.setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
    return () => window.clearTimeout(timer);
  }, [searchParams]);

  async function handlePurchase(plan: "pro" | "elite") {
    if (!session) {
      router.push(`/signup?plan=${plan}&callbackUrl=/pricing`);
      return;
    }
    setLoadingPlan(plan);
    try {
      const url = await startCheckout(plan);
      if (url) window.location.href = url;
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <div className="overflow-hidden">
      <section className={`bg-primary-800 section-dark ${PAGE_HERO_TOP} pb-14 sm:pb-20 relative overflow-hidden`}>
        <GradientOrbs />
        <div className="relative z-10 page-container text-center">
          <Reveal>
            <div className="pill pill-dark mb-5 mx-auto">
              <Zap className="w-3 h-3" /> {PRICING_HERO.eyebrow}
            </div>
            <h1 className="font-serif text-[clamp(36px,6vw,60px)] font-bold text-white mb-4 tracking-tight">
              {PRICING_HERO.title}
            </h1>
            <p className="text-white/65 text-lg max-w-xl mx-auto">{PRICING_HERO.subtitle}</p>
          </Reveal>
        </div>
      </section>

      <section className="page-container -mt-8 mb-12 sm:mb-16 relative z-10">
        <PricingTierGrid
          tiers={tiers}
          variant="page"
          onPurchase={handlePurchase}
          loadingPlan={loadingPlan}
        />
      </section>

      <section className="page-container mb-12 sm:mb-20">
        <Reveal className="text-center mb-6 sm:mb-8">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900">Full feature comparison</h2>
          <p className="text-xs text-muted-fg mt-2 sm:hidden">Swipe to compare plans →</p>
        </Reveal>
        <div className="rounded-2xl border border-border overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <div className="min-w-[560px]">
            <div className="grid grid-cols-4 gap-0 bg-secondary">
              <div className="p-4 col-span-1" />
              {tiers.map((tier) => (
                <div key={tier.name} className="p-4 text-center border-l border-border">
                  <p className="font-semibold text-sm text-gray-900">{tier.name}</p>
                  <p className="text-xs text-muted-fg">{tier.price === "Free" ? "Free" : `${tier.price}/mo`}</p>
                </div>
              ))}
            </div>
            {comparisonGroups.map((group) => (
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
                    {(["starter", "pro", "elite"] as const).map((tier) => (
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
      </section>

      <section className="max-w-[700px] mx-auto px-4 sm:px-6 mb-12 sm:mb-20">
        <Reveal className="text-center mb-8">
          <h2 className="font-serif text-3xl font-bold text-gray-900">Frequently asked questions</h2>
        </Reveal>
        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <Reveal key={i} delay={i * 0.05}>
              <div className="rounded-xl border border-border overflow-hidden">
                <button
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-3"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
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
            <h2 className="font-serif text-2xl font-bold text-gray-900 mb-3">{PRICING_CTA.title}</h2>
            <p className="text-muted-fg text-sm mb-6">{PRICING_CTA.description}</p>
            <Link href="/signup">
              <Button size="lg">
                {PRICING_CTA.button} <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

export function PricingPageClient({ tiers, comparisonGroups }: PricingPageClientProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="animate-spin w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full" />
        </div>
      }
    >
      <PricingPageContent tiers={tiers} comparisonGroups={comparisonGroups} />
    </Suspense>
  );
}
