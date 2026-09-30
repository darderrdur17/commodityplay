"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/animations";
import { PRICING_CONTENT_FOOTNOTE } from "@/data/pricing-shared";
import { CAREER_PLAN_HREF } from "@/lib/pricing-routes";
import type { LandingTier } from "@/data/landing-content";
import type { PlanTerm } from "@/data/pricing-shared";
import { PlanTermSelector } from "@/components/pricing/plan-term-selector";

interface Props {
  tiers: LandingTier[];
  variant: "landing" | "page";
  onStarterModal?: () => void;
  onPurchase?: (plan: "pro" | "elite", term: PlanTerm) => void;
  loadingPlan?: string | null;
}

function TierCard({
  tier,
  variant,
  onStarterModal,
  onPurchase,
  loadingPlan,
  term,
  onTermChange,
}: {
  tier: LandingTier;
  variant: "landing" | "page";
  onStarterModal?: () => void;
  onPurchase?: (plan: "pro" | "elite", term: PlanTerm) => void;
  loadingPlan?: string | null;
  term: PlanTerm;
  onTermChange: (term: PlanTerm) => void;
}) {
  const isLanding = variant === "landing";
  const planId = tier.name === "Pro" ? "plan-pro" : tier.name === "Elite" ? "plan-elite" : undefined;
  const isPaid = tier.name === "Pro" || tier.name === "Elite";

  const cardInner = (
    <>
      {tier.highlight && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary-400 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
          Most Popular
        </div>
      )}
      <div className={isLanding ? "p-6 sm:p-7 flex-1" : "flex-1"}>
        <Badge
          variant={tier.badge}
          className={
            isLanding
              ? tier.highlight
                ? "mb-4"
                : "mb-4 bg-white/10 text-white border-white/20"
              : tier.highlight
                ? "mb-4 bg-white/10 text-white border-white/20"
                : "mb-4"
          }
        >
          {tier.name}
        </Badge>
        <p
          className={`text-sm mb-4 italic leading-relaxed ${
            isLanding
              ? tier.highlight
                ? "text-muted-fg"
                : "text-white/70"
              : tier.highlight
                ? "text-white/70"
                : "text-muted-fg"
          }`}
        >
          {tier.tooltip}
        </p>
        <div className="mb-4">
          <span
            className={`font-serif text-3xl sm:text-4xl font-bold ${
              isLanding
                ? tier.highlight
                  ? "text-gray-900"
                  : "text-white"
                : tier.highlight
                  ? "text-white"
                  : "text-gray-900"
            }`}
          >
            {tier.price}
          </span>
          {tier.price !== "Free" && (
            <span
              className={`text-sm ml-2 ${
                isLanding
                  ? tier.highlight
                    ? "text-muted-fg"
                    : "text-white/60"
                  : tier.highlight
                    ? "text-white/60"
                    : "text-muted-fg"
              }`}
            >
              {tier.billing}
            </span>
          )}
        </div>
        <ul className="space-y-2.5">
          {tier.features.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-sm">
              <Check
                className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                  isLanding
                    ? tier.highlight
                      ? "text-primary-400"
                      : "text-accent"
                    : tier.highlight
                      ? "text-accent"
                      : tier.name === "Elite"
                        ? "text-amber-500"
                        : "text-green-500"
                }`}
              />
              <span
                className={
                  isLanding
                    ? tier.highlight
                      ? "text-gray-700"
                      : "text-white/85"
                    : tier.highlight
                      ? "text-white/85"
                      : "text-gray-700"
                }
              >
                {f}
              </span>
            </li>
          ))}
        </ul>
        {isPaid && (
          <p
            className={`text-xs italic mt-4 ${
              isLanding
                ? tier.highlight
                  ? "text-muted-fg"
                  : "text-white/55"
                : tier.highlight
                  ? "text-white/55"
                  : "text-muted-fg"
            }`}
          >
            {PRICING_CONTENT_FOOTNOTE}
          </p>
        )}
      </div>
      <div className={isLanding ? "p-6 sm:p-7 pt-0" : "mt-6"}>
        {tier.opensModal ? (
          <Button
            className="w-full"
            variant={tier.highlight ? "default" : "primary-dark"}
            size="lg"
            onClick={onStarterModal}
          >
            {tier.cta}
          </Button>
        ) : isPaid && onPurchase ? (
          <div className="space-y-3">
            <PlanTermSelector
              track="CAREER"
              tier={tier.name === "Elite" ? "ELITE" : "PRO"}
              value={term}
              onChange={onTermChange}
              tone={isLanding ? "dark" : "light"}
            />
            <Button
              className={`w-full ${!isLanding && tier.name === "Elite" ? "bg-amber-500 hover:bg-amber-600 text-white" : ""}`}
              variant={tier.highlight ? (isLanding ? "default" : "primary-dark") : "primary-dark"}
              size="lg"
              onClick={() => onPurchase(tier.name.toLowerCase() as "pro" | "elite", term)}
              loading={loadingPlan === tier.name.toLowerCase()}
            >
              {tier.cta}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        ) : isPaid ? (
          <Link href={CAREER_PLAN_HREF(tier.name.toLowerCase() as "pro" | "elite")} className="block">
            <Button
              className="w-full"
              variant={tier.highlight ? "default" : "primary-dark"}
              size="lg"
            >
              {tier.cta}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        ) : (
          <Link href={tier.href} className="block">
            <Button
              className="w-full"
              variant={tier.highlight ? "default" : isLanding ? "primary-dark" : "outline"}
              size="lg"
            >
              {tier.cta}
              {!isLanding && tier.name === "Starter" ? null : <ArrowRight className="w-4 h-4" />}
            </Button>
          </Link>
        )}
      </div>
    </>
  );

  if (isLanding) {
    return (
      <div
        id={planId}
        className={`relative rounded-2xl h-full flex flex-col group/tier scroll-mt-24 ${
          tier.highlight
            ? "bg-white text-gray-900 border-2 border-primary-400 shadow-2xl"
            : "bg-white/10 backdrop-blur-sm border border-white/20 text-white"
        }`}
      >
        {cardInner}
      </div>
    );
  }

  if (tier.highlight) {
    return (
      <div
        id={planId}
        className="relative bg-primary-800 rounded-2xl border-2 border-primary-400 p-7 h-full flex flex-col text-white shadow-2xl shadow-primary-800/30 scroll-mt-24"
      >
        {cardInner}
      </div>
    );
  }

  return (
    <div
      id={planId}
      className="bg-white rounded-2xl border border-border p-7 h-full flex flex-col scroll-mt-24"
    >
      {cardInner}
    </div>
  );
}

export function PricingTierGrid({
  tiers,
  variant,
  onStarterModal,
  onPurchase,
  loadingPlan,
}: Props) {
  // One term for the whole grid: a member comparing Pro and Elite keeps the term they
  // picked when they move between cards.
  const [term, setTerm] = useState<PlanTerm>("monthly");

  const grid = (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
      {tiers.map((tier, i) =>
        variant === "landing" ? (
          <Reveal key={tier.name} delay={i * 0.1} className="h-full">
            <TierCard
              tier={tier}
              variant={variant}
              onStarterModal={onStarterModal}
              onPurchase={onPurchase}
              loadingPlan={loadingPlan}
              term={term}
              onTermChange={setTerm}
            />
          </Reveal>
        ) : (
          <Reveal key={tier.name} delay={i * 0.1} className="h-full">
            <TierCard
              tier={tier}
              variant={variant}
              onStarterModal={onStarterModal}
              onPurchase={onPurchase}
              loadingPlan={loadingPlan}
              term={term}
              onTermChange={setTerm}
            />
          </Reveal>
        )
      )}
    </div>
  );

  return grid;
}
