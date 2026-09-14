"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BookOpen, Map, FileText, MessageSquare, BarChart3, Briefcase,
  Users, Lock, ArrowRight, TrendingUp, Award, ChevronRight,
  CheckCircle, Shield, ExternalLink, Compass, NotebookPen, ScrollText,
  Calendar, Inbox, Clock, Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnimatedProgress, Reveal, StaggerChildren, StaggerItem } from "@/components/animations";
import { TIER_LABELS, hasAccess, formatDate } from "@/lib/utils";
import { resolveMemberPersonaLabel } from "@/lib/persona-display";
import { UPGRADE_TO_ACCESS } from "@/data/pricing-shared";
import { CAREER_PLAN_HREF, SALES_PLAN_HREF } from "@/lib/pricing-routes";
import type { NavigationGuideAttachment } from "@/lib/content/accessors";
import {
  DEFAULT_DASHBOARD_RESOURCE_CARDS,
  DEFAULT_MEMBER_DASHBOARD_CONTENT,
  type DashboardSalesResourceCardCopy,
  type MemberDashboardContent,
} from "@/data/member-dashboard";
import {
  dashboardAudienceFromPreview,
  filterByDashboardAudience,
  isDashboardCardAccessible,
  isDashboardModuleVisible,
  partitionAccessibleFirst,
  shouldShowTrackBadge,
} from "@/lib/dashboard-module-visibility";
import type { StarterInfographic } from "@/data/starter-pack";
import type { SalesDashboardDeliverables } from "@/lib/content/sales-dashboard-deliverables";
import type { ContentStats } from "@/lib/content/content-stats";
import {
  isDashboardFileReady,
  resolveDashboardFileDownloadHref,
  type DashboardDeliverableKey,
} from "@/lib/dashboard-file-deliverables";
import {
  formatMentorCreditsUsedLabel,
  type MentorCreditUsage,
} from "@/lib/mentor-credits";
import { PrepLibraryCard, PREP_LIBRARY_COUNT_EVENT } from "@/components/dashboard/prep-library-section";
import { ModuleTrackBadge, type ModuleTrack } from "@/components/dashboard/module-track-badge";

interface Props {
  contentTiers?: Record<string, string>;
  navigationGuides?: {
    career: NavigationGuideAttachment | null;
    sales: NavigationGuideAttachment | null;
  };
  dashboardContent?: MemberDashboardContent;
  contentStats: Pick<ContentStats, "chapterCount">;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    tier: string;
    track: string;
    persona: string | null;
    resumePersonaDone: boolean;
    mentorCredits: number;
    resumeCredits: number;
    stripeCurrentPeriodEnd?: string;
  };
  stats: {
    completedChapters: number;
    progressPct: number;
    mentorQuestions: number;
  };
  mentorCreditUsage?: MentorCreditUsage | null;
  salesDeliverables?: SalesDashboardDeliverables;
  isAdmin?: boolean;
  isMentorUser?: boolean;
  previewTrack?: string;
  previewTier?: string;
  mentorStats?: {
    dateJoined: string;
    totalRequests: number;
    answered: number;
    pending: number;
  } | null;
  starterPackInfographics?: StarterInfographic[];
  starterPackAssetUrls?: Record<string, string>;
}

