"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/animations";
import {
  PRICING_CONTENT_FOOTNOTE,
  annualSavingAmount,
  annualTooltip,
  formatMoney,
  monthlyRate,
  priceLabel,
} from "@/data/pricing-shared";
import { CAREER_PLAN_HREF, SALES_PLAN_HREF } from "@/lib/pricing-routes";
import type { FeatureComparisonGroup, LandingTier } from "@/data/landing-content";
import type { BillingCadence, PlanTerm, PlanTier, PlanTrack } from "@/data/pricing-shared";
import { PlanTermSelector } from "@/components/pricing/plan-term-selector";
import { cn } from "@/lib/utils";

interface Props {
  tiers: LandingTier[];
  variant: "landing" | "page";
  /**
   * The track this grid renders. Drives the in-card `PlanTermSelector`, the
   * no-`onPurchase` fallback href, and the track-themed card colours on /pricing.
   * Defaults to `"CAREER"` so any stray caller keeps working; `/pricing` passes
   * the live track.
   */
  track?: PlanTrack;
  onStarterModal?: () => void;
  onPurchase?: (plan: "pro" | "elite", term: PlanTerm, cadence: BillingCadence) => void;
  loadingPlan?: string | null;
  /**
   * Controlled term. `/pricing` owns it in the shared toggle ABOVE the grid; when
   * omitted the grid keeps its own state (the landing behaviour). The cadence is
   * no longer a separate input — it is DERIVED from the term (see `TierCard`).
   */
  term?: PlanTerm;
  onTermChange?: (term: PlanTerm) => void;
  /**
   * When `false`, each paid card hides its own term selector — the shared toggle
   * above the table drives every column instead (design C-4).
   */
  showTermSelector?: boolean;
  /**
   * TradingView-style plan columns. When supplied, each column replaces the tier's
   * short bullet list with the FULL feature list, marking ✓ for a feature the tier
   * includes and ✗ for one it does not. The tier's own `badge` ("starter" | "pro" |
   * "elite") selects which flag on each comparison row to read.
   *
   * Omit it to keep the original short-bullet card.
   */
  comparisonGroups?: FeatureComparisonGroup[];
  /**
   * When set, every PAID card renders this short note in place of its purchase
   * CTA (both the purchase button and the no-`onPurchase` plan link). `/pricing`
   * passes it only for an administrator previewing the track that is NOT their
   * own: the checkout route charges `User.track`, so a purchase offered here would
   * show one price and charge another. The free Starter card (`opensModal`) is
   * unaffected — it opens the starter-pack modal, not a purchase.
   */
  previewNotice?: string;
}

/**
 * The "i" affordance beside the annual savings badge. Toggled on click, hover AND
 * focus, and rendered as a real `<button>` with an aria-label so it is reachable by
 * keyboard and screen readers. The bubble carries `role="tooltip"`.
 *
 * The bubble is absolutely positioned with a z-index and must NOT be clipped by an
 * `overflow-hidden` ancestor. The pricing cards deliberately do not clip (see the
 * card classes below) — if a future refactor adds `overflow-hidden` to a card, this
 * tooltip is the first thing that will break.
 */
