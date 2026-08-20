"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bookmark, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/animations";
import { hasAccess } from "@/lib/utils";
import { UPGRADE_TO_ACCESS } from "@/data/pricing-shared";
import { SALES_PLAN_HREF } from "@/lib/pricing-routes";
import {
  groupBriefsByMonthYear,
  type IntelligenceBrief,
  type MarketNudgeItem,
  type SalesMarketNudgesContent,
} from "@/data/sales-market-nudges";
import { cn } from "@/lib/utils";

const FOREST = "#1a3d36";
const ROYAL = "#1a4fd6";
const CTA_BLUE = "#3280ff";

function MonthYearFilterBar({
  groups,
  value,
  onChange,
  className,
  orientation = "vertical",
}: {
  groups: { label: string; briefs: IntelligenceBrief[] }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  orientation?: "vertical" | "horizontal";
}) {
  if (groups.length === 0) return null;

  const buttonClass = (active: boolean) =>
    cn(
      "rounded-lg text-left text-xs font-medium transition-colors",
      orientation === "vertical" ? "w-full px-3 py-2" : "shrink-0 px-3 py-1.5",
      active
        ? "bg-[#1a3d36]/10 text-[#1a3d36]"
        : "text-muted-fg hover:bg-secondary hover:text-gray-900"
    );

  return (
    <nav
      aria-label="Filter briefs by month"
      className={cn(
        orientation === "vertical" ? "space-y-1" : "flex gap-2 overflow-x-auto pb-1",
        className
      )}
    >
      <p
        className={cn(
          "text-[10px] font-bold uppercase tracking-widest text-muted-fg",
          orientation === "horizontal" ? "sr-only" : "mb-2 px-1"
        )}
      >
        Filter by date
      </p>
      {groups.map((group) => (
        <button
          key={group.label}
          type="button"
          onClick={() => onChange(group.label)}
          className={buttonClass(value === group.label)}
        >
          {group.label}
          <span className="ml-1 text-[10px] font-normal opacity-70">({group.briefs.length})</span>
        </button>
      ))}
    </nav>
  );
}

function NudgeText({ nudge }: { nudge: MarketNudgeItem }) {
  const { text, accountNames } = nudge;
  if (accountNames.length === 0) {
    return <span>{text}</span>;
  }

  const trimmed = text.trimEnd();
  const endsWithOpenParen = trimmed.endsWith("(");
  const endsWithTo = /\bto$/.test(trimmed);

  return (
    <span>
      {text}
      {!endsWithOpenParen && !endsWithTo && " ("}
      {endsWithTo && " "}
      {accountNames.map((name, i) => (
        <React.Fragment key={name}>
          {i > 0 && ", "}
          <strong className="font-semibold text-white">{name}</strong>
        </React.Fragment>
      ))}
      {endsWithOpenParen && ")"}
      {!endsWithOpenParen && !endsWithTo && ")"}
      {!trimmed.endsWith(".") && "."}
    </span>
  );
}

