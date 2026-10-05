"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/animations";
import { hasAccess } from "@/lib/utils";
import { FOR_PRO_ACCESS, UPGRADE_TO_ACCESS } from "@/data/pricing-shared";
import { SALES_PLAN_HREF } from "@/lib/pricing-routes";
import {
  formatBriefCardDate,
  groupBriefsByMonthYear,
  type IntelligenceBrief,
  type MarketNudgeItem,
  type SalesMarketNudgesContent,
} from "@/data/sales-market-nudges";
import { LinkToAccountDropdown } from "@/components/dashboard/link-to-account-dropdown";
import { cn } from "@/lib/utils";
import {
  BOOKMARK_HIGHLIGHT_RING,
  marketNudgeElementId,
} from "@/lib/bookmark-navigation";
import { useBookmarkHighlight } from "@/hooks/use-bookmark-highlight";
import {
  MEMBER_NUDGE_STATUS_LABELS,
  MEMBER_NUDGE_STATUSES,
  type MemberNudgeStatus,
} from "@/lib/sales-nudge-member-status";
import type { NudgeLifecycleStatus } from "@/data/sales-market-nudges";
const ROYAL = "#1a4fd6";
const CTA_BLUE = "#3280ff";

function matchesMemberStatusFilter(
  status: NudgeLifecycleStatus | undefined,
  filter: MemberNudgeStatus
): boolean {
  const value = status ?? "active";
  if (filter === "ACTIVE") return value === "active";
  if (filter === "EXPIRED") return value === "expired";
  return value === "archive";
}

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
        ? "bg-[#065F46]/10 text-[#065F46]"
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

function ChipFilterBar({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: string; label: string; count?: number }[];
  value: string;
  onChange: (value: string) => void;
}) {
  if (options.length === 0) return null;
  return (
    <nav aria-label={label} className="flex flex-wrap gap-2">
      <p className="sr-only">{label}</p>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
            value === option.id
              ? "bg-[#065F46]/10 text-[#065F46]"
              : "bg-secondary text-muted-fg hover:bg-secondary/80 hover:text-gray-900"
          )}
        >
          {option.label}
          {typeof option.count === "number" && (
            <span className="ml-1 opacity-70">({option.count})</span>
          )}
        </button>
      ))}
    </nav>
  );
}

