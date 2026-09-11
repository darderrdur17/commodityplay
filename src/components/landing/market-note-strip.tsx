"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/animations";
import { Button } from "@/components/ui/button";

import type { MarketNoteTopic } from "@/data/market-notes";
import type { SalesTrackFeature } from "@/data/landing-content";

interface Props {
  eyebrow: string;
  title: string;
  description: string;
  /** When set, the left column is a title + caption list instead of a single headline. */
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
  secondaryCta?: {
    label: string;
    href: string;
    variant?: "default" | "outline";
    /** When true, styles the button with accentColor (e.g. sales green) instead of gray outline */
    accent?: boolean;
  };
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
  return (
    <section className="py-16 sm:py-24 bg-[#f4f6f9]">
      <div className="page-container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 lg:items-center">
          <Reveal>
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
            {features && features.length > 0 ? (
              <ul className="space-y-4 max-w-lg">
                {features.map((feature, i) => (
                  <li key={`${feature.title}-${i}`}>
                    <h3 className="font-serif text-lg sm:text-xl font-semibold text-primary-800 leading-snug">
                      {feature.title}
                    </h3>
                    <p className="mt-1 text-sm text-primary-400 leading-relaxed">{feature.desc}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <>
                <h2 className="font-serif text-[clamp(28px,3.5vw,40px)] font-bold text-primary-800 leading-[1.15] mb-5">
                  {title}
                </h2>
                <p className="text-[15px] text-muted-fg leading-relaxed max-w-lg">{description}</p>
              </>
            )}
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
                  <Link href={secondaryCta.href} target="_blank" rel="noopener noreferrer">
                    <Button
                      size="lg"
                      variant={secondaryCta.variant ?? "outline"}
                      className={
                        secondaryCta.accent
                          ? "border-transparent text-white hover:brightness-110 hover:border-transparent"
                          : undefined
                      }
                      style={
                        secondaryCta.accent
                          ? ({ backgroundColor: accentColor, borderColor: accentColor, ["--cta-accent" as string]: accentColor } as React.CSSProperties)
                          : undefined
                      }
                    >
                      {secondaryCta.label}
                    </Button>
                  </Link>
                )}
              </div>
            )}
            {!cta && secondaryCta && (
              <div className="mt-8">
                <Link href={secondaryCta.href} target="_blank" rel="noopener noreferrer">
                  <Button
                    size="lg"
                    variant={secondaryCta.variant ?? "outline"}
                    className={
                      secondaryCta.accent
                        ? "border-transparent text-white hover:brightness-110 hover:border-transparent"
                        : undefined
                    }
                    style={
                      secondaryCta.accent
                        ? ({ backgroundColor: accentColor, borderColor: accentColor, ["--cta-accent" as string]: accentColor } as React.CSSProperties)
                        : undefined
                    }
                  >
                    {secondaryCta.label}
                  </Button>
                </Link>
              </div>
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
