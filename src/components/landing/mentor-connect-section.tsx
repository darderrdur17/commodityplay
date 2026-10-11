"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/animations";
import { cn } from "@/lib/utils";
import { MentorDemoCard, type MentorTheme } from "@/components/landing/mentor-demo-card";
import type { LandingMentorSection } from "@/data/landing-content";
import { CAREER_PRICING_HREF, SALES_PRICING_HREF } from "@/lib/pricing-routes";
import { LANDING_CTA } from "@/lib/landing-cta";

type Track = "career" | "sales";

/**
 * Track palette. Values mirror the design brief's `--accent / --deep / --tint /
 * --bg / --line / --soft / --ink / --sub / --mute / --btn / --btn-hover` custom
 * properties, so the two tracks share one layout and differ only in colour.
 */
const THEMES: Record<Track, MentorTheme & { bg: string }> = {
  career: {
    accent: "#3280ff",
    deep: "#0830a0",
    tint: "#dff2ff",
    line: "#dbe4f3",
    soft: "#f6f9ff",
    ink: "#1b2333",
    sub: "#465468",
    mute: "#677184",
    btn: "#3280ff",
    btnHover: "#115cff",
    bg: "#f4f8ff",
  },
  sales: {
    accent: "#0f766e",
    deep: "#065f46",
    tint: "#ccfbf1",
    line: "#cfe3da",
    soft: "#f4faf7",
    ink: "#152420",
    sub: "#3d524d",
    mute: "#677f78",
    btn: "#065f46",
    btnHover: "#054d3a",
    bg: "#f0fdf4",
  },
};

/**
 * Hover states need real Tailwind classes (an inline `background` would win over
 * `hover:`), so the two button colours are written out in full here. Tailwind
 * only keeps classes it can see as complete literals.
 */
const BUTTON_CLASS: Record<Track, string> = {
  career: "bg-[#3280ff] hover:bg-[#115CFF]",
  sales: "bg-[#065F46] hover:bg-[#054D3A]",
};

export interface MentorConnectSectionProps {
  content: LandingMentorSection;
  /** Drives the accent colour only — the words are shared by both tracks. */
  track: Track;
  /**
   * Opens the shared Contact modal. The section owns no contact form of its own —
   * every enquiry goes through the same `/api/contact` funnel as the rest of the
   * site, which is what routes it to the support inbox.
   */
  onOpenContact: () => void;
  id?: string;
}

/**
 * "Mentor Connect — Ask the desk. Stay anonymous."
 *
 * Rendered on BOTH landing pages in the slot the dashed placeholder used to
 * occupy. One set of CMS words; the track only swaps the palette.
 *
 * HISTORY — what the primary CTA does:
 * It used to scroll to and focus the embedded interactive card rather than open
 * the Contact modal, on the reasoning that the demo is literally the panel beside
 * the button. The build flagged that as reading oddly, because the house
 * convention elsewhere (`edge-notes.ts`) has a "See demo" open Contact Us.
 * REVERSED at the owner's request (11 Oct 2026): the button now opens the Contact
 * modal, so the enquiry lands on the support inbox like every other Contact Us.
 */
