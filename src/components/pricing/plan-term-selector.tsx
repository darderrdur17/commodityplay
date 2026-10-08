"use client";

import {
  PLAN_TERMS,
  PLAN_TERM_ORDER,
  monthlyRateUsd,
  priceLabel,
  termTotalUsd,
  type BillingCadence,
  type PlanTerm,
  type PlanTier,
  type PlanTrack,
} from "@/data/pricing-shared";
import { cn } from "@/lib/utils";

interface PlanTermSelectorProps {
  /**
   * The track/tier the printed price belongs to. Omitted by the SHARED toggle above
   * the /pricing table, which drives three columns at once and therefore has no
   * single price to print — it renders the same cards without the price block.
   */
  track?: PlanTrack;
  tier?: PlanTier;
  value: PlanTerm;
  onChange: (term: PlanTerm) => void;
  cadence?: BillingCadence;
  onCadenceChange?: (c: BillingCadence) => void;
  /** "dark" for the translucent landing cards; "light" for white cards and /account. */
  tone?: "light" | "dark";
  /**
   * `false` drops the price block from each card. Set by the shared toggle above the
   * /pricing table, where every column prints its own derived price — a card that
   * repeated one tier's total would be wrong for the other two columns.
   */
  showRate?: boolean;
}

/** Only the 12-month term has a choice of how it is collected. */
const CADENCES: ReadonlyArray<{ key: BillingCadence; label: string }> = [
  { key: "monthly", label: "Billed monthly" },
  { key: "annual", label: "Billed annually" },
];

/**
 * Term chooser — a stack of radio cards, one per term.
 *
 * Each card answers "what does this term actually cost me?" with the TOTAL for the
 * term as the headline and the normalised monthly rate underneath, plus how many
 * months of access that buys. When the caller has no single tier to price (the shared
 * toggle on /pricing) the same cards render with the benefit copy instead of a number.
 *
 * ---------------------------------------------------------------------------
 * WHY THERE IS NO "SAVE $X" LINE
 * ---------------------------------------------------------------------------
 * The 12-month term is priced at exactly `base x 12`, so twelve monthly payments cost
 * the SAME as the 12-month term — there is no dollar saving to advertise, and a
 * "Save $X when compared to the monthly plan" line would compute to $0. What the member
 * actually gets is TWO FREE MONTHS: 14 months of access for 12 months' money. That is
 * why the headline is the term total and the rate beneath it is `total / accessMonths`.
 *
 * The free months arrive as a 60-day trial on the subscription. That is an implementation
 * detail of how the discount is delivered, NOT something the member is told: the owner
 * asked us to drop the word "trial" because it implies a price rise afterwards, which is
 * not true here. Keep the wording member-facing copy — never surface "trial" in this file.
 */
export function PlanTermSelector({
  track,
  tier,
  value,
  onChange,
  cadence = "monthly",
  onCadenceChange,
  tone = "light",
  showRate = true,
}: PlanTermSelectorProps) {
  const dark = tone === "dark";
  /** Non-null only when the caller has a single tier to price. */
  const priced = showRate && track && tier ? { track, tier } : null;

  const cadenceToggle =
    value === "12" && onCadenceChange ? (
      <div className={cn("flex gap-1 rounded-md p-0.5", dark ? "bg-black/25" : "bg-secondary")}>
        {CADENCES.map((c) => {
          const active = cadence === c.key;
          return (
            <button
              key={c.key}
              type="button"
              aria-pressed={active}
              onClick={() => onCadenceChange(c.key)}
              className={cn(
                "flex-1 rounded px-2 py-1 text-[10px] font-semibold leading-tight transition-colors",
                active
                  ? "bg-white text-gray-900 shadow-sm"
                  : dark
                    ? "text-white/60 hover:text-white"
                    : "text-muted-fg hover:text-gray-900"
              )}
            >
              {c.label}
            </button>
          );
        })}
      </div>
    ) : null;

  return (
    <div role="radiogroup" aria-label="Billing term" className="space-y-2">
      {PLAN_TERM_ORDER.map((term) => {
        const active = term === value;
        const { shortLabel, paidMonths, accessMonths } = PLAN_TERMS[term];
        const freeMonths = accessMonths - paidMonths;
        const total = priced ? termTotalUsd(priced.track, priced.tier, term) : null;
        const rate = priced ? monthlyRateUsd(priced.track, priced.tier, term) : null;

        return (
          <div
            key={term}
            /* Presentational wrapper: keeps the radio buttons as the radiogroup's
               effective children while giving the active card room for its cadence
               control. A nested <button> is invalid HTML, so the cadence toggle has
               to sit OUTSIDE the radio button. */
            role="none"
            className={cn(
              "rounded-lg border transition-colors",
              dark
                ? active
                  ? "border-white/50 bg-white/10"
                  : "border-white/15 bg-white/5 hover:border-white/30"
                : active
                  ? "border-gray-900 bg-gray-50"
                  : "border-border bg-white hover:border-gray-300"
            )}
          >
            <button
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(term)}
              className="w-full rounded-lg px-3 py-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    aria-hidden
                    className={cn(
                      "flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full border",
                      active
                        ? dark
                          ? "border-white bg-white"
                          : "border-gray-900 bg-gray-900"
                        : dark
                          ? "border-white/40"
                          : "border-gray-300"
                    )}
                  >
                    {active && (
                      <span
                        className={cn("h-1.5 w-1.5 rounded-full", dark ? "bg-gray-900" : "bg-white")}
                      />
                    )}
                  </span>
                  <span
                    className={cn(
                      "truncate text-xs font-semibold",
                      dark
                        ? active
                          ? "text-white"
                          : "text-white/75"
                        : active
                          ? "text-gray-900"
                          : "text-gray-600"
                    )}
                  >
                    {shortLabel}
                  </span>
                </span>
                {total !== null && (
                  <span className="flex flex-shrink-0 items-baseline gap-1">
                    <span
                      className={cn(
                        "font-serif text-base font-bold",
                        dark ? "text-white" : "text-gray-900"
                      )}
                    >
                      {priceLabel(total)}
                    </span>
                    <span
                      className={cn("text-[10px] font-medium", dark ? "text-white/55" : "text-muted-fg")}
                    >
                      total
                    </span>
                  </span>
                )}
              </div>
              <p
                className={cn(
                  "mt-1 pl-[22px] text-[11px] leading-snug",
                  dark ? "text-white/55" : "text-muted-fg"
                )}
              >
                {freeMonths > 0
                  ? rate !== null
                    ? `${priceLabel(rate)}/month · ${accessMonths} months of access`
                    : `${accessMonths} months of access for ${paidMonths} months' money`
                  : "Billed monthly · cancel anytime"}
              </p>
              {freeMonths > 0 && (
                <span className="ml-[22px] mt-1.5 inline-block rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-green-700">
                  {freeMonths} months free
                </span>
              )}
            </button>
            {active && cadenceToggle && <div className="px-3 pb-2.5">{cadenceToggle}</div>}
          </div>
        );
      })}
    </div>
  );
}
