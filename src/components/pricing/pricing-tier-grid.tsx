"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/animations";
import {
  PRICING_CONTENT_FOOTNOTE,
  monthlyRateUsd,
  priceLabel,
  termSavingsPercent,
} from "@/data/pricing-shared";
import { CAREER_PLAN_HREF, SALES_PLAN_HREF } from "@/lib/pricing-routes";
import type { LandingTier } from "@/data/landing-content";
import type { BillingCadence, PlanTerm, PlanTier, PlanTrack } from "@/data/pricing-shared";
import { PlanTermSelector } from "@/components/pricing/plan-term-selector";

interface Props {
  tiers: LandingTier[];
  variant: "landing" | "page";
  /**
   * The track this grid renders. Drives the in-card `PlanTermSelector` and the
   * no-`onPurchase` fallback href. Defaults to `"CAREER"` so any stray caller
   * keeps working; `/pricing` passes the live track.
   */
  track?: PlanTrack;
  onStarterModal?: () => void;
  onPurchase?: (plan: "pro" | "elite", term: PlanTerm, cadence: BillingCadence) => void;
  loadingPlan?: string | null;
  /**
   * Controlled term/cadence. `/pricing` owns these in the shared toggle ABOVE the
   * grid; when omitted the grid keeps its own state (the landing behaviour).
   */
  term?: PlanTerm;
  cadence?: BillingCadence;
  onTermChange?: (term: PlanTerm) => void;
  onCadenceChange?: (cadence: BillingCadence) => void;
  /**
   * When `false`, each paid card hides its own term selector — the shared toggle
   * above the table drives every column instead (design C-4).
   */
  showTermSelector?: boolean;
}

function TierCard({
  tier,
  variant,
  track,
  onStarterModal,
  onPurchase,
  loadingPlan,
  term,
  onTermChange,
  cadence,
  onCadenceChange,
  showTermSelector,
}: {
  tier: LandingTier;
  variant: "landing" | "page";
  track: PlanTrack;
  onStarterModal?: () => void;
  onPurchase?: (plan: "pro" | "elite", term: PlanTerm, cadence: BillingCadence) => void;
  loadingPlan?: string | null;
  term: PlanTerm;
  onTermChange: (term: PlanTerm) => void;
  cadence: BillingCadence;
  onCadenceChange: (cadence: BillingCadence) => void;
  showTermSelector: boolean;
}) {
  const isLanding = variant === "landing";
  const planId =
    tier.name === "Starter"
      ? "plan-starter"
      : tier.name === "Pro"
        ? "plan-pro"
        : tier.name === "Elite"
          ? "plan-elite"
          : undefined;
  const isPaid = tier.name === "Pro" || tier.name === "Elite";
  const planTier: PlanTier | null =
    tier.name === "Pro" ? "PRO" : tier.name === "Elite" ? "ELITE" : null;

  /**
   * The printed price is always DERIVED (PRD C4 — no hardcoded price strings).
   *
   * Both terms now go through `monthlyRateUsd()`, which for the monthly term is
   * just the base rate. Previously the monthly term printed the CMS `tier.price`
   * instead, which left a hole: `landing-content.ts` derives its defaults from
   * `PLAN_BASE_USD`, so the two agree today, but a price edited in the admin CMS
   * would have been advertised while Stripe charged the unchanged base amount.
   * Deriving it means the displayed price cannot drift from the charged one.
   *
   * Career Pro: monthly -> USD 19, 12-month -> USD 16.29 (19 x 12/14).
   */
  const displayPrice =
    isPaid && planTier ? priceLabel(monthlyRateUsd(track, planTier, term)) : tier.price;

  /**
   * The featured card INVERTS between the two layouts — see the three return branches
   * below. On the landing page the featured card is the LIGHT one (bg-white) and the
   * others are dark; in the in-app grid the featured card is the DARK one (bg-primary-800).
   *
   * PlanTermSelector paints its own track and label from this `tone`, so deriving it from
   * `isLanding` alone gave the LIGHT featured card the DARK palette: its unselected
   * "12 + 2 free" label rendered `text-white/70` on white and was invisible. Verified on
   * the live site — the label computed to rgba(255,255,255,0.7).
   */
  const cardIsLight = isLanding === Boolean(tier.highlight);

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
            {displayPrice}
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
          {isPaid && term === "12" && (
            <span className="ml-2 inline-block align-middle text-[11px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5 bg-green-50 text-green-700 border border-green-200">
              Save {termSavingsPercent("12")}%
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
            {showTermSelector && (
              <PlanTermSelector
                track={track}
                tier={tier.name === "Elite" ? "ELITE" : "PRO"}
                value={term}
                onChange={onTermChange}
                cadence={cadence}
                onCadenceChange={onCadenceChange}
                tone={cardIsLight ? "light" : "dark"}
              />
            )}
            <Button
              className={`w-full ${!isLanding && tier.name === "Elite" ? "bg-amber-500 hover:bg-amber-600 text-white" : ""}`}
              variant={tier.highlight ? (isLanding ? "default" : "primary-dark") : "primary-dark"}
              size="lg"
              onClick={() => onPurchase(tier.name.toLowerCase() as "pro" | "elite", term, cadence)}
              loading={loadingPlan === tier.name.toLowerCase()}
            >
              {tier.cta}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        ) : isPaid ? (
          <Link
            href={
              track === "SALES"
                ? SALES_PLAN_HREF(tier.name.toLowerCase() as "pro" | "elite")
                : CAREER_PLAN_HREF(tier.name.toLowerCase() as "pro" | "elite")
            }
            className="block"
          >
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
  track = "CAREER",
  onStarterModal,
  onPurchase,
  loadingPlan,
  term: controlledTerm,
  cadence: controlledCadence,
  onTermChange,
  onCadenceChange,
  showTermSelector = true,
}: Props) {
  // One term for the whole grid: a member comparing Pro and Elite keeps the term they
  // picked when they move between cards. On `/pricing` the term/cadence are controlled
  // by the shared toggle above the grid, so the internal state is the fallback only.
  const [internalTerm, setInternalTerm] = useState<PlanTerm>("monthly");
  const [internalCadence, setInternalCadence] = useState<BillingCadence>("monthly");

  const term = controlledTerm ?? internalTerm;
  const cadence = controlledCadence ?? internalCadence;
  const setTerm = onTermChange ?? setInternalTerm;
  const setCadence = onCadenceChange ?? setInternalCadence;

  // Match the column count to the number of tiers so the row always fills.
  // Career has three tiers (Starter/Pro/Elite) and wants three columns. Sales has two
  // (Pro/Elite), so a hardcoded three-column grid left its cards in columns 1–2 with an
  // empty third column on the right — the row looked half-finished.
  // The literals must stay written out in full for Tailwind's source scanner.
  const gridColsClass =
    tiers.length === 1 ? "md:grid-cols-1" : tiers.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3";

  const grid = (
    <div className={`grid grid-cols-1 ${gridColsClass} gap-6 items-stretch`}>
      {tiers.map((tier, i) => (
        <Reveal key={tier.name} delay={i * 0.1} className="h-full">
          <TierCard
            tier={tier}
            variant={variant}
            track={track}
            onStarterModal={onStarterModal}
            onPurchase={onPurchase}
            loadingPlan={loadingPlan}
            term={term}
            onTermChange={setTerm}
            cadence={cadence}
            onCadenceChange={setCadence}
            showTermSelector={showTermSelector}
          />
        </Reveal>
      ))}
    </div>
  );

  return grid;
}
