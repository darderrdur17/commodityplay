"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpen, Map, FileText, MessageSquare, BarChart3, Briefcase,
  Users, Lock, ArrowRight, TrendingUp, Award, ChevronRight,
  CheckCircle, Shield, ExternalLink, Eye, Compass, NotebookPen, ScrollText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnimatedProgress, Reveal, StaggerChildren, StaggerItem } from "@/components/animations";
import { PERSONA_LABELS, TIER_LABELS, hasAccess } from "@/lib/utils";
import { UPGRADE_TO_ACCESS } from "@/data/pricing-shared";
import { CAREER_PLAN_HREF } from "@/lib/pricing-routes";
import { attachmentHref } from "@/lib/content/attachments";
import type { NavigationGuideAttachment } from "@/lib/content/accessors";
import {
  DEFAULT_MEMBER_DASHBOARD_CONTENT,
  type DashboardSalesResourceCardCopy,
  type MemberDashboardContent,
} from "@/data/member-dashboard";
import type { SalesDashboardDeliverables } from "@/lib/content/sales-dashboard-deliverables";
import type { ContentStats } from "@/lib/content/content-stats";
import {
  formatMentorCreditsUsedLabel,
  type MentorCreditUsage,
} from "@/lib/mentor-credits";

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
}

const CONTENT_CARDS = [
  {
    slug: "playbook",
    icon: BookOpen,
    title: "Full Playbook",
    href: "/playbook",
    requiredTier: "PRO",
    color: "#3280ff",
  },
  {
    slug: "resume-templates",
    icon: FileText,
    title: "Resume Templates",
    href: "/resume-templates",
    requiredTier: "PRO",
    color: "#3280ff",
  },
  {
    slug: "career-roadmap",
    icon: Map,
    title: "Career Roadmap",
    href: "/career-roadmap",
    requiredTier: "PRO",
    color: "#3280ff",
  },
  {
    slug: "interview-questions",
    icon: BarChart3,
    title: "Interview Questions",
    href: "/interview-questions",
    requiredTier: "PRO",
    color: "#3280ff",
  },
  {
    slug: "knowledge-test",
    icon: TrendingUp,
    title: "Knowledge Test",
    href: "/knowledge-test",
    requiredTier: "PRO",
    color: "#3280ff",
  },
  {
    slug: "case-studies",
    icon: Briefcase,
    title: "Case Studies",
    href: "/case-studies",
    requiredTier: "ELITE",
    color: "#B45309",
  },
  {
    slug: "desk-channel",
    icon: MessageSquare,
    title: "Desk Channel",
    href: "/desk-channel",
    requiredTier: "ELITE",
    color: "#B45309",
  },
  {
    slug: "mentor-connect",
    icon: Users,
    title: "Mentor Connect",
    href: "/mentor-connect",
    requiredTier: "ELITE",
    color: "#B45309",
  },
  {
    slug: "job-openings",
    icon: Briefcase,
    title: "Job Openings",
    href: "/job-openings",
    requiredTier: "ELITE",
    color: "#B45309",
  },
] as const;

const SALES_CARD_ICONS: Record<string, typeof FileText> = {
  "sales-edge-note": ScrollText,
  "industry-guide-for-sales": BookOpen,
  "sales-advisory-channel": NotebookPen,
};

const SALES_CARD_COLORS: Record<string, string> = {
  "sales-edge-note": "#3280ff",
  "industry-guide-for-sales": "#3280ff",
  "sales-advisory-channel": "#B45309",
};

