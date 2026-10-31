import { Reveal } from "@/components/animations";
import { cn } from "@/lib/utils";
import type { LandingTrackFeature } from "@/data/landing-content";
import {
  SALES_ACCENT,
  SALES_FEATURE_LINE,
  SALES_HERO_GREEN,
  SALES_INK,
  SALES_SECTION_MINT,
  SALES_SUB,
} from "@/lib/sales-brand-colors";

export interface TrackFeatureSectionProps {
  feature: LandingTrackFeature;
  /** The illustrative product panel rendered beside the copy. */
  mock: React.ReactNode;
  /**
   * Which side the mock sits on at desktop widths. The copy column is always
   * wider (6fr) when the mock is left and narrower (5fr) when it is right —
   * matching the brief's `5fr 6fr` grid. **On mobile the copy always comes
   * first**, regardless of side, so the headline is never below a screenshot.
   */
  mockSide?: "left" | "right";
  /** Tinted mint background instead of white, so adjacent sections alternate. */
  tinted?: boolean;
  /** Anchor id from the design brief, e.g. "prep-library". */
  id?: string;
}

export function TrackFeatureSection({
  feature,
  mock,
  mockSide = "left",
  tinted = false,
  id,
}: TrackFeatureSectionProps) {
  const copyOrder = mockSide === "left" ? "order-1 lg:order-2" : "order-1";
  const mockOrder = mockSide === "left" ? "order-2 lg:order-1" : "order-2";

  return (
    <section
      id={id}
      className="py-16 sm:py-24 scroll-mt-24"
      style={tinted ? { backgroundColor: SALES_SECTION_MINT } : undefined}
    >
      <div className="page-container">
        <div className="grid grid-cols-1 lg:grid-cols-[5fr_6fr] gap-11 lg:gap-16 lg:items-center">
          <Reveal className={cn("min-w-0", copyOrder)}>
            <p className="flex items-center gap-2.5 mb-5">
              <span className="h-px flex-1" style={{ background: SALES_FEATURE_LINE }} aria-hidden />
              <span
                className="text-[11px] font-bold uppercase tracking-[0.14em] whitespace-nowrap"
                style={{ color: SALES_HERO_GREEN }}
              >
                {feature.eyebrow}
              </span>
              <span className="h-px flex-1" style={{ background: SALES_FEATURE_LINE }} aria-hidden />
            </p>

            <h2
              className="font-serif text-[clamp(28px,3.6vw,38px)] font-bold leading-[1.15] tracking-tight mb-4 text-balance"
              style={{ color: SALES_HERO_GREEN }}
            >
              {feature.headline}
            </h2>

            <p
              className="text-[16.5px] leading-[1.6] max-w-[470px] mb-7"
              style={{ color: SALES_SUB }}
            >
              {feature.lede}
            </p>

            <ul className="border-t" style={{ borderColor: SALES_FEATURE_LINE }}>
              {feature.points.map((point) => (
                <li
                  key={point.label}
                  className="flex gap-3 py-[13px] border-b text-[14.5px] leading-[1.5]"
                  style={{ borderColor: SALES_FEATURE_LINE, color: SALES_INK }}
                >
                  <b
                    className="text-[11px] font-bold uppercase tracking-[0.1em] min-w-[58px] pt-[3px] shrink-0"
                    style={{ color: SALES_ACCENT }}
                  >
                    {point.label}
                  </b>
                  <span>{point.text}</span>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.1} className={cn("min-w-0", mockOrder)}>
            {mock}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