function AnnualSavingTooltip({
  track,
  tier,
  onLight,
}: {
  track: PlanTrack;
  tier: PlanTier;
  onLight: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    // The hover handlers live on the WRAPPER rather than the button, for two
    // reasons that together read as the tooltip "lagging in showing up":
    //
    //   1. The trigger was a bare 16px circle, so the cursor had to land exactly
    //      on it. Missing it looked like the tooltip was slow, when in fact it had
    //      not been hit. `-m-1` + `h-6 w-6` widen the hit area to 24px without
    //      moving anything on screen (the negative margin cancels the padding).
    //   2. With the handlers on the button, moving the cursor toward the bubble
    //      fired mouseleave and the bubble vanished before it could be read. On
    //      the wrapper, mouseleave only fires once the cursor leaves BOTH — the
    //      bubble is a DOM descendant, so it keeps the wrapper hovered.
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label="How the annual saving is calculated"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className={cn(
          "-m-1 flex h-6 w-6 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2",
          onLight
            ? "border-gray-300 bg-gray-100 text-gray-600 hover:bg-gray-200 focus-visible:ring-gray-400"
            : "border-white/25 bg-white/10 text-white/80 hover:bg-white/20 focus-visible:ring-white/50"
        )}
      >
        <Info className="h-3 w-3" />
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute bottom-full left-1/2 z-30 mb-2 w-60 -translate-x-1/2 rounded-md bg-[#484848] px-3 py-2 text-left text-[11px] font-normal leading-snug text-white shadow-lg"
        >
          {annualTooltip(track, tier)}
        </span>
      )}
    </span>
  );
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
  showTermSelector,
  comparisonGroups,
  previewNotice,
}: {
  tier: LandingTier;
  variant: "landing" | "page";
  track: PlanTrack;
  onStarterModal?: () => void;
  onPurchase?: (plan: "pro" | "elite", term: PlanTerm, cadence: BillingCadence) => void;
  loadingPlan?: string | null;
  term: PlanTerm;
  onTermChange: (term: PlanTerm) => void;
  showTermSelector: boolean;
  comparisonGroups?: FeatureComparisonGroup[];
  previewNotice?: string;
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
   * Cadence is DERIVED from the term, never held separately: "Annually" always
   * means billed annually. The old nested cadence toggle allowed a 12-month term
   * collected monthly, a combination the checkout route now rejects outright.
   */
  const cadence: BillingCadence = term === "12" ? "annual" : "monthly";

  /**
   * The printed price is always DERIVED (PRD C4 — no hardcoded price strings).
   *
   * Both terms go through `monthlyRate()`, which for the monthly term is just
   * the base rate. Previously the monthly term printed the CMS `tier.price`
   * instead, which left a hole: `landing-content.ts` derives its defaults from
   * `PLAN_BASE_PRICE`, so the two agree today, but a price edited in the admin CMS
   * would have been advertised while Stripe charged the unchanged base amount.
   * Deriving it means the displayed price cannot drift from the charged one.
   *
   * Career Pro: monthly -> S$19, annually -> S$16.15 (19 x 0.85).
   */
  const displayPrice =
    isPaid && planTier ? priceLabel(monthlyRate(track, planTier, term)) : tier.price;

  /**
   * The `/ mo` qualifier printed beside the price on every PAID card.
   *
   * A bare `S$19` reads as a one-off charge — the owner's note was that the prices
   * "are missing / mo". It matters most on the ANNUAL term, where the figure is the
   * effective monthly rate (S$16.15) and not the amount collected, so without the
   * suffix "S$16.15 / billed annually" reads as though a year costs S$16.15.
   *
   * The free tier keeps `tier.price` ("Free") untouched — "Free / mo" is nonsense.
   */
  const showMonthlySuffix = isPaid && planTier !== null;

  /**
   * Whether the card paints a LIGHT (white) surface, which decides the text/icon
   * palette. Only the LANDING featured card is light; on /pricing every column is
   * now a dark track-themed card, so this is false throughout the page variant.
   *
   * (Previously this was `isLanding === Boolean(tier.highlight)`, which made the
   * non-featured PAGE card "light" and left it white against the new dark section.)
   */
  const cardIsLight = isLanding && Boolean(tier.highlight);

  /**
   * TradingView-style plan column. When `comparisonGroups` is supplied the column
   * shows the whole feature list — ✓ for what this tier includes, ✗ for what it
   * does not — instead of the tier's own short bullets.
   *
   * Every column renders the SAME names in the SAME order at the same width, so the
   * rows line up across columns without needing a shared grid. That is what removes
   * the old left-hand label column (and with it the table look).
   */
  const featureRows: Array<{ name: string; included: boolean }> = comparisonGroups
    ? comparisonGroups.flatMap((group) =>
        group.items.map((item) => ({
          name: item.name,
          // `item.starter` is optional; sales rows carry only pro/elite.
          included: Boolean(item[tier.badge]),
        }))
      )
    : tier.features.map((name) => ({ name, included: true }));

  /**
   * Excluded rows are deliberately de-emphasised, but not below the point of
   * legibility: `text-gray-500` on white still clears WCAG AA (4.8:1). On the dark
   * track-themed cards the equivalents are white at reduced opacity.
   */
  const includedIconClass = cardIsLight ? "text-green-500" : "text-green-400";
  const excludedIconClass = cardIsLight ? "text-gray-400" : "text-white/35";
  const includedTextClass = cardIsLight ? "text-gray-700" : "text-white/85";
  const excludedTextClass = cardIsLight ? "text-gray-500" : "text-white/50";

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
            cardIsLight ? "mb-4" : "mb-4 bg-white/10 text-white border-white/20"
          }
        >
          {tier.name}
        </Badge>
        <div className="mb-4">
          {/* Price and billing are stacked, not inline. Inline they need
              `price (180px) + gap (8px) + billing (168px) = 356px`, but a Career
              column only offers 288px of content at 768px and 319px at 1280px — so
              the billing line wrapped to a second line at exactly those widths and
              pushed that column's ✓/✗ list 20px below its neighbours'. The billing
              line is now derived (not CMS-editable), but the stacking stays so the
              layout cannot drift again. */}
          <div
            className={`flex items-baseline gap-2 font-serif text-5xl font-bold tracking-tight ${
              cardIsLight ? "text-gray-900" : "text-white"
            }`}
          >
            <span>{displayPrice}</span>
            {/* The suffix is deliberately smaller and sans-serif, mirroring the
                free-plan panel above (`$0` + a small `per month`). Kept on the same
                baseline so the price block's height — which every column reserves —
                is unchanged by its presence. */}
            {showMonthlySuffix && (
              <span
                className={`font-sans text-base font-semibold tracking-normal sm:text-lg ${
                  cardIsLight ? "text-muted-fg" : "text-white/60"
                }`}
              >
                / mo
              </span>
            )}
          </div>
          {/* Reserved in every column — including the free tier, whose "forever"
              is intentionally not shown — so the price block is the same height
              everywhere. The line is DERIVED from the term, never the CMS
              `tier.billing`, so the words and the term can never disagree.
              `min-h` tracks the type size below it: a line box that is shorter
              than the text is exactly the 2px-of-drift bug this guards against.

              ANNUAL ONLY. On the monthly term the price already ends in `/ mo`
              and this line read "billed monthly" — the same fact stated twice.
              The row is now empty there, but the `min-h` above still reserves
              its height, so no column moves. Annual keeps it: `S$16.15 / mo`
              over "billed annually" is NOT a duplicate — S$16.15 is the
              effective monthly rate, while S$193.80 is what is charged. */}
          <div
            className={`mt-1 min-h-[24px] text-base sm:min-h-[28px] sm:text-lg ${
              cardIsLight ? "text-muted-fg" : "text-white/60"
            }`}
          >
            {isPaid && term === "12" ? "billed annually" : null}
          </div>
          {/* The savings badge gets its OWN row, reserved for the whole annual
              term in every column. `flex h-6` rather than `min-h-[24px]` + an
              inline-block badge: an inline-block creates a 26px line box where an
              empty row measures 24px, which was the last 2px of drift. */}
          {term === "12" && (
            <div className="mt-1.5 flex h-6 items-center gap-1.5">
              {planTier && (
                <>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold",
                      track === "SALES"
                        ? "border-[#2fbf8f]/40 bg-[#2fbf8f]/15 text-[#7fe3c0]"
                        : "border-[#2e7bfe]/40 bg-[#2e7bfe]/15 text-[#9dc0ff]"
                    )}
                  >
                    Save {formatMoney(annualSavingAmount(track, planTier))} a year
                  </span>
                  <AnnualSavingTooltip track={track} tier={planTier} onLight={cardIsLight} />
                </>
              )}
            </div>
          )}
        </div>
        <ul className="space-y-2 sm:space-y-2.5">
          {featureRows.map((row) => (
            <li key={row.name} className="flex items-start gap-2.5 text-base sm:text-lg">
              {row.included ? (
                <Check className={`w-4 h-4 sm:w-5 sm:h-5 mt-0.5 flex-shrink-0 ${includedIconClass}`} />
              ) : (
                <X className={`w-4 h-4 sm:w-5 sm:h-5 mt-0.5 flex-shrink-0 ${excludedIconClass}`} />
              )}
              <span className={row.included ? includedTextClass : excludedTextClass}>
                {row.name}
              </span>
            </li>
          ))}
        </ul>
        {/* The footnote is rendered once beneath the whole column row in this mode,
            not repeated inside every card. */}
        {isPaid && !comparisonGroups && (
          <p className={`text-xs italic mt-4 ${cardIsLight ? "text-muted-fg" : "text-white/55"}`}>
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
        ) : previewNotice ? (
          <p className="text-xs text-white/60 text-center">{previewNotice}</p>
        ) : isPaid && onPurchase ? (
          <div className="space-y-3">
            {showTermSelector && (
              <PlanTermSelector
                track={track}
                tier={tier.name === "Elite" ? "ELITE" : "PRO"}
                value={term}
                onChange={onTermChange}
                tone={cardIsLight ? "light" : "dark"}
              />
            )}
            <Button
              // On /pricing every CTA is the same pill: brand blue gradient, green ->
              // blue on hover. The landing cards keep their own treatment, and the old
              // amber Elite override on this page is deliberately gone — the brief was
              // that all buttons read alike.
              className={cn("w-full", !isLanding && "rounded-full")}
              variant={isLanding ? (tier.highlight ? "default" : "primary-dark") : "gradient"}
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
        className={cn(
          "relative rounded-2xl border-2 p-5 sm:p-6 lg:p-7 h-full flex flex-col text-white shadow-2xl scroll-mt-24",
          track === "SALES"
            ? "bg-[#082820] border-[#2fbf8f] shadow-[#2fbf8f]/20"
            : "bg-[#102850] border-[#2e7bfe] shadow-[#2e7bfe]/20"
        )}
      >
        {cardInner}
      </div>
    );
  }

  return (
    <div
      id={planId}
      // `border-2` (not `border`) so the content box is the same width as the
      // highlighted card's `border-2` — a 1px difference is enough to make one
      // feature row wrap differently and break the cross-column alignment.
      className={cn(
        "rounded-2xl border-2 p-5 sm:p-6 lg:p-7 h-full flex flex-col text-white scroll-mt-24",
        track === "SALES" ? "bg-[#082820] border-white/10" : "bg-[#102850] border-white/10"
      )}
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
  onTermChange,
  showTermSelector = true,
  comparisonGroups,
  previewNotice,
}: Props) {
  // One term for the whole grid: a member comparing Pro and Elite keeps the term
  // they picked when they move between cards. On `/pricing` the term is controlled
  // by the shared toggle above the grid, so the internal state is the fallback only.
  const [internalTerm, setInternalTerm] = useState<PlanTerm>("monthly");

  const term = controlledTerm ?? internalTerm;
  const setTerm = onTermChange ?? setInternalTerm;

  // Match the column count to the number of tiers so the row always fills.
  // Career now shows two tiers on /pricing (Starter is filtered out and lives in
  // the top panel); Sales has two (Pro/Elite).
  //
  // ⚠️ The `xl:grid-cols-3` branch is therefore currently UNREACHABLE — both tracks
  // now pass exactly two tiers. It is kept (not deleted) because the 3-up layout is
  // still correct if a third paid tier is ever added, and the measured reasoning
  // below is what makes it safe.
  //
  // The 3-column step is `xl`, NOT `md` and NOT `lg`. Each plan column carries a
  // ~20-row ✓/✗ list, so it needs roughly 300px of content width to be readable.
  // Measured content width per column for a three-column track:
  //     768px -> 3 cols = 219px  (cards ballooned to 1292px tall)
  //    1024px -> 3 cols = 233px  (descriptions spilled to a 3rd line, 1089px tall)
  //    1180px -> 3 cols = 285px  (still under the ~300px floor)
  //    1280px -> 3 cols = 319px  ✅
  // So 3-up only from `xl`; 1024–1279 uses the 2-up tablet step instead, which
  // gives ~392px per column and is genuinely comfortable.
  //
  // The literals must stay written out in full for Tailwind's source scanner.
  const gridColsClass =
    tiers.length === 1
      ? "md:grid-cols-1"
      : tiers.length === 2
        ? "md:grid-cols-2"
        : "md:grid-cols-2 xl:grid-cols-3";

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
            showTermSelector={showTermSelector}
            comparisonGroups={comparisonGroups}
            previewNotice={previewNotice}
          />
        </Reveal>
      ))}
    </div>
  );

  return grid;
}