const CONTENT_CARDS = [
  {
    slug: "playbook",
    icon: BookOpen,
    title: "Full Playbook",
    href: "/playbook",
    requiredTier: "PRO",
    color: "#3280ff",
    track: "Both",
  },
  {
    slug: "career-intelligence-brief",
    icon: Mail,
    title: "Career Intelligence Brief",
    requiredTier: "PRO",
    color: "#3280ff",
    track: "Career",
    cardKind: "email-digest" as const,
  },
  {
    slug: "resume-templates",
    icon: FileText,
    title: "Resume Templates",
    href: "/resume-templates",
    requiredTier: "PRO",
    color: "#3280ff",
    track: "Career",
  },
  {
    slug: "career-roadmap",
    icon: Map,
    title: "Career Roadmap",
    href: "/career-roadmap",
    requiredTier: "PRO",
    color: "#3280ff",
    track: "Career",
  },
  {
    slug: "career-navigation-guide",
    icon: Compass,
    title: "Career Navigation Guide",
    requiredTier: "PRO",
    color: "#3280ff",
    track: "Career",
    cardKind: "file" as const,
    deliverableKey: "careerNavigationGuide" as const,
  },
  {
    slug: "interview-questions",
    icon: BarChart3,
    title: "Interview Questions",
    href: "/interview-questions",
    requiredTier: "PRO",
    color: "#3280ff",
    track: "Career",
  },
  {
    slug: "knowledge-test",
    icon: TrendingUp,
    title: "Knowledge Test",
    href: "/knowledge-test",
    requiredTier: "PRO",
    color: "#3280ff",
    track: "Both",
  },
  {
    slug: "case-studies",
    icon: Briefcase,
    title: "Case Studies",
    href: "/case-studies",
    requiredTier: "ELITE",
    color: "#B45309",
    track: "Both",
  },
  {
    slug: "desk-channel",
    icon: MessageSquare,
    title: "Desk Channel",
    href: "/desk-channel",
    requiredTier: "ELITE",
    color: "#B45309",
    track: "Both",
  },
  {
    slug: "mentor-connect",
    icon: Users,
    title: "Mentor Connect",
    href: "/mentor-connect",
    requiredTier: "ELITE",
    color: "#B45309",
    track: "Both",
  },
  {
    slug: "job-openings",
    icon: Briefcase,
    title: "Job Openings",
    href: "/job-openings",
    requiredTier: "ELITE",
    color: "#B45309",
    track: "Both",
  },
] as const satisfies ReadonlyArray<{
  slug: string;
  icon: typeof BookOpen;
  title: string;
  href?: string;
  requiredTier: "PRO" | "ELITE";
  color: string;
  track: ModuleTrack;
  cardKind?: "page" | "file" | "email-digest";
  deliverableKey?: DashboardDeliverableKey;
}>;

const SALES_CARD_ICONS: Record<string, typeof FileText> = {
  "sales-market-nudges": ScrollText,
  "industry-guide-for-sales": BookOpen,
  "sales-prep-library": NotebookPen,
  "account-intelligence": Users,
};

const SALES_CARD_COLORS: Record<string, string> = {
  "sales-market-nudges": "#3280ff",
  "industry-guide-for-sales": "#3280ff",
  "sales-prep-library": "#3280ff",
  "account-intelligence": "#7c3aed",
};

const QUICK_LINKS = [
  { label: "Desk Glossary", href: "/glossary", free: true, track: "Both" as const },
  { label: "Chapter A Preview", href: "/playbook/a", free: true, track: "Both" as const },
  { label: "Job Board Waitlist", href: "/waitlist", free: true, track: "Both" as const },
];

const MEMBER_PREVIEW_OPTIONS = [
  { track: "career", tier: "starter", label: "Career · Starter" },
  { track: "career", tier: "pro", label: "Career · Pro" },
  { track: "career", tier: "elite", label: "Career · Elite" },
  { track: "sales", tier: "starter", label: "Sales · Starter" },
  { track: "sales", tier: "pro", label: "Sales · Pro" },
  { track: "sales", tier: "elite", label: "Sales · Elite" },
] as const;

function normalizePreviewTrack(value?: string) {
  const track = value?.toUpperCase();
  return track === "CAREER" || track === "SALES" ? track : null;
}

function normalizePreviewTier(value?: string) {
  const tier = value?.toUpperCase();
  return tier === "STARTER" || tier === "PRO" || tier === "ELITE" ? tier : null;
}