const QUICK_LINKS = [
  { label: "Desk Glossary", href: "/glossary", free: true },
  { label: "Chapter A Preview", href: "/playbook/a", free: true },
  { label: "Job Board Waitlist", href: "/waitlist", free: true },
];

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
}: Props) {
  const tierInfo = TIER_LABELS[user.tier] || TIER_LABELS.STARTER;
  const personaInfo = user.persona ? PERSONA_LABELS[user.persona] : null;
  const greeting = user.name?.split(" ")[0] || "there";
  const isCareerTrack = user.track === "CAREER";
  const showSalesTrackCards = isAdminUser || !isCareerTrack;
  const isElite = hasAccess(user.tier, "ELITE");
  const showCareerNavGuide =
    hasAccess(user.tier, "PRO") &&
    navigationGuides.career?.assetId &&
    (isAdminUser || isCareerTrack);
  const showSalesNavGuide =
    hasAccess(user.tier, "PRO") &&
    navigationGuides.sales?.assetId &&
    (isAdminUser || !isCareerTrack);

  const resourceCopyBySlug = Object.fromEntries(
    dashboardContent.resourceCards.map((c) => [c.slug, c.description])
  );
  const salesResourceCopyBySlug = Object.fromEntries(
    dashboardContent.salesResourceCards.map((c) => [c.slug, c.description])
  );

  function resolveSalesCardHref(card: DashboardSalesResourceCardCopy): string | null {
    if (card.deliverableKey) {
      const asset = salesDeliverables[card.deliverableKey];
      if (asset?.assetId) {
        return attachmentHref(`/api/content/assets/${asset.assetId}`, "view-only");
      }
    }
    return card.href;
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
  }: {
    title: string;
    description: string;
    icon: typeof BookOpen;
    color: string;
    tier: "PRO" | "ELITE";
    unlocked: boolean;
    href: string;
    delay?: number;
    pendingLabel?: string;
  }) {
    const locked = !unlocked;
    return (
      <Reveal delay={delay}>
        <div
          className={`relative h-full bg-white rounded-xl border transition-all duration-200 p-5 ${
            unlocked ? "border-border card-hover" : "border-border opacity-75"
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
                <Badge variant={tier === "ELITE" ? "elite" : "pro"} size="sm">
                  {tier === "ELITE" ? "Elite" : "Pro"}
                </Badge>
                <Link href={href} className="text-xs text-primary-400 font-medium hover:text-primary-500 flex items-center gap-0.5">
                  Open <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </>
            ) : pendingLabel ? (
              <>
                <Badge variant={tier === "ELITE" ? "elite" : "pro"} size="sm">
                  {tier === "ELITE" ? "Elite" : "Pro"}
                </Badge>
                <span className="text-xs text-muted-fg">{pendingLabel}</span>
              </>
            ) : (
              <>
                <Badge variant="outline" size="sm" className="text-muted-fg border-border">
                  Locked
                </Badge>
                <Link
                  href={CAREER_PLAN_HREF(tier === "ELITE" ? "elite" : "pro")}
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
            <Badge variant={user.tier.toLowerCase() as any} size="lg">
              {tierInfo.label} Member
            </Badge>
          </div>
        </div>
      </Reveal>

      {isAdminUser && (
        <Link
          href="/admin?tab=content&slug=member-dashboard"
          className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-gray-900 text-white text-sm font-semibold px-4 py-2.5 shadow-xl hover:bg-gray-800 transition-colors"
        >
          Edit dashboard
        </Link>
      )}

      {isAdminUser && (
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
            <div className="flex flex-wrap gap-2 pl-8">
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
        {[
          {
            label: isAdminUser ? "Track preview" : "Track",
            value: isAdminUser ? "Career & Sales" : user.track === "CAREER" ? "Career" : "Sales",
            icon: TrendingUp,
            color: "#3280ff",
          },
          {
            label: "Persona",
            value: personaInfo?.label || "Not set",
            icon: Award,
            color: personaInfo?.color || "#677184",
          },
          {
            label: "Mentor Credits",
            value: isElite && mentorCreditUsage
              ? formatMentorCreditsUsedLabel(mentorCreditUsage)
              : isElite
                ? "0/15 used"
                : "Elite only",
            eyebrow: isElite && mentorCreditUsage ? mentorCreditUsage.monthLabel : undefined,
            icon: Users,
            color: "#B45309",
          },
          {
            label: "Chapters Done",
            value: `${stats.completedChapters}/${contentStats.chapterCount}`,
            icon: BookOpen,
            color: "#16a34a",
          },
        ].map((stat) => (
          <StaggerItem key={stat.label}>
            <div className="bg-white rounded-xl border border-border p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-fg">
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
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-fg mb-1">
                  {stat.eyebrow}
                </p>
              )}
              <p className="font-serif text-xl sm:text-2xl font-bold text-gray-900 truncate">{stat.value}</p>
            </div>
          </StaggerItem>
        ))}
      </StaggerChildren>

      {/* ── STARTER PACK DOWNLOADS ── */}
      {user.tier === "STARTER" && (
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
              <Link href="/signup" className="flex-shrink-0">
                <Button>
                  {dashboardContent.starterPack.cta} <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            {dashboardContent.starterPack.footerNote && (
              <p className="text-xs text-muted-fg mt-4 pt-4 border-t border-primary-line">
                {dashboardContent.starterPack.footerNote}
              </p>
            )}
          </div>
        </Reveal>
      )}

      {/* ── PLAYBOOK PROGRESS (Pro+) ── */}
      {hasAccess(user.tier, "PRO") && (
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

      {/* ── PRO PACK NAVIGATION GUIDES ── */}
      {(showCareerNavGuide || showSalesNavGuide) && (
        <Reveal className="mb-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {showCareerNavGuide && navigationGuides.career && (
              <div className="rounded-xl border border-primary-line bg-primary-soft p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-400/10 flex items-center justify-center flex-shrink-0">
                    <Compass className="w-5 h-5 text-primary-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Badge variant="pro" size="sm" className="mb-2">Pro Pack</Badge>
                    <h2 className="font-serif text-lg font-bold text-gray-900 mb-1">
                      {navigationGuides.career.label}
                    </h2>
                    <p className="text-xs text-muted-fg mb-3 truncate">
                      {navigationGuides.career.fileName}
                    </p>
                    <a
                      href={attachmentHref(`/api/content/assets/${navigationGuides.career.assetId}`, "view-only")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-primary-400 hover:text-primary-800"
                    >
                      <Eye className="w-4 h-4" /> View guide
                    </a>
                  </div>
                </div>
              </div>
            )}
            {showSalesNavGuide && navigationGuides.sales && (
              <div className="rounded-xl border border-primary-line bg-primary-soft p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-400/10 flex items-center justify-center flex-shrink-0">
                    <Compass className="w-5 h-5 text-primary-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Badge variant="pro" size="sm" className="mb-2">Pro Pack</Badge>
                    <h2 className="font-serif text-lg font-bold text-gray-900 mb-1">
                      {navigationGuides.sales.label}
                    </h2>
                    <p className="text-xs text-muted-fg mb-3 truncate">
                      {navigationGuides.sales.fileName}
                    </p>
                    <a
                      href={attachmentHref(`/api/content/assets/${navigationGuides.sales.assetId}`, "view-only")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-primary-400 hover:text-primary-800"
                    >
                      <Eye className="w-4 h-4" /> View guide
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Reveal>
      )}

      {/* ── CONTENT GRID ── */}
      <div className="mb-10">
        <Reveal className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-xl font-bold text-gray-900">Your Content</h2>
          {!hasAccess(user.tier, "PRO") && (
            <Link href={CAREER_PLAN_HREF("pro")}>
              <Button size="sm" variant="default">{UPGRADE_TO_ACCESS}</Button>
            </Link>
          )}
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Free content */}
          {QUICK_LINKS.map((link) => (
            <Reveal key={link.label}>
              <Link href={link.href} className="block">
                <div className="card-hover h-full bg-white rounded-xl border border-border p-5 flex items-start gap-3 group">
                  <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{link.label}</p>
                    <Badge variant="starter" size="sm" className="mt-1">Free</Badge>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}

          {/* Tiered content */}
          {CONTENT_CARDS.map((card, i) => {
            const tier = (contentTiers[card.slug] || card.requiredTier) as "PRO" | "ELITE";
            const unlocked = hasAccess(user.tier, tier);
            const description =
              resourceCopyBySlug[card.slug] ??
              DEFAULT_MEMBER_DASHBOARD_CONTENT.resourceCards.find((c) => c.slug === card.slug)?.description ??
              "";
            return renderResourceCard({
              title: card.title,
              description,
              icon: card.icon,
              color: card.color,
              tier,
              unlocked,
              href: card.href,
              delay: i * 0.05,
            });
          })}

          {/* Sales track only */}
          {showSalesTrackCards &&
            dashboardContent.salesResourceCards.map((card, i) => {
              const tier = card.requiredTier;
              const description =
                salesResourceCopyBySlug[card.slug] ??
                DEFAULT_MEMBER_DASHBOARD_CONTENT.salesResourceCards.find((c) => c.slug === card.slug)
                  ?.description ??
                "";
              const href = resolveSalesCardHref(card) ?? card.href;
              const Icon = SALES_CARD_ICONS[card.slug] ?? FileText;
              const color = SALES_CARD_COLORS[card.slug] ?? "#3280ff";
              const tierUnlocked = hasAccess(user.tier, tier);
              const fileReady = card.deliverableKey
                ? Boolean(salesDeliverables[card.deliverableKey]?.assetId)
                : true;
              const canOpen = tierUnlocked && fileReady;
              const pendingLabel =
                tierUnlocked && card.deliverableKey && !fileReady ? "File coming soon" : undefined;

              return renderResourceCard({
                title: card.title,
                description,
                icon: Icon,
                color,
                tier,
                unlocked: canOpen,
                href,
                delay: (CONTENT_CARDS.length + i) * 0.05,
                pendingLabel,
              });
            })}
        </div>
      </div>

      {/* ── UPGRADE CTA (if not Elite) ── */}
      {user.tier !== "ELITE" && (
        <Reveal>
          <div className="rounded-2xl bg-primary-800 p-6 sm:p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #3280ff 0%, transparent 70%)", filter: "blur(40px)" }} />
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              {(() => {
                const promo =
                  user.tier === "STARTER"
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
                      href={user.tier === "STARTER" ? CAREER_PLAN_HREF("pro") : CAREER_PLAN_HREF("elite")}
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
    </div>
  );
}
