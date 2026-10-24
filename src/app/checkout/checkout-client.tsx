"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Loader2, Tag, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ContactModal } from "@/components/landing/contact-modal";
import { startCheckout } from "@/lib/start-checkout";
import { PAYMENTS_STATUS_COPY, PAYMENTS_STATUS_LABEL } from "@/lib/payments";
import {
  PLAN_TERMS,
  formatMoney,
  monthlyRate,
  priceLabelPerMonth,
  termSavingsPercent,
  termTotal,
} from "@/data/pricing-shared";
import type { BillingCadence, PlanTerm, PlanTier, PlanTrack } from "@/data/pricing-shared";

/**
 * The `/checkout` step.
 *
 * Two jobs, and nothing else:
 *   1. show the member exactly what they are about to be charged, derived from
 *      `src/data/pricing-shared.ts` (never a literal amount), and
 *   2. collect an OPTIONAL referral code, validated server-side.
 *
 * The code is not trusted here. "Validate" is a convenience so the member sees a
 * rejection before being handed to Stripe; `/api/stripe/checkout` re-runs the whole
 * check and is the only thing that can attach a discount.
 */
export interface CheckoutClientProps {
  plan: "pro" | "elite";
  term: PlanTerm;
  cadence: BillingCadence;
  /** The member's own track — the server charges this one regardless. */
  track: PlanTrack;
  /** Whether to render the referral field at all. Cosmetic only. */
  eligible: boolean;
  /** `isPaymentsLive()`, resolved server-side so both renders agree. */
  paymentsLive: boolean;
  /** True only when a referral coupon exists in the environment. */
  rewardConfigured: boolean;
  /** Copy for "code accepted, reward not decided yet". */
  rewardPendingMessage: string;
  backHref: string;
}

interface ValidateResult {
  valid: boolean;
  message: string | null;
  code: string;
}

const inputClass =
  "w-full h-10 px-3 rounded-lg border border-border text-sm font-mono tracking-wide uppercase focus:outline-none focus:ring-2 focus:ring-primary-400";

