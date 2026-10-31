"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/animations";
import { hasAccess } from "@/lib/utils";
import { FOR_PRO_ACCESS, UPGRADE_TO_ACCESS } from "@/data/pricing-shared";
import { SALES_PLAN_HREF } from "@/lib/pricing-routes";
import {
  formatBriefCardDate,
  groupBriefsByMonthYear,
  hasStructuredDiscovery,
  visibleDiscoveryRows,
  type DiscoveryPoint,
  type IntelligenceBrief,
  type MarketNudgeItem,
  type SalesMarketNudgesContent,
} from "@/data/sales-market-nudges";
import { LinkToAccountDropdown } from "@/components/dashboard/link-to-account-dropdown";
import { cn } from "@/lib/utils";
import { renderInlineBold } from "@/lib/inline-bold";
import { renderMultilineText } from "@/lib/multiline-text";
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

/**
 * Status tab for the Talking Points section.
 *
 * Deliberately separate from the weekly-nudge tabs: an expired or archived brief
 * must stay reachable inside its month folder (owner request, Frances), so the
 * briefs default to `"all"` while the weekly nudges keep defaulting to Active.
 * `"all"` is the sentinel the category chip bar above already uses.
 */
type BriefStatusFilter = MemberNudgeStatus | "all";

function matchesMemberStatusFilter(
  status: NudgeLifecycleStatus | undefined,
  filter: BriefStatusFilter
): boolean {
  const value = status ?? "active";
  if (filter === "all") return true;
  if (filter === "ACTIVE") return value === "active";
  if (filter === "EXPIRED") return value === "expired";
  return value === "archive";
}

/**
 * Featured-first order inside a month folder: Active, then Expired, then Archive.
 *
 * Used as a stable sort key over the already-filtered list, so briefs that share a
 * status keep the order the CMS delivered them in — this only lifts Active rows to
 * the top, it never reshuffles within a status group.
 */
const BRIEF_STATUS_ORDER: Record<NudgeLifecycleStatus, number> = {
  active: 0,
  expired: 1,
  archive: 2,
};

/**
 * Pill styling for the brief status badge — subtle, but readable next to the date.
 *
 * The `active` entry is never rendered (see {@link briefStatusPillLabel}, which returns
 * `null` for featured rows); it exists so the record stays exhaustive over the
 * lifecycle and a future status cannot be added without a colour.
 */
const BRIEF_STATUS_PILL_CLASS: Record<NudgeLifecycleStatus, string> = {
  active: "bg-emerald-100 text-emerald-700",
  expired: "bg-amber-100 text-amber-700",
  archive: "bg-slate-100 text-slate-600",
};

/**
 * Label for the status pill on a collapsed brief header.
 *
 * `null` for Active: those are the featured rows, so they need no badge — the
 * absence of a pill is what marks a brief as current. The label text comes from
 * `MEMBER_NUDGE_STATUS_LABELS` so it cannot drift from the filter chips.
 */