function IntelligenceBriefCard({ brief }: { brief: IntelligenceBrief }) {
  return (
    <article className="rounded-xl border border-border bg-white p-5 sm:p-6 shadow-sm flex flex-col h-full">
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-semibold text-base" style={{ color: FOREST }}>
          {brief.title}
        </h3>
        {brief.updatedLabel && (
          <span className="text-[11px] text-muted-fg shrink-0">{brief.updatedLabel}</span>
        )}
      </div>
      <p className="text-sm text-muted-fg leading-relaxed mb-4 flex-1">{brief.description}</p>
      <div className="pt-3 border-t border-border/60">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-fg mb-2">
          Discovery Questions
        </p>
        <ul className="space-y-1.5">
          {brief.discoveryQuestions.map((question) => (
            <li key={question} className="flex gap-2 text-sm text-muted-fg leading-relaxed">
              <span className="text-gray-400 shrink-0">—</span>
              <span>{question}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

function AccountIntelligenceBanner({ userTier }: { userTier: string }) {
  const hasElite = hasAccess(userTier, "ELITE");
  const href = hasElite ? "/dashboard" : SALES_PLAN_HREF("elite");
  const buttonLabel = hasElite ? "Open Account Intelligence" : "Unlock Account Intelligence";

  return (
    <div
      className="rounded-xl px-6 py-5 sm:px-8 sm:py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5"
      style={{ backgroundColor: ROYAL }}
    >
      <div className="space-y-1.5 min-w-0">
        <h2 className="text-base sm:text-lg font-bold text-white leading-snug">
          Link the Market Nudges to an Account?
        </h2>
        <p className="text-sm text-white/90 max-w-xl leading-relaxed">
          Attach a saved Market Nudge to any account you&apos;re tracking — so it&apos;s ready right
          where you need it.
        </p>
      </div>
      <Link href={href} className="shrink-0 self-start sm:self-center">
        <Button
          size="sm"
          className="text-white border-0 rounded-lg h-10 px-5 text-sm font-semibold hover:opacity-90"
          style={{ backgroundColor: CTA_BLUE }}
        >
          {buttonLabel} →
        </Button>
      </Link>
    </div>
  );
}

export function SalesMarketNudgesSection({
  content,
  userTier,
  requiredTier = "PRO",
}: {
  content: SalesMarketNudgesContent;
  userTier: string;
  requiredTier?: "PRO" | "ELITE";
}) {
  const unlocked = hasAccess(userTier, requiredTier);
  const briefGroups = useMemo(
    () => groupBriefsByMonthYear(content.intelligenceBriefs),
    [content.intelligenceBriefs]
  );
  const [monthYearFilter, setMonthYearFilter] = useState<string>(
    briefGroups[0]?.label ?? ""
  );

  useEffect(() => {
    if (!briefGroups.some((g) => g.label === monthYearFilter)) {
      setMonthYearFilter(briefGroups[0]?.label ?? "");
    }
  }, [briefGroups, monthYearFilter]);

  const activeBriefs =
    briefGroups.find((g) => g.label === monthYearFilter)?.briefs ??
    briefGroups[0]?.briefs ??
    [];

  if (!unlocked) {
    return (
      <Reveal>
        <div className="relative rounded-xl border border-border bg-white overflow-hidden">
          <div className="blur-sm pointer-events-none select-none p-6 space-y-6" aria-hidden>
            <div className="rounded-xl p-6 text-white" style={{ backgroundColor: FOREST }}>
              <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">
                This Week — Market Nudges
              </p>
              <p className="text-sm">{content.weeklyNudges[0]?.text}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {content.intelligenceBriefs.slice(0, 2).map((brief) => (
                <IntelligenceBriefCard key={brief.id} brief={brief} />
              ))}
            </div>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm px-6 text-center py-10">
            <Lock className="w-5 h-5 text-muted-fg mb-2" />
            <p className="text-sm font-semibold text-gray-700 mb-1">Pro Pack required</p>
            <p className="text-xs text-muted-fg mb-4 max-w-xs">
              Weekly market nudges and intelligence briefs unlock with Pro.
            </p>
            <Link href={SALES_PLAN_HREF("pro")}>
              <Button size="sm">{UPGRADE_TO_ACCESS}</Button>
            </Link>
          </div>
        </div>
      </Reveal>
    );
  }

  return (
    <Reveal className="space-y-8">
      <header className="space-y-4">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: FOREST }}>
          {content.eyebrow}
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900">{content.title}</h1>
        <p className="text-sm text-muted-fg max-w-2xl leading-relaxed">{content.description}</p>
      </header>

      <section
        className="rounded-xl p-5 sm:p-6 space-y-4"
        style={{ backgroundColor: FOREST }}
        aria-labelledby="weekly-nudges-heading"
      >
        <h2
          id="weekly-nudges-heading"
          className="text-xs font-bold uppercase tracking-widest text-white/90"
        >
          ⚡ This Week — Market Nudges
        </h2>
        <ul className="space-y-4">
          {content.weeklyNudges.map((nudge) => (
            <li
              key={nudge.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg bg-white/10 px-4 py-3"
            >
              <p className="text-sm text-white/95 leading-relaxed flex-1">
                <NudgeText nudge={nudge} />
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white gap-1.5"
              >
                <Bookmark className="w-3.5 h-3.5" />
                Bookmark under account
              </Button>
            </li>
          ))}
        </ul>
      </section>

      <section
        className="rounded-xl border border-border bg-white p-5 sm:p-6"
        aria-labelledby="intelligence-briefs-heading"
      >
        <h2
          id="intelligence-briefs-heading"
          className="text-sm font-semibold text-gray-900 mb-5"
        >
          📄 Intelligence Briefs
        </h2>

        <MonthYearFilterBar
          groups={briefGroups}
          value={monthYearFilter}
          onChange={setMonthYearFilter}
          orientation="horizontal"
          className="lg:hidden -mx-1 px-1 mb-5"
        />

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          <MonthYearFilterBar
            groups={briefGroups}
            value={monthYearFilter}
            onChange={setMonthYearFilter}
            orientation="vertical"
            className="hidden lg:block lg:w-44 shrink-0 lg:sticky lg:top-24 lg:self-start rounded-xl border border-emerald-100 bg-emerald-50/40 p-3"
          />

          <div className="flex-1 min-w-0">
            {activeBriefs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeBriefs.map((brief, i) => (
                  <Reveal key={brief.id} delay={i * 0.03}>
                    <IntelligenceBriefCard brief={brief} />
                  </Reveal>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-fg">No briefs for this period.</p>
            )}
          </div>
        </div>
      </section>

      <AccountIntelligenceBanner userTier={userTier} />
    </Reveal>
  );
}