export function MentorConnectSection({
  content,
  track,
  onOpenContact,
  id = "mentor-connect",
}: MentorConnectSectionProps) {
  const theme = THEMES[track];
  /**
   * The demo wrapper stays a focusable, labelled region even though nothing
   * scrolls to it any more — it is the anchor the demo card lives inside, and
   * `#mentor-connect` deep links still resolve against the section itself.
   */
  const demoRef = useRef<HTMLDivElement>(null);

  return (
    <section
      id={id}
      className="py-16 sm:py-[88px] scroll-mt-24"
      style={{ backgroundColor: theme.bg }}
    >
      <div className="page-container">
        <div className="grid grid-cols-1 lg:grid-cols-[5fr_6fr] gap-11 lg:gap-16 items-start">
          {/* Copy */}
          <Reveal className="min-w-0">
            <p className="flex items-center gap-2.5 mb-[22px]">
              <span className="h-px flex-1" style={{ background: theme.line }} aria-hidden />
              <span
                className="text-[11px] font-bold uppercase tracking-[0.14em] whitespace-nowrap"
                style={{ color: theme.deep }}
              >
                {content.eyebrow}
              </span>
              <span className="h-px flex-1" style={{ background: theme.line }} aria-hidden />
            </p>

            {/* Type scale deliberately matches `TrackFeatureSection`'s headline
                (`clamp(28px,3.6vw,38px)`), not the hero scale. At the owner's
                request (11 Oct 2026) this heading was rendering one step larger
                than every other section headline on the page — most visibly
                against "Your tracked accounts, with bookmarked topics." directly
                above it on the Sales track. */}
            <h2
              className="font-serif text-[clamp(28px,3.6vw,38px)] font-bold leading-[1.15] tracking-tight mb-4 text-balance"
              style={{ color: theme.deep }}
            >
              {content.headline}
            </h2>

            <p
              className="text-[16.5px] leading-[1.6] max-w-[470px] mb-[30px]"
              style={{ color: theme.sub }}
            >
              {content.lede}
            </p>

            <ol
              className="list-none border-t mb-8"
              style={{ borderColor: theme.line }}
            >
              {content.steps.map((step) => (
                <li
                  key={step.num}
                  className="grid grid-cols-[38px_1fr] gap-1.5 py-4 border-b"
                  style={{ borderColor: theme.line }}
                >
                  <span
                    className="text-[15px] font-extrabold leading-[1.5]"
                    style={{ color: theme.accent }}
                  >
                    {step.num}
                  </span>
                  <div>
                    <h3
                      className="text-[16px] font-semibold leading-[1.4] mb-0.5"
                      style={{ color: theme.deep }}
                    >
                      {step.title}
                    </h3>
                    <p className="text-[14px] leading-[1.55]" style={{ color: theme.ink }}>
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="flex items-center gap-[22px] flex-wrap">
              <button
                type="button"
                onClick={onOpenContact}
                className={cn(
                  "inline-flex items-center justify-center whitespace-nowrap font-semibold text-white",
                  "px-7 py-3.5 text-[14.5px] transition-colors",
                  "focus-visible:outline-2 focus-visible:outline-offset-[3px]",
                  LANDING_CTA,
                  BUTTON_CLASS[track]
                )}
                style={{ outlineColor: theme.accent }}
              >
                {content.primaryCta}
              </button>
              <Link
                href={track === "sales" ? SALES_PRICING_HREF : CAREER_PRICING_HREF}
                className="inline-flex items-center gap-1.5 text-[14px] font-semibold underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px]"
                style={{ color: theme.deep }}
              >
                {content.secondaryCta}
                <ArrowRight className="w-3.5 h-3.5" aria-hidden />
              </Link>
            </div>
          </Reveal>

          {/* Interactive demo */}
          <Reveal delay={0.1} className="min-w-0">
            <div
              ref={demoRef}
              tabIndex={-1}
              className="outline-none scroll-mt-24"
              aria-label={content.demoHint}
            >
              <p
                className="flex items-center gap-2 mb-2.5 text-[10.5px] font-bold uppercase tracking-[0.12em]"
                style={{ color: theme.mute }}
              >
                <span
                  className="w-[7px] h-[7px] rounded-full animate-pulse shrink-0"
                  style={{ background: theme.accent }}
                  aria-hidden
                />
                {content.demoHint}
              </p>
              {/* The preview is rendered inert on BOTH tracks — see the HISTORY note
                  on MentorDemoCard's `askDisabled`. */}
              <MentorDemoCard content={content} theme={theme} askDisabled />
              <p className="mt-3 text-[12.5px] leading-[1.5]" style={{ color: theme.mute }}>
                {content.demoFoot}
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
