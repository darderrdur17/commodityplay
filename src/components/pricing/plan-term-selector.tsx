"use client";

import {
  PLAN_TERMS,
  PLAN_TERM_ORDER,
  monthlyRateUsd,
  priceLabel,
  type BillingCadence,
  type PlanTerm,
  type PlanTier,
  type PlanTrack,
} from "@/data/pricing-shared";
import { cn } from "@/lib/utils";

interface PlanTermSelectorProps {
  track: PlanTrack;
  tier: PlanTier;
  value: PlanTerm;
  onChange: (term: PlanTerm) => void;
  cadence?: BillingCadence;
  onCadenceChange?: (c: BillingCadence) => void;
  /** "dark" for the translucent landing cards; "light" for white cards and /account. */
  tone?: "light" | "dark";
}

/**
 * 2-way segmented control: Monthly / 12 months + 2 free.
 *
 * The rate printed underneath is the NORMALISED monthly rate for the selected term
 * (USD 16.29 for Career Pro term12), so the member sees exactly what the
 * invoice will charge — the same number monthlyRateUsd() feeds to Stripe's coupon.
 * On the 12-month term, billed-annually uses a yearly Stripe Price and a 2-month trial.
 */
export function PlanTermSelector({
  track,
  tier,
  value,
  onChange,
  cadence = "monthly",
  onCadenceChange,
  tone = "light",
}: PlanTermSelectorProps) {
  return (
    <div className="space-y-1.5">
      <div
        role="radiogroup"
        aria-label="Billing term"
        className={cn(
          "grid grid-cols-2 gap-1 rounded-lg p-1",
          tone === "dark" ? "bg-white/10" : "bg-secondary"
        )}
      >
        {PLAN_TERM_ORDER.map((term) => {
          const active = term === value;
          return (
            <button
              key={term}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(term)}
              className={cn(
                "rounded-md px-2 py-1.5 text-[11px] font-semibold leading-tight transition-colors",
                active
                  ? "bg-white text-gray-900 shadow-sm"
                  : tone === "dark"
                    ? "text-white/70 hover:text-white"
                    : "text-muted-fg hover:text-gray-900"
              )}
            >
              {PLAN_TERMS[term].shortLabel}
            </button>
          );
        })}
      </div>
      {value === "12" && (
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={() => onCadenceChange?.("monthly")}
            className={cn(
              "text-xs px-2 py-1 rounded",
              cadence === "monthly" ? "bg-white text-gray-900" : tone === "dark" ? "text-white/70" : "text-muted-fg"
            )}
          >
            Billed monthly
          </button>
          <button
            type="button"
            onClick={() => onCadenceChange?.("annual")}
            className={cn(
              "text-xs px-2 py-1 rounded",
              cadence === "annual" ? "bg-white text-gray-900" : tone === "dark" ? "text-white/70" : "text-muted-fg"
            )}
          >
            Billed annually
          </button>
        </div>
      )}
      <p className={cn("text-xs", tone === "dark" ? "text-white/60" : "text-muted-fg")}>
        {cadence === "annual" && value === "12"
          ? "Billed once a year · 2-month trial"
          : `${priceLabel(monthlyRateUsd(track, tier, value))} / month · ${PLAN_TERMS[value].label}`}
      </p>
    </div>
  );
}