export function CheckoutClient({
  plan,
  term,
  cadence,
  track,
  eligible,
  paymentsLive,
  rewardConfigured,
  rewardPendingMessage,
  backHref,
}: CheckoutClientProps) {
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<ValidateResult | null>(null);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contactOpen, setContactOpen] = useState(false);

  /**
   * First line of defence against a double-submit, and the reason it is a ref and
   * not just `paying`: the Button is disabled while `paying` is true, but React
   * state only becomes visible on the NEXT render, so a second click dispatched
   * before that render would still enter this handler and fire a second POST. The
   * ref is synchronous, so the second call returns immediately.
   *
   * The server has a backstop either way — the 10-second reuse lock in
   * `/api/stripe/checkout` — but a duplicate session should never be requested.
   */
  const payInFlight = useRef(false);

  const tier: PlanTier = plan === "elite" ? "ELITE" : "PRO";
  const trackLabel = track === "SALES" ? "Sales" : "Career";
  const tierLabel = tier === "ELITE" ? "Elite" : "Pro";
  const monthly = monthlyRate(track, tier, term);
  const total = termTotal(track, tier, term);
  const savings = termSavingsPercent(term);
  const termLabel = PLAN_TERMS[term].shortLabel;

  async function handleValidate() {
    const value = code.trim();
    if (!value) {
      setResult({ valid: false, message: "Enter a referral code.", code: "" });
      return;
    }

    setChecking(true);
    setError(null);
    try {
      const res = await fetch("/api/referral/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: value }),
      });
      const data = (await res.json()) as {
        valid?: boolean;
        message?: string | null;
        code?: string;
        error?: string;
      };

      if (!res.ok) {
        setResult({
          valid: false,
          message: data.error || "Could not check that code. Please try again.",
          code: value,
        });
        return;
      }

      setResult({
        valid: Boolean(data.valid),
        message: data.message ?? null,
        code: data.code || value,
      });
    } catch {
      setResult({
        valid: false,
        message: "Could not check that code. Please try again.",
        code: value,
      });
    } finally {
      setChecking(false);
    }
  }

  function handleRemoveCode() {
    setCode("");
    setResult(null);
    setError(null);
  }

  async function handlePay() {
    if (payInFlight.current) return;
    payInFlight.current = true;
    setPaying(true);
    setError(null);
    try {
      // The code is sent even if the member never pressed "Validate": the server
      // is the gate, and refusing to submit would just be a second, weaker gate.
      const url = await startCheckout(plan, term, cadence, code.trim() || undefined);
      if (url) {
        window.location.href = url;
        return;
      }
      setError("Could not start checkout. Please try again.");
    } catch (err) {
      // A rejected referral code surfaces here with the server's own message.
      setError(err instanceof Error ? err.message : "Could not start checkout.");
    } finally {
      payInFlight.current = false;
      setPaying(false);
    }
  }

  return (
    <div className="bg-white">
      <div className="page-container max-w-2xl py-10 sm:py-14">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-fg hover:text-primary-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to plans
        </Link>

        <h1 className="mt-5 font-serif text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
          Checkout
        </h1>
        <p className="mt-2 text-sm text-muted-fg">
          {/* An ineligible member has no referral field, so inviting them to "add a
              referral code" would point at something that is not on the page.
              ⚠️ "then continue to secure payment" is only true while payments are
              LIVE — with checkout closed it promises a step that does not exist. */}
          {paymentsLive
            ? eligible
              ? "Review your plan, add a referral code if you have one, then continue to secure payment."
              : "Review your plan, then continue to secure payment."
            : eligible
              ? "Review your plan and add a referral code if you have one."
              : "Review your plan."}
        </p>

        {/* ── Plan summary ─────────────────────────────────────────────────── */}
        <div className="mt-8 rounded-xl border border-border bg-white overflow-hidden">
          <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-border bg-secondary">
            <div>
              <p className="font-serif text-lg font-bold text-gray-900">
                {trackLabel} {tierLabel}
              </p>
              <p className="mt-0.5 text-xs text-muted-fg">
                {priceLabelPerMonth(monthly)} · billed {termLabel.toLowerCase()}
              </p>
            </div>
            <Badge variant={tier === "ELITE" ? "elite" : "pro"} size="sm">
              {tierLabel}
            </Badge>
          </div>

          <dl className="px-5 py-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted-fg">Plan</dt>
              <dd className="font-medium text-gray-900">
                {trackLabel} {tierLabel}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-fg">Billing</dt>
              <dd className="font-medium text-gray-900">
                {PLAN_TERMS[term].label}
                {savings > 0 ? ` · save ${savings}%` : ""}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-fg">Access</dt>
              <dd className="font-medium text-gray-900">
                {PLAN_TERMS[term].accessMonths} month
                {PLAN_TERMS[term].accessMonths === 1 ? "" : "s"}
              </dd>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-2">
              <dt className="font-semibold text-gray-900">Due today</dt>
              <dd className="font-serif text-xl font-bold text-gray-900">{formatMoney(total)}</dd>
            </div>
          </dl>
        </div>

        {/* ── Referral code ────────────────────────────────────────────────── */}
        {paymentsLive && (
          <div className="mt-6 rounded-xl border border-border bg-white p-5">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-primary-400" />
              <p className="text-sm font-semibold text-gray-900">Referral code</p>
              {/* "optional" only makes sense when there IS a field to leave blank.
                  For an ineligible member the panel is informational, and calling
                  it optional contradicts the line below it. */}
              {eligible && <span className="text-xs text-muted-fg">optional</span>}
            </div>

            {eligible ? (
              <>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    value={code}
                    onChange={(event) => {
                      // Uppercase as the member types: codes are stored uppercase and
                      // this saves a confusing "we could not find that code".
                      setCode(event.target.value.toUpperCase());
                      setResult(null);
                      setError(null);
                    }}
                    placeholder="CP-XXXX-XXXX"
                    autoComplete="off"
                    spellCheck={false}
                    aria-label="Referral code"
                    className={inputClass}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleValidate}
                      loading={checking}
                      disabled={paying || code.trim().length === 0}
                    >
                      Validate
                    </Button>
                    {(code.length > 0 || result) && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handleRemoveCode}
                        disabled={paying}
                      >
                        <X className="w-4 h-4" /> Remove
                      </Button>
                    )}
                  </div>
                </div>

                {result && (
                  <div
                    className={
                      result.valid
                        ? "mt-3 flex items-start gap-1.5 text-sm text-green-700"
                        : "mt-3 flex items-start gap-1.5 text-sm text-red-600"
                    }
                  >
                    {result.valid ? (
                      <Check className="w-4 h-4 mt-0.5 shrink-0" />
                    ) : (
                      <X className="w-4 h-4 mt-0.5 shrink-0" />
                    )}
                    {result.valid ? (
                      <div>
                        {/* "Accepted", not "applied": the CODE is accepted. Whether a
                            DISCOUNT is attached is a separate fact, and while the
                            reward is undecided the answer is no — see below. */}
                        <p className="font-semibold">{result.code} accepted.</p>
                        <p className="mt-0.5">
                          {rewardConfigured
                            ? "Your referral discount will be applied on your first invoice."
                            : rewardPendingMessage}
                        </p>
                      </div>
                    ) : (
                      <span>{result.message}</span>
                    )}
                  </div>
                )}
              </>
            ) : (
              // Neutral, no input. The server rejects an ineligible member anyway —
              // this line exists so the page does not look broken to them.
              <p className="mt-2 text-sm text-muted-fg">
                Referral codes are available to university and corporate accounts.
              </p>
            )}
          </div>
        )}

        {/* ── Pay / contact ────────────────────────────────────────────────── */}
        {paymentsLive ? (
          <div className="mt-6">
            <Button
              type="button"
              variant="gradient"
              size="lg"
              className="w-full rounded-full"
              onClick={handlePay}
              loading={paying}
            >
              Pay {formatMoney(total)}
            </Button>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            <p className="mt-3 text-center text-xs text-muted-fg">
              You will be redirected to Stripe to complete payment. Cancel anytime.
            </p>
          </div>
        ) : (
          // Checkout is closed while the Stripe integration is finished, so the status
          // reads "Coming soon" rather than an internal phrase like "not live yet" —
          // and rather than a dead Pay button. The contact route is what DOES work.
          <div className="mt-6 rounded-xl border border-border bg-primary-soft p-5">
            <Badge variant="warning">{PAYMENTS_STATUS_LABEL}</Badge>
            <p className="mt-2 text-sm font-semibold text-gray-900">
              {PAYMENTS_STATUS_COPY.checkoutTitle}
            </p>
            <p className="mt-1 text-sm text-muted-fg">{PAYMENTS_STATUS_COPY.checkoutBody}</p>
            <Button
              type="button"
              variant="gradient"
              className="mt-4 rounded-full"
              onClick={() => setContactOpen(true)}
            >
              Contact us
            </Button>
          </div>
        )}

        {paying && (
          <p className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-fg">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Starting secure checkout…
          </p>
        )}
      </div>

      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </div>
  );
}
