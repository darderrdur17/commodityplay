"use client";

import {
  PLAN_TERMS,
  PLAN_TERM_ORDER,
  monthlyRate,
  priceLabel,
  termSavingsPercent,
  type PlanTerm,
  type PlanTier,
  type PlanTrack,
} from "@/data/pricing-shared";
import { cn } from "@/lib/utils";

interface PlanTermSelectorProps {
  /**
   * The track/tier the printed rate belongs to. Omitted by the SHARED toggle above
   * the /pricing table, which drives every column at once and therefore has no
   * single price to print — it renders the same control without the rate suffix.
   */
  track?: PlanTrack;
  tier?: PlanTier;
  value: PlanTerm;
  onChange: (term: PlanTerm) => void;
  /**
   * Palette for the surface this sits on. `/pricing` renders the control on the
   * WHITE page and passes `"light"`, so the `"dark"` branch is currently
   * UNREACHABLE — no caller uses it. It is kept (not deleted) because the control
   * is designed to sit on the dark track-themed cards too.
   */
  tone?: "light" | "dark";
  /**
   * `false` drops the per-month rate from each option. Set by the shared toggle
   * above the /pricing table, where every column prints its own derived price — a
   * rate that repeated one tier's figure would be wrong for the other columns.
   */
  showRate?: boolean;
}

/**
 * Term chooser — exactly TWO options, `Monthly` and `Annually`.
 *
 * The annual option carries a "Save 15% 🥳" badge. The 15 is DERIVED from
 * `termSavingsPercent("12")`, never written as a literal, so the badge cannot
 * drift from the arithmetic in `pricing-shared.ts`.
 *
 * ---------------------------------------------------------------------------
 * WHY THERE IS NO CADENCE SUB-TOGGLE
 * ---------------------------------------------------------------------------
 * The old control nested a "Billed monthly / Billed annually" switch inside the
 * 12-month option. That allowed a state the checkout route could not price:
 * a 12-month term collected monthly. The cadence is now DERIVED from the term at
 * every call site (`term === "12" ? "annual" : "monthly"`), so the two can never
 * disagree — Annually always means billed annually.
 *
 * ⚠️ Never render the word "trial" here (hard product rule): it implies a price
 * rise afterwards, which is not what the annual discount does.
 */
export function PlanTermSelector({
  track,
  tier,
  value,
  onChange,
  tone = "light",
  showRate = true,
}: PlanTermSelectorProps) {
  const dark = tone === "dark";
  /** Non-null only when the caller has a single tier to price. */
  const priced = showRate && track && tier ? { track, tier } : null;
  const savingsPercent = termSavingsPercent("12");

  return (
    <div
      role="radiogroup"
      aria-label="Billing term"
      className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2"
    >
      {PLAN_TERM_ORDER.map((term) => {
        const active = term === value;
        const { shortLabel } = PLAN_TERMS[term];
        const rate = priced ? monthlyRate(priced.track, priced.tier, term) : null;

        return (
          /* Presentational wrapper: keeps the radio buttons as the radiogroup's
             effective children while letting the "Save 15%" badge sit BESIDE the
             Annually radio. A nested <button> is invalid HTML, so the badge has to
             be a sibling of the radio, not a child of it. */
          <div key={term} role="none" className="flex items-center gap-2">
            <button
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(term)}
              className={cn(
                "flex items-center gap-2 rounded-full py-1 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400",
                dark
                  ? active
                    ? "text-white"
                    : "text-white/60 hover:text-white"
                  : active
                    ? "text-gray-900"
                    : "text-gray-500 hover:text-gray-900"
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border",
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
                  <span className={cn("h-1.5 w-1.5 rounded-full", dark ? "bg-gray-900" : "bg-white")} />
                )}
              </span>
              <span className="truncate">{shortLabel}</span>
              {rate !== null && (
                <span className={cn("font-normal", dark ? "text-white/55" : "text-muted-fg")}>
                  {priceLabel(rate)}/mo
                </span>
              )}
            </button>
            {term === "12" && (
              <span
                className={cn(
                  "rounded-md border px-2 py-0.5 text-[11px] font-bold leading-tight",
                  dark
                    ? "border-white/20 bg-white/10 text-white"
                    : "border-border bg-secondary text-gray-700"
                )}
              >
                Save {savingsPercent}% 🥳
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