export function DashboardClient({
  contentTiers = {},
  navigationGuides = { career: null, sales: null },
  dashboardContent = DEFAULT_MEMBER_DASHBOARD_CONTENT,
  contentStats,
  user,
  stats,
  mentorCreditUsage = null,
  salesDeliverables = DEFAULT_MEMBER_DASHBOARD_CONTENT.salesDeliverables,
  isAdmin: isAdminUser = false,
  isMentorUser = false,
  previewTrack,
  previewTier,
  mentorStats = null,
  starterPackInfographics: _starterPackInfographics = [],
  starterPackAssetUrls: _starterPackAssetUrls = {},
}: Props) {
  const router = useRouter();
  const previewTrackValue = normalizePreviewTrack(previewTrack);
  const previewTierValue = normalizePreviewTier(previewTier);
  const isPreviewActive =
    isAdminUser &&
    !isMentorUser &&
    previewTrackValue !== null &&
    previewTierValue !== null;

  const effectiveTier = isPreviewActive ? previewTierValue : user.tier;
  const effectiveTrack = isPreviewActive ? previewTrackValue : user.track;

  const tierInfo = TIER_LABELS[effectiveTier] || TIER_LABELS.STARTER;
  const personaLabel = resolveMemberPersonaLabel(
    effectiveTrack,
    user.persona,
    user.resumePersonaDone
  );
  const greeting = user.name?.split(" ")[0] || "there";
  const isCareerTrack = effectiveTrack.toUpperCase() === "CAREER";
  const audience = dashboardAudienceFromPreview({
    isAdmin: isAdminUser,
    isMentorUser,
    isPreviewActive,
    effectiveTrack,
  });
  const isAdminUnfiltered = audience === "ALL";
  const memberTrack: "CAREER" | "SALES" | null = isAdminUnfiltered
    ? null
    : effectiveTrack.toUpperCase() === "SALES"
      ? "SALES"
      : "CAREER";
  const planHref = (tier: "pro" | "elite") =>
    isCareerTrack ? CAREER_PLAN_HREF(tier) : SALES_PLAN_HREF(tier);
  const visibleContentCards = filterByDashboardAudience(
    CONTENT_CARDS.map((card) => ({
      ...card,
      track:
        DEFAULT_DASHBOARD_RESOURCE_CARDS.find((resource) => resource.slug === card.slug)?.track ??
        card.track,
    })),
    audience
  );
  const visibleQuickLinks = filterByDashboardAudience(QUICK_LINKS, audience);
  const visibleSalesCards = filterByDashboardAudience(
    dashboardContent.salesResourceCards,
    audience
  );
  const showSalesTrackCards = visibleSalesCards.length > 0;
  const showPlaybookProgress =
    hasAccess(effectiveTier, "PRO") && isDashboardModuleVisible("Both", audience);
  const showCareerPrepLibrarySlot = isDashboardModuleVisible("Career", audience);
  const isStarter = effectiveTier === "STARTER";
  const isElite = hasAccess(effectiveTier, "ELITE");

  const resourceCopyBySlug = Object.fromEntries(
    dashboardContent.resourceCards.map((c) => [c.slug, c.description])
  );
  const salesResourceCopyBySlug = Object.fromEntries(
    dashboardContent.salesResourceCards.map((c) => [c.slug, c.description])
  );

  const [careerTopicCount, setCareerTopicCount] = useState(0);
  const [salesTopicCount, setSalesTopicCount] = useState(0);
  const [downloadingStarterPack, setDownloadingStarterPack] = useState(false);

  function handleDownloadStarterPack() {
    setDownloadingStarterPack(true);
    void (async () => {
      try {
        const res = await fetch("/api/starter-pack/bundle");
        if (!res.ok) {
          router.push("/starter-pack");
          return;
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "CommodityPlay-Starter-Pack.zip";
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
      } catch {
        router.push("/starter-pack");
      } finally {
        setDownloadingStarterPack(false);
      }
    })();
  }

  useEffect(() => {
    if (!hasAccess(effectiveTier, "PRO")) return;

    function loadCounts() {
      void Promise.all([
        fetch("/api/prep-library?track=CAREER").then((res) => (res.ok ? res.json() : [])),
        fetch("/api/prep-library?track=SALES").then((res) => (res.ok ? res.json() : [])),
      ]).then(([career, sales]) => {
        if (Array.isArray(career)) setCareerTopicCount(career.length);
        if (Array.isArray(sales)) setSalesTopicCount(sales.length);
      });
    }

    loadCounts();

    function onPrepLibraryCount(event: Event) {
      const detail = (event as CustomEvent<{ track: string; count: number }>).detail;
      if (detail.track === "CAREER") setCareerTopicCount(detail.count);
      if (detail.track === "SALES") setSalesTopicCount(detail.count);
    }

    window.addEventListener(PREP_LIBRARY_COUNT_EVENT, onPrepLibraryCount);
    return () => window.removeEventListener(PREP_LIBRARY_COUNT_EVENT, onPrepLibraryCount);
  }, [effectiveTier]);

  const firstEliteContentCardIndex = visibleContentCards.findIndex(
    (card) => (contentTiers[card.slug] || card.requiredTier) === "ELITE"
  );

  const fileDeliverableSources = {
    careerNavigationGuide: navigationGuides.career,
    salesDeliverables,
  };

  function resolveDeliverableHref(
    deliverableKey: DashboardDeliverableKey | undefined,
    fallback?: string,
    cardKind?: "page" | "file" | "email-digest"
  ): string | undefined {
    if (deliverableKey) {
      const fileHref = resolveDashboardFileDownloadHref(deliverableKey, fileDeliverableSources);
      if (cardKind === "file") return fileHref ?? undefined;
      return fileHref ?? fallback;
    }
    return fallback;
  }

  function renderResourceCard({
    title,
    description,
    icon: Icon,
    color,
    tier,
    unlocked,
    href,
    delay = 0,
    pendingLabel,
    accessLabel,
    trackLabel,
    cardKind = "page",
  }: {
    title: string;
    description: string;
    icon: typeof BookOpen;
    color: string;
    tier: "PRO" | "ELITE";
    unlocked: boolean;
    href?: string;
    delay?: number;
    pendingLabel?: string;
    accessLabel?: string;
    trackLabel: ModuleTrack;
    cardKind?: "page" | "file" | "email-digest";
  }) {
    const locked = !unlocked || Boolean(pendingLabel);
    const tierBadge = (
      <Badge
        variant={accessLabel ? "outline" : tier === "ELITE" ? "elite" : "pro"}
        size="sm"
        className={accessLabel ? "border-amber-200 text-amber-800 bg-amber-50" : undefined}
      >
        {accessLabel ?? (tier === "ELITE" ? "Elite" : "Pro")}
      </Badge>
    );
    const tierBadges = (
      <div className="flex flex-wrap items-center gap-1.5">
        {tierBadge}
        {shouldShowTrackBadge({ trackLabel, memberTrack, isAdminUnfiltered }) && (
          <ModuleTrackBadge track={trackLabel} />
        )}
      </div>
    );

    return (
      <Reveal delay={delay}>
        <div
          className={`relative h-full rounded-xl border transition-all duration-200 p-5 ${
            locked ? "bg-gray-50 border-gray-200" : "bg-white border-border card-hover"
          }`}
        >
          {locked && (
            <div className="absolute top-3 right-3">
              <Lock className="w-3.5 h-3.5 text-muted-fg" />
            </div>
          )}
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
            style={{ background: `${color}12` }}
          >
            <Icon className="w-4.5 h-4.5" style={{ color }} />
          </div>
          <h3 className="font-semibold text-sm text-gray-900 mb-1">{title}</h3>
          <p className="text-xs text-muted-fg mb-3 leading-relaxed">{description}</p>
          <div className="flex items-center justify-between">
            {unlocked ? (
              <>
                {tierBadges}
                {cardKind === "email-digest" ? (
                  <span className="text-xs text-muted-fg">Inbox digest</span>
                ) : pendingLabel ? (
                  <span className="text-xs text-muted-fg">{pendingLabel}</span>
                ) : href && cardKind === "file" ? (
                  <a
                    href={href}
                    className="text-xs text-primary-400 font-medium hover:text-primary-500 flex items-center gap-0.5"
                  >
                    Download <ChevronRight className="w-3.5 h-3.5" />
                  </a>
                ) : href ? (
                  <Link href={href} className="text-xs text-primary-400 font-medium hover:text-primary-500 flex items-center gap-0.5">
                    Open <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                ) : null}
              </>
            ) : pendingLabel ? (
              <>
                {tierBadges}
                <span className="text-xs text-muted-fg">{pendingLabel}</span>
              </>
            ) : (
              <>
                {tierBadges}
                <Link
                  href={planHref(tier === "ELITE" ? "elite" : "pro")}
                  className="text-xs font-medium text-primary-400 hover:text-primary-500 flex items-center gap-0.5"
                >
                  {UPGRADE_TO_ACCESS} <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </Reveal>
    );
  }

  return (
    <div className="page-container py-8 sm:py-10">
      {/* ── HEADER ── */}
      <Reveal className="mb-10">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-sm text-muted-fg mb-1">Welcome back,</p>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900">
              {greeting} 👋
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <Badge variant={isMentorUser ? "mentor" : (effectiveTier.toLowerCase() as any)} size="lg">
              {isMentorUser
                ? "Mentor"
                : `${tierInfo.label} Member${isPreviewActive ? " · Preview" : ""}`}
            </Badge>
          </div>
        </div>
      </Reveal>

      {isAdminUser && !isMentorUser && (
        <Link
          href="/admin?tab=content&slug=member-dashboard"
          className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-gray-900 text-white text-sm font-semibold px-4 py-2.5 shadow-xl hover:bg-gray-800 transition-colors"
        >
          Edit dashboard
        </Link>
      )}

      {isAdminUser && !isMentorUser && (
        <Reveal className="mb-8">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
            <div className="flex items-start gap-3 mb-3">
              <Shield className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-amber-800 mb-1">
                  Admin · member preview
                </p>
                <p className="text-sm text-amber-950/80 leading-relaxed">
                  This is what members see on their dashboard. Jump back to Admin Panel anytime, or preview each track&apos;s landing page below.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 pl-8">
              <label className="inline-flex items-center gap-2 text-sm text-amber-950/90">
                <span className="font-semibold whitespace-nowrap">Member view:</span>
                <select
                  value={
                    isPreviewActive
                      ? `${previewTrackValue.toLowerCase()}:${previewTierValue.toLowerCase()}`
                      : ""
                  }
                  onChange={(e) => {
                    const value = e.target.value;
                    if (!value) {
                      router.push("/dashboard");
                      return;
                    }
                    const [track, tier] = value.split(":");
                    router.push(`/dashboard?previewTrack=${track}&previewTier=${tier}`);
                  }}
                  className="h-9 min-w-[200px] rounded-lg border border-amber-200 bg-white px-3 text-sm text-gray-900"
                >
                  <option value="">All tracks (admin view)</option>
                  <optgroup label="Career">
                    {MEMBER_PREVIEW_OPTIONS.filter((option) => option.track === "career").map((option) => (
                      <option key={option.label} value={`${option.track}:${option.tier}`}>
                        {option.label}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Sales">
                    {MEMBER_PREVIEW_OPTIONS.filter((option) => option.track === "sales").map((option) => (
                      <option key={option.label} value={`${option.track}:${option.tier}`}>
                        {option.label}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </label>
              <Link href="/admin">
                <Button size="sm" variant="outline" className="bg-white border-amber-200 hover:bg-amber-100/50">
                  Admin Panel
                </Button>
              </Link>
              <Link href="/?track=career">
                <Button size="sm" variant="outline" className="bg-white border-amber-200 hover:bg-amber-100/50">
                  Preview Career track <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </Link>
              <Link href="/?track=sales">
                <Button size="sm" variant="outline" className="bg-white border-amber-200 hover:bg-amber-100/50">
                  Preview Sales track <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </Reveal>
      )}

      {/* ── STAT CARDS ── */}
      <StaggerChildren className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {(isMentorUser
          ? [
              {
                label: "Date Joined",
                value: mentorStats ? formatDate(mentorStats.dateJoined) : "—",
                icon: Calendar,
                color: "#3280ff",
              },
              {
                label: "Total Requests Received",
                value: String(mentorStats?.totalRequests ?? 0),
                icon: Inbox,
                color: "#5B21B6",
              },
              {
                label: "Requests Answered",
                value: String(mentorStats?.answered ?? 0),
                icon: CheckCircle,
                color: "#16a34a",
              },
              {
                label: "Pending Requests",
                value: String(mentorStats?.pending ?? 0),
                icon: Clock,
                color: "#B45309",
              },
            ]
          : [
          {
            label: isPreviewActive ? "Preview" : isAdminUser ? "Track preview" : "Track",
            value: isPreviewActive
              ? `${isCareerTrack ? "Career" : "Sales"} · ${tierInfo.label}`
              : isAdminUser
                ? "Career & Sales"
                : user.track === "CAREER"
                  ? "Career"
                  : "Sales",
            icon: TrendingUp,
            color: "#3280ff",
          },
          {
            label: "Persona",
            value: isStarter && !personaLabel ? "—" : personaLabel ?? "Take resume quiz",
            icon: Award,
            color: "#677184",
          },
          {
            label: "Mentor Credits",
            value: isStarter
              ? "--"
              : isElite && mentorCreditUsage
                ? formatMentorCreditsUsedLabel(mentorCreditUsage)
                : isElite
                  ? "0/15 used"
                  : "Elite only",
            eyebrow: isElite && mentorCreditUsage ? mentorCreditUsage.monthLabel : undefined,
            icon: Users,
            color: "#B45309",
          },
          showPlaybookProgress || isDashboardModuleVisible("Career", audience)
            ? {
                label: isStarter ? "Chapters" : "Chapters Done",
                value: isStarter
                  ? `Chapter A · ${contentStats.chapterCount} total`
                  : `${stats.completedChapters}/${contentStats.chapterCount}`,
                icon: BookOpen,
                color: "#16a34a",
              }
            : {
                label: "Sales tools",
                value: hasAccess(effectiveTier, "ELITE")
                  ? "Nudges · Prep · Accounts"
                  : hasAccess(effectiveTier, "PRO")
                    ? "Nudges · Prep · Guide"
                    : "Starter pack",
                icon: NotebookPen,
                color: "#0f766e",
              },
        ]).map((stat) => (
          <StaggerItem key={stat.label}>
            <div className="bg-white rounded-xl border border-border p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-primary-400">
                  {stat.label}
                </p>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `${stat.color}12` }}
                >
                  <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                </div>
              </div>
              {"eyebrow" in stat && stat.eyebrow && (
                <p className="text-[10px] font-semibold tracking-wide text-muted-fg mb-1">
                  {stat.eyebrow}
                </p>
              )}
              <p className="text-sm font-semibold text-gray-800 truncate">{stat.value}</p>
            </div>
          </StaggerItem>
        ))}
      </StaggerChildren>

      {!isMentorUser && (
      <>
      {/* ── STARTER PACK DOWNLOADS ── */}
      {effectiveTier === "STARTER" && (
        <Reveal className="mb-10">
          <div className="rounded-2xl border border-primary-line bg-primary-soft p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <Badge variant="starter" className="mb-3">{dashboardContent.starterPack.badge}</Badge>
                <h2 className="font-serif text-xl font-bold text-gray-900 mb-2">{dashboardContent.starterPack.headline}</h2>
                <p className="text-sm text-muted-fg max-w-lg">
                  {dashboardContent.starterPack.description}
                </p>
              </div>
              <Button
                className="flex-shrink-0"
                onClick={handleDownloadStarterPack}
                loading={downloadingStarterPack}
              >
                {dashboardContent.starterPack.cta} <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
            {dashboardContent.starterPack.footerNote && (
              <p className="text-xs text-muted-fg mt-4 pt-4 border-t border-primary-line">
                {dashboardContent.starterPack.footerNote}
              </p>
            )}
          </div>
        </Reveal>
      )}

      {/* ── PLAYBOOK PROGRESS (Career Pro+ only) ── */}
      {showPlaybookProgress && (
        <Reveal className="mb-10">
          <div className="bg-white rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif font-semibold text-gray-900">Playbook Progress</h2>
              <Link href="/playbook" className="text-sm text-primary-400 hover:text-primary-500 flex items-center gap-1">
                Continue reading <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="flex items-center gap-4 mb-4">
              <AnimatedProgress value={stats.progressPct} className="flex-1" />
              <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                {stats.progressPct}% complete
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {["A", "B", "C", "D", "E"].map((ch, i) => (
                <Link
                  key={ch}
                  href={`/playbook/${ch.toLowerCase()}`}
                  className={`flex flex-col items-center p-3 rounded-lg border transition-all hover:-translate-y-0.5 ${
                    i < stats.completedChapters
                      ? "border-green-200 bg-green-50"
                      : "border-border bg-secondary hover:border-primary-line"
                  }`}
                >
                  <div
                    className="w-6 h-6 rounded flex items-center justify-center mb-1.5 text-white text-xs font-bold"
                    style={{
                      background: i < stats.completedChapters ? "#16a34a" : `hsl(${220 + i * 8}, 80%, ${50 - i * 5}%)`,
                    }}
                  >
                    {ch}
                  </div>
                  <span className="text-[10px] font-medium text-muted-fg">
                    {i < stats.completedChapters ? "Done" : "Ch. " + ch}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      {/* ── CONTENT GRID ── */}
      <div className="mb-10">
        <Reveal className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-xl font-bold text-gray-900">Your Content</h2>
          {!hasAccess(effectiveTier, "PRO") && (
            <Link href={planHref("pro")}>
              <Button size="sm" variant="default">{UPGRADE_TO_ACCESS}</Button>
            </Link>
          )}
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {(() => {
            const items: { key: string; accessible: boolean; node: React.ReactNode }[] = [];

            visibleQuickLinks.forEach((link) => {
              items.push({
                key: `quick-${link.label}`,
                accessible: true,
                node: (
                  <Reveal>
                    <Link href={link.href} className="block">
                      <div className="card-hover h-full bg-white rounded-xl border border-border p-5 flex items-start gap-3 group">
                        <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-gray-900">{link.label}</p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <Badge variant="starter" size="sm">Free</Badge>
                            {shouldShowTrackBadge({
                              trackLabel: link.track,
                              memberTrack,
                              isAdminUnfiltered,
                            }) && <ModuleTrackBadge track={link.track} />}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </Reveal>
                ),
              });
            });

            visibleContentCards.forEach((card, i) => {
              if (showCareerPrepLibrarySlot && i === firstEliteContentCardIndex) {
                items.push({
                  key: "career-prep-library",
                  accessible: hasAccess(effectiveTier, "PRO"),
                  node: (
                    <PrepLibraryCard
                      track="CAREER"
                      userTier={effectiveTier}
                      topicCount={careerTopicCount}
                      showTrackBadge={shouldShowTrackBadge({
                        trackLabel: "Career",
                        memberTrack,
                        isAdminUnfiltered,
                      })}
                    />
                  ),
                });
              }

              const tier = (contentTiers[card.slug] || card.requiredTier) as "PRO" | "ELITE";
              const tierUnlocked = hasAccess(effectiveTier, tier);
              const cardDef = DEFAULT_DASHBOARD_RESOURCE_CARDS.find((resource) => resource.slug === card.slug);
              const cardKind =
                ("cardKind" in card ? card.cardKind : undefined) ??
                cardDef?.cardKind ??
                "page";
              const deliverableKey =
                ("deliverableKey" in card ? card.deliverableKey : undefined) ?? cardDef?.deliverableKey;
              const isFileCard = cardKind === "file";
              const fileReady = isDashboardFileReady(deliverableKey, fileDeliverableSources);
              const pendingLabel =
                tierUnlocked && isFileCard && !fileReady ? "Coming soon" : undefined;
              const description =
                resourceCopyBySlug[card.slug] ??
                DEFAULT_MEMBER_DASHBOARD_CONTENT.resourceCards.find((c) => c.slug === card.slug)?.description ??
                "";
              const href = resolveDeliverableHref(
                deliverableKey,
                "href" in card ? card.href : cardDef?.href,
                cardKind
              );
              items.push({
                key: card.slug,
                accessible: isDashboardCardAccessible({ unlocked: tierUnlocked, pendingLabel }),
                node: renderResourceCard({
                  title: card.title,
                  description,
                  icon: card.icon,
                  color: card.color,
                  tier,
                  unlocked: tierUnlocked,
                  href,
                  delay: i * 0.05,
                  pendingLabel,
                  trackLabel: card.track,
                  cardKind,
                }),
              });
            });

            if (showCareerPrepLibrarySlot && firstEliteContentCardIndex === -1) {
              items.push({
                key: "career-prep-library",
                accessible: hasAccess(effectiveTier, "PRO"),
                node: (
                  <PrepLibraryCard
                    track="CAREER"
                    userTier={effectiveTier}
                    topicCount={careerTopicCount}
                    showTrackBadge={shouldShowTrackBadge({
                      trackLabel: "Career",
                      memberTrack,
                      isAdminUnfiltered,
                    })}
                  />
                ),
              });
            }

            if (showSalesTrackCards) {
              visibleSalesCards.forEach((card, i) => {
                const tier = card.requiredTier;
                const description =
                  salesResourceCopyBySlug[card.slug] ??
                  DEFAULT_MEMBER_DASHBOARD_CONTENT.salesResourceCards.find((c) => c.slug === card.slug)
                    ?.description ??
                  "";
                const href = resolveDeliverableHref(card.deliverableKey, card.href, card.cardKind);
                const Icon = SALES_CARD_ICONS[card.slug] ?? FileText;
                const color = SALES_CARD_COLORS[card.slug] ?? "#3280ff";
                const tierUnlocked = hasAccess(effectiveTier, tier);
                const fileReady = isDashboardFileReady(card.deliverableKey, fileDeliverableSources);
                const pendingLabel =
                  tierUnlocked && card.cardKind === "file" && !fileReady ? "Coming soon" : undefined;

                if (card.isPrepLibrary) {
                  items.push({
                    key: card.slug,
                    accessible: hasAccess(effectiveTier, "PRO"),
                    node: (
                      <PrepLibraryCard
                        track="SALES"
                        userTier={effectiveTier}
                        topicCount={salesTopicCount}
                        showTrackBadge={shouldShowTrackBadge({
                          trackLabel: "Sales",
                          memberTrack,
                          isAdminUnfiltered,
                        })}
                      />
                    ),
                  });
                  return;
                }

                items.push({
                  key: card.slug,
                  accessible: isDashboardCardAccessible({ unlocked: tierUnlocked, pendingLabel }),
                  node: renderResourceCard({
                    title: card.title,
                    description,
                    icon: Icon,
                    color,
                    tier,
                    unlocked: tierUnlocked,
                    href,
                    delay: (visibleContentCards.length + i) * 0.05,
                    pendingLabel,
                    trackLabel: card.track,
                    cardKind: card.cardKind ?? "page",
                  }),
                });
              });
            }

            return partitionAccessibleFirst(items, (item) => item.accessible).map((item) => (
              <React.Fragment key={item.key}>{item.node}</React.Fragment>
            ));
          })()}
        </div>
      </div>

      {/* ── UPGRADE CTA (if not Elite) ── */}
      {effectiveTier !== "ELITE" && (
        <Reveal>
          <div className="rounded-2xl bg-primary-800 p-6 sm:p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #3280ff 0%, transparent 70%)", filter: "blur(40px)" }} />
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              {(() => {
                const promo =
                  effectiveTier === "STARTER"
                    ? dashboardContent.upgradeToPro
                    : dashboardContent.upgradeToElite;
                return (
                  <>
                    <div>
                      <Badge variant="dark" className="mb-3">
                        {promo.badge}
                      </Badge>
                      <h3 className="font-serif text-xl sm:text-2xl font-bold text-white mb-2">
                        {promo.headline}
                      </h3>
                      <p className="text-white/60 text-sm">{promo.description}</p>
                    </div>
                    <Link
                      href={effectiveTier === "STARTER" ? planHref("pro") : planHref("elite")}
                      className="flex-shrink-0 w-full sm:w-auto"
                    >
                      <Button size="lg" variant="primary-dark" className="whitespace-nowrap w-full sm:w-auto">
                        {promo.cta}
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </>
                );
              })()}
            </div>
          </div>
        </Reveal>
      )}
      </>
      )}
    </div>
  );
}