function briefStatusPillLabel(status: NudgeLifecycleStatus | undefined): string | null {
  if (status === "expired") return MEMBER_NUDGE_STATUS_LABELS.EXPIRED;
  if (status === "archive") return MEMBER_NUDGE_STATUS_LABELS.ARCHIVED;
  return null;
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

/**
 * Ask / Listen for / Offer table on a brief card.
 *
 * Only used when at least one row carries a Listen-for or Offer cell. A brief
 * whose rows are questions only keeps the original bulleted list, so briefs
 * authored before the table existed render exactly as they did.
 */
function DiscoveryTable({ rows }: { rows: DiscoveryPoint[] }) {
  const headClass =
    "pb-1.5 text-[10px] font-bold uppercase tracking-wide text-gray-700";
  return (
    <table className="w-full table-fixed border-collapse text-left">
      <thead>
        <tr>
          <th scope="col" className={cn(headClass, "w-[38%] pr-3")}>
            Ask
          </th>
          <th scope="col" className={cn(headClass, "w-[27%] pr-3")}>
            Listen for
          </th>
          <th scope="col" className={cn(headClass, "w-[35%]")}>
            Offer
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="border-t border-border/60 align-top">
            <td className="py-2 pr-3 text-sm text-muted-fg leading-relaxed">
              {renderInlineBold(row.ask)}
            </td>
            <td className="py-2 pr-3 text-sm text-muted-fg leading-relaxed">
              {renderInlineBold(row.listenFor)}
            </td>
            <td className="py-2 text-sm text-muted-fg leading-relaxed">
              {renderInlineBold(row.offer)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * One Talking Point, rendered as a collapsed accordion row (owner request, Frances).
 *
 * Native `<details>` / `<summary>` rather than React state: no hydration concerns,
 * keyboard toggling for free, and the browser owns the open/closed state. Collapsed
 * by default so a month folder reads as a tidy, scannable list of
 * `CATEGORY / title / date` rows instead of a wall of cards at wildly different
 * heights — the reader picks a point to read instead of scrolling past all of them.
 *
 * `open={highlighted || undefined}` is the bookmark deep-link safety net: a
 * `?highlight=market-nudge-<id>` jump would otherwise land the reader on a closed
 * row. The highlight is transient (the hook clears it after a few seconds), so React
 * owning the attribute for that window is fine — once it flips back to `undefined`
 * the element is fully uncontrolled again and the reader can toggle it freely.
 */
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
  const discoveryRows = visibleDiscoveryRows(brief.discoveryQuestions);
  const status = brief.status ?? "active";
  // "Featured" = Active. Expired / archive briefs stay inside their month folder
  // (see `briefStatusFilter`) but recede visually and carry a status pill.
  const isFeatured = status === "active";
  const statusLabel = briefStatusPillLabel(status);

  return (
    <article
      id={marketNudgeElementId(brief.id)}
      className={cn(
        "rounded-xl border border-border bg-white shadow-sm scroll-mt-28",
        highlighted && BOOKMARK_HIGHLIGHT_RING
      )}
    >
      <details className="group" open={highlighted || undefined}>
        <summary
          className={cn(
            "flex items-start justify-between gap-3 rounded-xl p-4 sm:px-5 sm:py-4 cursor-pointer list-none transition-colors",
            "hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#065F46]/30",
            "[&::-webkit-details-marker]:hidden",
            !isFeatured && "opacity-75"
          )}
        >
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#065F46] mb-1">
              {brief.category}
            </p>
            <h3
              className={cn(
                "font-semibold text-base",
                isFeatured ? "text-[#065F46]" : "text-gray-500"
              )}
            >
              {brief.title}
            </h3>
          </div>
          <div className="flex items-center gap-2 shrink-0 pt-0.5">
            {statusLabel && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                  BRIEF_STATUS_PILL_CLASS[status]
                )}
              >
                {statusLabel}
              </span>
            )}
            {updated && <span className="text-[11px] text-muted-fg">{updated}</span>}
            <ChevronDown
              aria-hidden
              className="w-4 h-4 shrink-0 text-muted-fg transition-transform duration-200 group-open:rotate-180"
            />
          </div>
        </summary>
        <div className="px-4 pb-4 sm:px-5 sm:pb-5">
          <p className="text-sm text-muted-fg leading-relaxed mb-4">
            {renderInlineBold(brief.description)}
          </p>
          <div className="pt-3 border-t border-border/60 space-y-3">
            {discoveryRows.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-fg mb-2">
                  Discovery Questions
                </p>
                {hasStructuredDiscovery(discoveryRows) ? (
                  <DiscoveryTable rows={discoveryRows} />
                ) : (
                  <ul className="space-y-1.5">
                    {discoveryRows.map((row, i) => (
                      <li key={i} className="flex gap-2 text-sm text-muted-fg leading-relaxed">
                        <span className="text-gray-400 shrink-0">—</span>
                        <span>{renderInlineBold(row.ask)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {showLinkToAccount && (
              <LinkToAccountDropdown
                sourceType="MARKET_NUDGE"
                sourceId={brief.id}
                sourceTitle={brief.title}
                variant="compact"
              />
            )}
          </div>
        </div>
      </details>
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
  // Weekly nudges only — the header chips keep their original Active-by-default tab.
  const [statusFilter, setStatusFilter] = useState<MemberNudgeStatus>("ACTIVE");
  // Talking Points have their own tabs, defaulting to "all" so an expired or archived
  // brief never disappears from its month folder (owner request, Frances).
  const [briefStatusFilter, setBriefStatusFilter] = useState<BriefStatusFilter>("all");

  const categories = content.briefCategories?.length
    ? content.briefCategories
    : [...new Set(content.intelligenceBriefs.map((b) => b.category).filter(Boolean))];

  // Active first, then Expired, then Archive, so the featured briefs lead each month
  // folder. `sort` is stable, so rows that share a status keep the CMS order; the
  // array is the result of `filter`, so sorting it cannot mutate `content`.
  const briefsForFilters = content.intelligenceBriefs
    .filter(
      (brief) =>
        matchesMemberStatusFilter(brief.status, briefStatusFilter) &&
        (categoryFilter === "all" || brief.category === categoryFilter)
    )
    .sort(
      (a, b) =>
        BRIEF_STATUS_ORDER[a.status ?? "active"] - BRIEF_STATUS_ORDER[b.status ?? "active"]
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

  // Briefs in the selected month folder, already ordered Active → Expired → Archive.
  const monthBriefs =
    briefGroups.find((g) => g.label === monthYearFilter)?.briefs ??
    briefGroups[0]?.briefs ??
    [];

  const visibleWeeklyNudges = content.weeklyNudges.filter((nudge) =>
    matchesMemberStatusFilter(nudge.status, statusFilter)
  );

  /**
   * The page heading renders OUTSIDE the access gate. The locked branch returns
   * early, so keeping the <h1> inside the unlocked branch left a Starter member
   * with a page that had no top-level heading at all — the same defect that was
   * fixed in `prep-library-section.tsx`. The lock card still gates the content.
   */
  const pageHeading = (
    <>
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#065F46]">
        {content.eyebrow}
      </p>
      <h1 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900">{content.title}</h1>
      <p className="text-sm text-muted-fg max-w-2xl leading-relaxed">
        {renderInlineBold(content.description)}
      </p>
    </>
  );

  if (!unlocked) {
    return (
      <Reveal className="space-y-8">
        <header className="space-y-4">{pageHeading}</header>
        <div className="relative rounded-xl border border-border bg-white overflow-hidden">
          <div className="blur-sm pointer-events-none select-none p-6 space-y-6" aria-hidden>
            <div className="rounded-xl p-6 text-white bg-[#065F46]">
              <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">
                {content.weeklyHeading}
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
        {pageHeading}
        {/* These chips now scope the weekly nudges only. The briefs have their own
            status tabs inside the Talking Points section, because a brief must stay
            reachable under its month folder whatever its status. */}
        <ChipFilterBar
          label="Filter weekly nudges by status"
          value={statusFilter}
          onChange={(value) => setStatusFilter(value as MemberNudgeStatus)}
          options={MEMBER_NUDGE_STATUSES.map((status) => ({
            id: status,
            label: MEMBER_NUDGE_STATUS_LABELS[status],
          }))}
        />
      </header>

      {/* Not gated to the Active tab: an expired or archived weekly nudge must stay
          reachable under its matching tab, exactly like the briefs section below.
          `visibleWeeklyNudges` already carries the status filter, and the empty
          state names the selected status.

          The pale green tint is the only thing marking this section off from the
          white Talking Points section below (owner request, 15 Oct 2026). It sits
          on the container only — the nudge cards inside stay white, so the tint
          reads as a band rather than filling the section. */}
      <section
        className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 sm:p-6 space-y-4"
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
                      <span className="text-gray-600 shrink-0">—</span>
                      {/* Rendered through `renderMultilineText` so the line breaks and
                          `- ` bullets Frances types in the admin "Now" field survive to
                          the page. Render-time only — the stored string is untouched. */}
                      <div className="text-gray-600 min-w-0 space-y-2">
                        {renderMultilineText(nudge.whyNow)}
                      </div>
                    </li>
                  )}
                  {nudge.accountAction.trim() !== "" && (
                    <li className="flex gap-2 text-sm leading-relaxed">
                      <span className="font-semibold text-[#065F46] shrink-0">Action</span>
                      <span className="text-gray-600">— {renderInlineBold(nudge.accountAction)}</span>
                    </li>
                  )}
                  {nudge.accountNames.length > 0 && (
                    <li className="flex gap-2 text-sm leading-relaxed">
                      {/* The whole Target row is blue — label *and* wording — where
                          Now/Action keep a green label with a grey value. Frances
                          asked for the entire target line in blue so it reads as
                          the part a seller acts on. */}
                      <span className="font-semibold text-primary-600 shrink-0">Target</span>
                      <span className="text-primary-600">— {nudge.accountNames.join(", ")}</span>
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
        <div className="mb-5 space-y-3">
          {/* Brief status tabs. `All` is the default so every brief stays reachable
              inside its month folder; Active is still the featured set (see the card
              below, where expired/archive rows recede and carry a status pill). */}
          <ChipFilterBar
            label="Filter briefs by status"
            value={briefStatusFilter}
            onChange={(value) => setBriefStatusFilter(value as BriefStatusFilter)}
            options={[
              { id: "all", label: "All", count: content.intelligenceBriefs.length },
              ...MEMBER_NUDGE_STATUSES.map((status) => ({
                id: status,
                label: MEMBER_NUDGE_STATUS_LABELS[status],
                count: content.intelligenceBriefs.filter((b) =>
                  matchesMemberStatusFilter(b.status, status)
                ).length,
              })),
            ]}
          />
          <ChipFilterBar
            label="Filter briefs by category"
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={[
              { id: "all", label: "All" },
              ...categories.map((category) => ({
                id: category,
                label: category,
                // Count only briefs the selected status tab actually shows — an
                // expired/archived brief must not inflate the Active tab's chips.
                count: content.intelligenceBriefs.filter(
                  (b) =>
                    b.category === category &&
                    matchesMemberStatusFilter(b.status, briefStatusFilter)
                ).length,
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
            {monthBriefs.length > 0 ? (
              /* Single-column list, not a grid: each brief is a collapsed accordion
                 row, so the reader scans `CATEGORY / title / date` and opens only the
                 one they want (owner request, Frances). */
              <div className="space-y-2">
                {monthBriefs.map((brief, i) => (
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
