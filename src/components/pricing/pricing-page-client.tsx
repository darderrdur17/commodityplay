"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { GradientOrbs, Reveal } from "@/components/animations";
import { SectionCategoryLabel } from "@/components/landing/section-category-label";
import { StarterPackModal } from "@/components/landing/starter-pack-modal";
import { ContactModal } from "@/components/landing/contact-modal";
import { PricingTierGrid } from "@/components/pricing/pricing-tier-grid";
import { PlanTermSelector } from "@/components/pricing/plan-term-selector";
import { TrackSwitcher } from "@/components/pricing/track-switcher";
import { PRICING_CONTENT_FOOTNOTE, PRICING_HERO } from "@/data/pricing-shared";
import type { BillingCadence, PlanTerm, PlanTrack } from "@/data/pricing-shared";
import type { LandingContent, LandingTier } from "@/data/landing-content";
import { CAREER_PRICING_PATH, SALES_PLAN_HREF, SALES_PRICING_PATH } from "@/lib/pricing-routes";
import { isPaymentsLive } from "@/lib/payments";
import { startCheckout } from "@/lib/start-checkout";
import { PAGE_SECTION_PY } from "@/lib/layout-constants";

type Track = "career" | "sales";

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
 */
function toLandingTiers(track: Track, content: LandingContent): LandingTier[] {
  if (track === "career") return content.pricing.tiers;
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
  const [cadence, setCadence] = useState<BillingCadence>("monthly");
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
      {/* Hero */}
      <section className="relative bg-primary-800 section-dark overflow-hidden pt-14 pb-16 sm:pt-20 sm:pb-24">
        <GradientOrbs />
        <div className="relative z-10 page-container text-center">
          <Reveal>
            <SectionCategoryLabel colorClass="text-white/50">{PRICING_HERO.eyebrow}</SectionCategoryLabel>
            <h1 className="font-serif text-[clamp(32px,5vw,52px)] font-bold tracking-tight text-white mb-4">
              {PRICING_HERO.title}
            </h1>
            <p className="text-white/65 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
              {PRICING_HERO.subtitle}
            </p>
          </Reveal>
        </div>
      </section>

      {/* Track + term controls and the tier columns. `id="pricing"` is the anchor
          the old `#pricing` deep links resolve to. */}
      <section id="pricing" className={`${PAGE_SECTION_PY} page-container scroll-mt-24`}>
        <Reveal className="flex flex-col items-center gap-5 mb-10 sm:mb-12">
          <TrackSwitcher
            value={track === "sales" ? "SALES" : "CAREER"}
            onChange={(next) => setTrack(next === "SALES" ? "sales" : "career")}
            disabledTrack={disabledTrack}
            note={adminNote}
          />
          <div className="w-full max-w-sm">
            <PlanTermSelector
              value={term}
              onChange={setTerm}
              cadence={cadence}
              onCadenceChange={setCadence}
              tone="light"
              showRate={false}
            />
          </div>
        </Reveal>

        <PricingTierGrid
          tiers={tiers}
          variant="page"
          track={track === "sales" ? "SALES" : "CAREER"}
          term={term}
          cadence={cadence}
          onTermChange={setTerm}
          onCadenceChange={setCadence}
          showTermSelector={false}
          onStarterModal={() => setModalOpen(true)}
          onPurchase={handlePurchase}
          loadingPlan={loadingPlan}
          comparisonGroups={comparisonGroups}
          previewNotice={previewNotice}
        />
        {/* Rendered once for the whole column row rather than inside every card. */}
        <p className="text-xs italic text-muted-fg text-center mt-6">
          {PRICING_CONTENT_FOOTNOTE}
        </p>
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