function IntelligenceBriefCard({
  brief,
  showLinkToAccount = false,
  highlighted = false,
}: {
  brief: IntelligenceBrief;
  showLinkToAccount?: boolean;
  highlighted?: boolean;
}) {
  const updated = formatBriefCardDate(brief);
  return (
    <article
      id={marketNudgeElementId(brief.id)}
      className={cn(
        "rounded-xl border border-border bg-white p-5 sm:p-6 shadow-sm flex flex-col h-full scroll-mt-28",
        highlighted && BOOKMARK_HIGHLIGHT_RING
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#065F46] mb-1">
            {brief.category}
          </p>
          <h3 className="font-semibold text-base text-[#065F46]">{brief.title}</h3>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          {updated && <span className="text-[11px] text-muted-fg">{updated}</span>}
        </div>
      </div>
      <p className="text-sm text-muted-fg leading-relaxed mb-4 flex-1">{brief.description}</p>
      <div className="pt-3 border-t border-border/60 space-y-3">
        <div>
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
        {showLinkToAccount && (
          <LinkToAccountDropdown
            sourceType="MARKET_NUDGE"
            sourceId={brief.id}
            sourceTitle={brief.title}
            variant="compact"
          />
        )}
      </div>
    </article>
  );
}

function getNudgeBookmarkTitle(nudge: MarketNudgeItem) {
  const trimmed = nudge.title.trim() || nudge.whyNow.trim();
  const dashSplit = trimmed.split(" — ")[0]?.trim();
  return dashSplit || trimmed;
}

function AccountIntelligenceBanner({ userTier }: { userTier: string }) {
  const hasElite = hasAccess(userTier, "ELITE");
  const href = hasElite ? "/dashboard/account-intelligence" : SALES_PLAN_HREF("elite");
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
  const hasElite = hasAccess(userTier, "ELITE");
  const [monthYearFilter, setMonthYearFilter] = useState("");
  const { highlightId, isHighlighted } = useBookmarkHighlight(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<MemberNudgeStatus>("ACTIVE");

  const categories = content.briefCategories?.length
    ? content.briefCategories
    : [...new Set(content.intelligenceBriefs.map((b) => b.category).filter(Boolean))];

  const briefsForFilters = content.intelligenceBriefs.filter(
    (brief) =>
      matchesMemberStatusFilter(brief.status, statusFilter) &&
      (categoryFilter === "all" || brief.category === categoryFilter)
  );
  const briefGroups = useMemo(
    () => groupBriefsByMonthYear(briefsForFilters),
    [briefsForFilters]
  );

  useEffect(() => {
    if (!briefGroups.some((g) => g.label === monthYearFilter)) {
      setMonthYearFilter(briefGroups[0]?.label ?? "");
    }
  }, [briefGroups, monthYearFilter]);

  useEffect(() => {
    if (!highlightId?.startsWith("market-nudge-")) return;

    const sourceId = highlightId.slice("market-nudge-".length);
    const inWeekly = content.weeklyNudges.some((nudge) => nudge.id === sourceId);
    if (inWeekly) return;

    const group = briefGroups.find((g) => g.briefs.some((brief) => brief.id === sourceId));
    if (group && monthYearFilter !== group.label) {
      setMonthYearFilter(group.label);
    }
  }, [highlightId, content.weeklyNudges, briefGroups, monthYearFilter]);

  const activeBriefs =
    briefGroups.find((g) => g.label === monthYearFilter)?.briefs ??
    briefGroups[0]?.briefs ??
    [];

  const visibleWeeklyNudges = content.weeklyNudges.filter((nudge) =>
    matchesMemberStatusFilter(nudge.status, statusFilter)
  );

  if (!unlocked) {
    return (
      <Reveal>
        <div className="relative rounded-xl border border-border bg-white overflow-hidden">
          <div className="blur-sm pointer-events-none select-none p-6 space-y-6" aria-hidden>
            <div className="rounded-xl p-6 text-white bg-[#065F46]">
              <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">
                This Week — Talking Points
              </p>
              <p className="text-sm">{content.weeklyNudges[0]?.title}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {content.intelligenceBriefs.slice(0, 2).map((brief) => (
                <IntelligenceBriefCard key={brief.id} brief={brief} />
              ))}
            </div>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm px-6 text-center py-10">
            <Lock className="w-5 h-5 text-muted-fg mb-2" />
            <p className="text-sm font-semibold text-gray-700 mb-4">{FOR_PRO_ACCESS}</p>
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
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#065F46]">
          {content.eyebrow}
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900">{content.title}</h1>
        <p className="text-sm text-muted-fg max-w-2xl leading-relaxed">{content.description}</p>
        <ChipFilterBar
          label="Filter talking points by status"
          value={statusFilter}
          onChange={(value) => setStatusFilter(value as MemberNudgeStatus)}
          options={MEMBER_NUDGE_STATUSES.map((status) => ({
            id: status,
            label: MEMBER_NUDGE_STATUS_LABELS[status],
          }))}
        />
      </header>

      {statusFilter === "ACTIVE" && (
      <section
        className="rounded-xl border border-border bg-white p-5 sm:p-6 space-y-4"
        aria-labelledby="weekly-nudges-heading"
      >
        <h2
          id="weekly-nudges-heading"
          className="text-xs font-bold uppercase tracking-widest text-[#065F46]"
        >
          ⚡ {content.weeklyHeading}
        </h2>
        <ul className="space-y-4">
          {visibleWeeklyNudges.length === 0 ? (
            <li className="text-sm text-muted-fg">
              No {MEMBER_NUDGE_STATUS_LABELS[statusFilter].toLowerCase()} nudges.
            </li>
          ) : (
            visibleWeeklyNudges.map((nudge) => (
            <li
              key={nudge.id}
              id={marketNudgeElementId(nudge.id)}
              className={cn(
                "rounded-lg border border-border bg-white p-4 space-y-3 scroll-mt-28",
                isHighlighted(marketNudgeElementId(nudge.id)) && BOOKMARK_HIGHLIGHT_RING
              )}
            >
              {nudge.title.trim() !== "" && (
                <p className="text-sm font-semibold text-gray-900">{nudge.title}</p>
              )}
              <ul className="space-y-2">
                {nudge.whyNow.trim() !== "" && (
                  <li className="flex gap-2 text-sm leading-relaxed">
                    <span className="font-semibold text-[#065F46] shrink-0">Now</span>
                    <span className="text-gray-600">— {nudge.whyNow}</span>
                  </li>
                )}
                {nudge.accountAction.trim() !== "" && (
                  <li className="flex gap-2 text-sm leading-relaxed">
                    <span className="font-semibold text-[#065F46] shrink-0">Action</span>
                    <span className="text-gray-600">— {nudge.accountAction}</span>
                  </li>
                )}
                {nudge.accountNames.length > 0 && (
                  <li className="flex gap-2 text-sm leading-relaxed">
                    {/* Blue, unlike the green Now/Action labels — the account
                        list is the part a seller acts on. */}
                    <span className="font-semibold text-primary-600 shrink-0">Target</span>
                    <span className="text-gray-600">— {nudge.accountNames.join(", ")}</span>
                  </li>
                )}
              </ul>
              {hasElite && (
                <div className="pt-1">
                  <LinkToAccountDropdown
                    sourceType="MARKET_NUDGE"
                    sourceId={nudge.id}
                    sourceTitle={getNudgeBookmarkTitle(nudge)}
                    variant="default"
                    className="shrink-0 sm:min-w-[200px]"
                  />
                </div>
              )}
            </li>
            ))
          )}
        </ul>
      </section>
      )}

      <section
        className="rounded-xl border border-border bg-white p-5 sm:p-6"
        aria-labelledby="intelligence-briefs-heading"
      >
        <h2
          id="intelligence-briefs-heading"
          className="text-sm font-semibold text-gray-900 mb-4"
        >
          📄 {content.briefsHeading}
        </h2>
        <div className="mb-5">
          <ChipFilterBar
            label="Filter briefs by category"
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={[
              { id: "all", label: "All" },
              ...categories.map((category) => ({
                id: category,
                label: category,
                count: content.intelligenceBriefs.filter((b) => b.category === category).length,
              })),
            ]}
          />
        </div>

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
            className="hidden lg:block lg:w-44 shrink-0 lg:sticky lg:top-24 lg:self-start rounded-xl border border-teal-100 bg-teal-50/40 p-3"
          />

          <div className="flex-1 min-w-0">
            {activeBriefs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeBriefs.map((brief, i) => (
                  <Reveal key={brief.id} delay={i * 0.03}>
                    <IntelligenceBriefCard
                      brief={brief}
                      showLinkToAccount={hasElite}
                      highlighted={isHighlighted(marketNudgeElementId(brief.id))}
                    />
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
