"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Reveal } from "@/components/animations";
import { Button } from "@/components/ui/button";
import { StarterPackModal } from "@/components/landing/starter-pack-modal";
import { ContactModal } from "@/components/landing/contact-modal";
import { PricingTierGrid } from "@/components/pricing/pricing-tier-grid";
import { PlanTermSelector } from "@/components/pricing/plan-term-selector";
import { TrackSwitcher } from "@/components/pricing/track-switcher";
import {
  PRICING_CONTENT_FOOTNOTE,
  PRICING_FREE_PANEL,
  PRICING_TRACK_HEADINGS,
} from "@/data/pricing-shared";
import type { BillingCadence, PlanTerm, PlanTrack } from "@/data/pricing-shared";
import type { LandingContent, LandingTier } from "@/data/landing-content";
import { CAREER_PRICING_PATH, SALES_PLAN_HREF, SALES_PRICING_PATH } from "@/lib/pricing-routes";
import { isPaymentsLive } from "@/lib/payments";
import { startCheckout } from "@/lib/start-checkout";
import { PAGE_SECTION_PY } from "@/lib/layout-constants";

type Track = "career" | "sales";

/**
 * The page background behind the plan grid — WHITE for BOTH tracks, matching
 * `body { bg-white }` (globals.css) and every other page on the site.
 *
 * This has moved twice, and the Record below is what made both moves one-liners:
 *
 *   1. The tints (#050b1d navy for career, #04130f dark green for sales) went
 *      first. Against the black free-plan panel directly above they read as
 *      "dark blue or grey" — two shades stacked on each other — so both tracks
 *      went pure black.
 *   2. The black itself went next. /pricing was then the only page with a dark
 *      body while its own nav was white, and the brief was that its background
 *      should follow the same colorway as the rest of the site. The plan cards
 *      deliberately KEEP their track fills (navy / green) — only the page
 *      background changed, so the cards now carry the track colour on their own.
 */
const TRACK_BACKGROUNDS: Record<Track, string> = {
  career: "#ffffff",
  sales: "#ffffff",
};

export interface PricingPageClientProps {
  /** CMS-merged landing content (career + sales tiers + comparison tables). */
  content: LandingContent;
  starterPackItems?: string[];
  starterPackHeadline?: string;
  /**
   * The signed-in member's track, read server-side via `auth()`. `null` when
   * signed out. Signed-in members are pinned to their own track (R-1) because
   * `/api/stripe/checkout` charges `User.track` regardless of what the browser
   * sends.
   */
  userTrack?: PlanTrack | null;
  /**
   * True when the caller is on the `ADMIN_EMAILS` allowlist (resolved server-side
   * via `requireSoleAdmin()`). Administrators are NOT pinned (R-1 exception): they
   * may preview both tracks, because the rest of the admin surface already allows
   * this. Their `User.track` is never modified, and on the track that is not their
   * own the paid CTA is replaced by a note so no price is shown that the server
   * will not charge. Non-admins keep the existing pin untouched.
   */
  isAdmin?: boolean;
}

/**
 * Adapter: render both tracks through the one `LandingTier` grid (design C-2).
 * Career tiers are already `LandingTier`; Sales tiers are `SalesPricingTier` and
 * are mapped across. Prices are carried over verbatim from the CMS content — the
 * grid derives the term-specific figures itself.
 *
 * The free Starter tier is FILTERED OUT here, not in the CMS defaults: the free
 * plan is now the "Free, until you're ready" top panel, and saved CMS content
 * overrides repo defaults, so a filter at the CMS layer would leave the column
 * visible on the live site.
 */
function toLandingTiers(track: Track, content: LandingContent): LandingTier[] {
  if (track === "career") {
    return content.pricing.tiers.filter((t) => t.badge !== "starter");
  }
  return content.sales.pricing.map((t) => ({
    name: t.name,
    price: t.price,
    billing: t.billing,
    badge: t.name === "Elite" ? "elite" : "pro",
    highlight: Boolean(t.featured),
    tooltip: t.description,
    description: t.description,
    features: t.features,
    cta: t.cta,
    href: SALES_PLAN_HREF(t.name.toLowerCase() as "pro" | "elite"),
  }));
}

