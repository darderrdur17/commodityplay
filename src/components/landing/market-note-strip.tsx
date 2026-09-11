"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Bookmark,
  ChevronDown,
  MessageSquare,
  Target,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/animations";
import { Button } from "@/components/ui/button";

import type { MarketNoteTopic } from "@/data/market-notes";
import type { SalesTrackFeature } from "@/data/landing-content";

const TRACK_TOOL_ICONS: LucideIcon[] = [
  Bell,
  Bookmark,
  Target,
  MessageSquare,
  Users,
  TrendingUp,
];

type SecondaryCta = {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "default" | "outline";
  /** When true, styles the button with accentColor (e.g. sales green) instead of gray outline */
  accent?: boolean;
};

interface Props {
  eyebrow: string;
  title: string;
  description: string;
  /** When set, the left column is the Sales Track tools accordion. */
  features?: SalesTrackFeature[];
  topics: MarketNoteTopic[];
  accentColor?: string;
  /** Career/starter: simple bullet list. Sales: tagged rows. */
  variant?: "bullets" | "tags";
  /** When "primary", topic labels use a unified blue bubble (captions stay plain). */
  tagStyle?: "colored" | "primary";
  cta?: {
    label: string;
    onClick?: () => void;
    href?: string;
    loading?: boolean;
    variant?: "default" | "outline";
  };
  secondaryCta?: SecondaryCta;
  /** Optional green confirmation line below description (e.g. starter-pack subscribe state) */
  subscribedNote?: string;
}

