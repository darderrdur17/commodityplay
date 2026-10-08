"use client";

import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FeatureComparisonGroup } from "@/data/landing-content";

export interface PricingComparisonTableProps {
  /** Career groups carry a `starter` boolean; Sales groups only pro/elite. */
  groups: FeatureComparisonGroup[];
  /** Which tier columns to render, left→right. */
  columns: Array<{ key: "starter" | "pro" | "elite"; label: string }>;
  tone?: "light" | "dark";
}

/**
 * The long ✓/✗ feature matrix, extracted from the two landing pages and
 * parameterised by track. Renders one header row (the tier names) followed by the
 * grouped comparison rows. Purely presentational — it carries no prices of its
 * own; the `/pricing` header cards above it own the money.
 */
export function PricingComparisonTable({
  groups,
  columns,
  tone = "light",
}: PricingComparisonTableProps) {
  const dark = tone === "dark";
  // One label column (wider) plus one equal column per tier.
  const gridTemplateColumns = `minmax(0,1.6fr) repeat(${columns.length}, minmax(0,1fr))`;

  return (
    <div
      className={cn(
        "rounded-2xl border overflow-x-auto",
        dark ? "border-white/15 bg-white" : "border-border bg-white"
      )}
    >
      <div className="min-w-[520px]">
        <div
          className={cn("grid gap-0", dark ? "bg-secondary" : "bg-secondary")}
          style={{ gridTemplateColumns }}
        >
          <div className="p-4" />
          {columns.map((col) => (
            <div key={col.key} className="p-4 text-center border-l border-border">
              <p className="font-semibold text-sm text-gray-900">{col.label}</p>
            </div>
          ))}
        </div>
        {groups.map((group) => (
          <div key={group.category}>
            <div
              className="px-4 py-2.5 border-t border-border"
              style={{ background: `${group.color}08` }}
            >
              <p
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: group.color }}
              >
                {group.category}
              </p>
            </div>
            {group.items.map((item) => (
              <div
                key={item.name}
                className="grid border-t border-border hover:bg-secondary transition-colors"
                style={{ gridTemplateColumns }}
              >
                <div className="p-3.5 text-sm text-gray-700">{item.name}</div>
                {columns.map((col) => (
                  <div
                    key={col.key}
                    className="p-3.5 flex items-center justify-center border-l border-border"
                  >
                    {item[col.key] ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <X className="w-4 h-4 text-gray-300" />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