export function PricingPageClient({
  content,
  starterPackItems,
  starterPackHeadline,
  userTrack = null,
  isAdmin = false,
}: PricingPageClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();

  // The member's OWN track, derived from the session. Separate from the track they
  // are allowed to VIEW: they differ only for an administrator.
  const ownTrack: Track | null =
    userTrack === "SALES" ? "sales" : userTrack === "CAREER" ? "career" : null;

  // R-1: a signed-in member is pinned to their own track; the other segment is
  // disabled so they never see prices the server will not charge. Administrators
  // are exempt — they preview both tracks (see `previewingOtherTrack` below).
  const lockedTrack: Track | null = isAdmin ? null : ownTrack;
  const disabledTrack: PlanTrack | undefined =
    lockedTrack === "sales" ? "CAREER" : lockedTrack === "career" ? "SALES" : undefined;

  // The initial view is always the member's OWN track — an admin whose account is
  // on Sales still lands on Sales and can switch away from there.
  const [track, setTrack] = useState<Track>(ownTrack ?? "career");
  const [term, setTerm] = useState<PlanTerm>("monthly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  // An administrator viewing a track that is NOT their own. On that track the paid
  // CTAs are replaced by a note (below) and `handlePurchase` refuses — no code path
  // may offer a price the server will not charge, since `/api/stripe/checkout` reads
  // `User.track` from the DB.
  const previewingOtherTrack = isAdmin && ownTrack !== null && track !== ownTrack;
  const ownTrackLabel = ownTrack === "sales" ? "Sales" : ownTrack === "career" ? "Career" : null;
  const adminNote =
    isAdmin && ownTrackLabel
      ? `Admin view — both tracks are shown. Purchases follow your account's own track (${ownTrackLabel}).`
      : isAdmin
        ? "Admin view — both tracks are shown."
        : undefined;
  const previewNotice = previewingOtherTrack
    ? `Purchases follow your account's own track (${ownTrackLabel}).`
    : undefined;

  // `?track=` drives the initial view for signed-out visitors; signed-in members
  // stay pinned to their own track. Administrators are not pinned, so the param
  // applies to them too.
  useEffect(() => {
    if (lockedTrack) return;
    const requested = searchParams.get("track");
    if (requested === "sales" || requested === "career") setTrack(requested);
  }, [searchParams, lockedTrack]);

  // Deep links: `?plan=pro|elite` -> `#plan-{plan}`; otherwise honour the hash
  // (`#pricing` / `#plan-*`). This is what keeps the old in-app anchors working.
  useEffect(() => {
    const plan = searchParams.get("plan");
    const hash =
      typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "";
    const target = plan === "pro" || plan === "elite" ? `plan-${plan}` : hash || "pricing";
    const timer = window.setTimeout(() => {
      const el = document.getElementById(target);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchParams, track]);

  async function handlePurchase(
    plan: "pro" | "elite",
    selectedTerm: PlanTerm,
    selectedCadence: BillingCadence
  ) {
    // Defence in depth: the CTA is already replaced by a note while previewing the
    // other track, but a purchase must never start there — the server would charge
    // the admin's own `User.track`, not the one on screen.
    if (previewingOtherTrack) return;
    if (!isPaymentsLive()) {
      setContactOpen(true);
      return;
    }
    if (!session?.user) {
      // R-3: use the PATH constant (no hash) — signup appends `?fromSignup=1` and
      // a param after a fragment would be lost.
      const callback = encodeURIComponent(
        track === "sales" ? SALES_PRICING_PATH : CAREER_PRICING_PATH
      );
      router.push(`/signup?plan=${plan}&track=${track}&callbackUrl=${callback}`);
      return;
    }
    setLoadingPlan(plan);
    try {
      // The track is NOT sent — the server reads User.track from the DB.
      const url = await startCheckout(plan, selectedTerm, selectedCadence);
      if (url) window.location.href = url;
    } catch {
      // A failed checkout leaves the member on /pricing; there is nothing to undo.
    } finally {
      setLoadingPlan(null);
    }
  }

  const tiers = toLandingTiers(track, content);
  const comparisonGroups =
    track === "sales" ? content.sales.comparison.groups : content.pricing.comparison.groups;

  return (
    <div className="bg-white">
      {/* Free plan — the top panel that REPLACED the old "Simple pricing" hero.
          The free tier is no longer a column in the grid; this is where a visitor
          signs up for the Starter Pack, via the same modal as before.

          The band is `bg-primary-soft` (the site's faint-blue band token) rather
          than white: it keeps the free plan reading as a distinct hero band now
          that the page is light, and it gives the white price card an edge to sit
          against. */}
      <section className="bg-primary-soft">
        <div className="page-container py-14 sm:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <h1 className="mb-5 font-serif text-[clamp(32px,5vw,52px)] font-bold tracking-tight text-gray-900">
                {PRICING_FREE_PANEL.title}
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-muted-fg sm:text-lg">
                {PRICING_FREE_PANEL.line1}
                <br />
                {PRICING_FREE_PANEL.line2}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-baseline justify-center gap-2">
                <span className="font-serif text-5xl font-bold tracking-tight text-gray-900">
                  {PRICING_FREE_PANEL.price}
                </span>
                <span className="text-sm text-muted-fg">{PRICING_FREE_PANEL.period}</span>
              </div>
              {/* The reference button for the whole page: pill shape + blue
                  gradient. Every other CTA on /pricing matches this — see
                  `Button variant="gradient"`. */}
              <Button
                variant="gradient"
                size="lg"
                onClick={() => setModalOpen(true)}
                className="mt-6 w-full rounded-full"
              >
                {PRICING_FREE_PANEL.cta}
              </Button>
              <p className="mt-3 text-center text-xs text-muted-fg">{PRICING_FREE_PANEL.note}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Track heading, term control and the tier columns, on the page's white
          background. `id="pricing"` is the anchor the old `#pricing` deep links
          resolve to.

          Everything here is the LIGHT palette (`tone="light"`, `text-gray-900`,
          `text-muted-fg`). The plan cards below keep their own dark track fills,
          which is why `PricingTierGrid` still renders them with the dark
          in-card palette — the cards are a dark surface on a light page. */}
      <section
        id="pricing"
        className={`${PAGE_SECTION_PY} scroll-mt-24`}
        style={{ backgroundColor: TRACK_BACKGROUNDS[track] }}
      >
        <div className="page-container">
          <Reveal className="mb-10 flex flex-col items-center gap-5 sm:mb-12">
            <TrackSwitcher
              value={track === "sales" ? "SALES" : "CAREER"}
              onChange={(next) => setTrack(next === "SALES" ? "sales" : "career")}
              disabledTrack={disabledTrack}
              note={adminNote}
              tone="light"
            />
            {/* Same clamp as the free-plan `h1` above — the two section headings are
                deliberately identical in size, weight and tracking. */}
            <h2 className="text-center font-serif text-[clamp(32px,5vw,52px)] font-bold tracking-tight text-gray-900">
              {PRICING_TRACK_HEADINGS[track === "sales" ? "SALES" : "CAREER"]}
            </h2>
            <PlanTermSelector value={term} onChange={setTerm} tone="light" showRate={false} />
          </Reveal>

          <PricingTierGrid
            tiers={tiers}
            variant="page"
            track={track === "sales" ? "SALES" : "CAREER"}
            term={term}
            onTermChange={setTerm}
            showTermSelector={false}
            onStarterModal={() => setModalOpen(true)}
            onPurchase={handlePurchase}
            loadingPlan={loadingPlan}
            comparisonGroups={comparisonGroups}
            previewNotice={previewNotice}
          />
          {/* Rendered once for the whole column row rather than inside every card. */}
          <p className="mt-6 text-center text-xs italic text-muted-fg">
            {PRICING_CONTENT_FOOTNOTE}
          </p>
        </div>
      </section>

      <StarterPackModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        items={starterPackItems}
        headline={starterPackHeadline || undefined}
      />
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </div>
  );
}