export function MarketNoteStrip({
  eyebrow,
  title,
  description,
  features,
  topics,
  accentColor = "#3280ff",
  variant = "tags",
  tagStyle = "colored",
  cta,
  secondaryCta,
  subscribedNote,
}: Props) {
  const isToolsAccordion = Boolean(features && features.length > 0);

  return (
    <section className="py-16 sm:py-24 bg-[#f4f6f9]">
      <div className="page-container">
        <div
          className={cn(
            "grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12",
            isToolsAccordion ? "lg:items-start" : "lg:items-center"
          )}
        >
          <Reveal>
            {isToolsAccordion ? (
              <SalesTrackToolsCard
                eyebrow={eyebrow}
                headline={title}
                description={description}
                features={features!}
                accentColor={accentColor}
                secondaryCta={secondaryCta}
              />
            ) : (
              <>
                <p
                  className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] mb-4"
                  style={{ color: accentColor }}
                >
                  <span
                    className="w-2 h-2 rounded-full animate-pulse flex-shrink-0"
                    style={{ background: accentColor }}
                  />
                  {eyebrow}
                </p>
                <h2 className="font-serif text-[clamp(28px,3.5vw,40px)] font-bold text-primary-800 leading-[1.15] mb-5">
                  {title}
                </h2>
                <p className="text-[15px] text-muted-fg leading-relaxed max-w-lg">{description}</p>
                {subscribedNote && (
                  <p className="mt-5 flex items-center gap-2 text-sm font-medium text-green-700">
                    <span aria-hidden>✓</span>
                    {subscribedNote}
                  </p>
                )}
                {cta && (
                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    {cta.href ? (
                      <Link href={cta.href}>
                        <Button size="lg" variant={cta.variant ?? "default"} loading={cta.loading}>
                          {cta.label} <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    ) : (
                      <Button size="lg" variant={cta.variant ?? "default"} onClick={cta.onClick} loading={cta.loading}>
                        {cta.label} <ArrowRight className="w-4 h-4" />
                      </Button>
                    )}
                    {secondaryCta && (
                      <AccentSecondaryButton cta={secondaryCta} accentColor={accentColor} />
                    )}
                  </div>
                )}
                {!cta && secondaryCta && (
                  <div className="mt-8">
                    <AccentSecondaryButton cta={secondaryCta} accentColor={accentColor} />
                  </div>
                )}
              </>
            )}
          </Reveal>
          <Reveal delay={0.1}>
            <div className="rounded-2xl bg-white p-6 sm:p-7 shadow-[0_4px_24px_rgba(8,48,160,0.07)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-1">
                Recent Topics
              </p>
              {variant === "bullets" ? (
                <ul className="mt-2 space-y-0">
                  {topics.map((topic, index) => (
                    <li
                      key={topic.title}
                      className={`flex items-center gap-3 py-4 text-[14px] text-gray-800 ${
                        index > 0 ? "border-t border-gray-100" : ""
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: accentColor }}
                      />
                      {topic.title}
                    </li>
                  ))}
                </ul>
              ) : (
                <ul>
                  {topics.map((topic, index) => (
                    <li
                      key={topic.title}
                      className={`flex items-center gap-4 py-[18px] ${
                        index > 0 ? "border-t border-gray-100" : ""
                      }`}
                    >
                      {topic.tag && (
                        <span
                          className={cn(
                            "inline-flex items-center justify-center min-w-[78px] px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide flex-shrink-0",
                            tagStyle === "primary" && "bg-primary-100 text-primary-800"
                          )}
                          style={
                            tagStyle === "primary"
                              ? undefined
                              : { color: topic.tagColor, backgroundColor: topic.tagBg }
                          }
                        >
                          {topic.tag}
                        </span>
                      )}
                      <p className="text-[13px] text-gray-800 leading-snug flex-1">{topic.title}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function SalesTrackToolsCard({
  eyebrow,
  headline,
  description,
  features,
  accentColor,
  secondaryCta,
}: {
  eyebrow: string;
  headline: string;
  description: string;
  features: SalesTrackFeature[];
  accentColor: string;
  secondaryCta?: SecondaryCta;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="rounded-2xl border border-emerald-900/10 bg-white px-5 py-6 sm:px-7 sm:py-8 shadow-[0_4px_24px_rgba(8,48,160,0.04)]">
      <div className="flex items-center gap-3 mb-5">
        <span className="h-px flex-1" style={{ background: accentColor, opacity: 0.28 }} />
        <p
          className="text-[11px] font-bold uppercase tracking-[0.16em] shrink-0"
          style={{ color: accentColor }}
        >
          {eyebrow}
        </p>
        <span className="h-px flex-1" style={{ background: accentColor, opacity: 0.28 }} />
      </div>
      <h2 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 leading-[1.15] mb-2">
        {headline}
      </h2>
      <p className="text-[15px] text-muted-fg leading-relaxed mb-6 max-w-lg">{description}</p>
      <ul>
        {features.map((feature, i) => {
          const Icon = TRACK_TOOL_ICONS[i % TRACK_TOOL_ICONS.length];
          const isOpen = openIndex === i;
          const panelId = `sales-track-tool-${i}`;
          return (
            <li key={`${feature.title}-${i}`} className="border-t border-gray-200/90">
              <button
                type="button"
                className="w-full flex items-center gap-3 py-4 text-left"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex((prev) => (prev === i ? null : i))}
              >
                <span
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "#CCFBF1", color: accentColor }}
                >
                  <Icon className="w-4 h-4" aria-hidden />
                </span>
                <span className="flex-1 min-w-0 font-serif text-base sm:text-lg font-bold text-gray-900 leading-snug">
                  {feature.title}
                </span>
                <ChevronDown
                  aria-hidden
                  className={cn(
                    "w-4 h-4 text-muted-fg shrink-0 transition-transform duration-200",
                    isOpen && "rotate-180"
                  )}
                />
              </button>
              {isOpen && (
                <div id={panelId} className="pb-4 pl-[3.25rem] sm:pl-[3.25rem]">
                  <p className="text-[14px] text-muted-fg leading-relaxed pr-6">{feature.desc}</p>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {secondaryCta && (
        <div className="mt-4 pt-2">
          <AccentSecondaryButton cta={secondaryCta} accentColor={accentColor} fullWidth />
        </div>
      )}
    </div>
  );
}

function AccentSecondaryButton({
  cta,
  accentColor,
  fullWidth,
}: {
  cta: SecondaryCta;
  accentColor: string;
  fullWidth?: boolean;
}) {
  const button = (
    <Button
      size="lg"
      type="button"
      variant={cta.variant ?? "outline"}
      onClick={cta.onClick}
      className={cn(
        cta.accent && "border-transparent text-white hover:brightness-110 hover:border-transparent",
        fullWidth && "w-full"
      )}
      style={
        cta.accent
          ? ({ backgroundColor: accentColor, borderColor: accentColor, ["--cta-accent" as string]: accentColor } as React.CSSProperties)
          : undefined
      }
    >
      {cta.label}
    </Button>
  );

  if (cta.onClick) return button;
  if (!cta.href) return null;

  return (
    <Link href={cta.href} target="_blank" rel="noopener noreferrer" className={fullWidth ? "block" : undefined}>
      {button}
    </Link>
  );
}
