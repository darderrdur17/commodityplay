"use client";

import { useState } from "react";
import {
  ArrowRight,
  CreditCard,
  ExternalLink,
  FileText,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  subscriptionPlanLabel,
  subscriptionStatusLabel,
  subscriptionStatusTone,
  type BillingTier,
  type BillingTrack,
} from "@/lib/billing";
import { startBillingPortal, type BillingPortalFlow } from "@/lib/start-billing-portal";
import { startCheckout, type CheckoutPlan } from "@/lib/start-checkout";
import { cn, formatDate } from "@/lib/utils";
import { PlanTermSelector } from "@/components/pricing/plan-term-selector";
import type { PlanTerm } from "@/data/pricing-shared";

interface AccountBillingSectionProps {
  tier: BillingTier;
  track?: BillingTrack;
  stripeStatus?: string | null;
  stripeCurrentPeriodEnd?: Date | null;
  hasStripeCustomer: boolean;
  /** False until Stripe (and later PayNow) keys are configured in production. */
  paymentsEnabled?: boolean;
}

export function AccountBillingSection({
  tier,
  track,
  stripeStatus,
  stripeCurrentPeriodEnd,
  hasStripeCustomer,
  paymentsEnabled = false,
}: AccountBillingSectionProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [term, setTerm] = useState<PlanTerm>("monthly");

  const statusTone = subscriptionStatusTone(stripeStatus);
  const isPastDue = stripeStatus === "past_due";
  const showRenewal = tier !== "STARTER" && stripeCurrentPeriodEnd;
  const canManageBilling = hasStripeCustomer && tier !== "STARTER";
  const upgradePlan: CheckoutPlan | null =
    tier === "STARTER" ? "pro" : tier === "PRO" ? "elite" : null;

  async function openPortal(flow: BillingPortalFlow, actionKey: string) {
    setLoadingAction(actionKey);
    setError(null);
    try {
      const url = await startBillingPortal(flow);
      if (url) window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open billing portal.");
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleUpgrade(plan: CheckoutPlan, term: PlanTerm = "monthly") {
    setLoadingAction(`upgrade-${plan}`);
    setError(null);
    try {
      // The track is NOT sent — the server reads User.track from the DB.
      const url = await startCheckout(plan, term);
      if (url) window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout.");
    } finally {
      setLoadingAction(null);
    }
  }

  function ActionButton({
    actionKey,
    flow,
    label,
    icon: Icon,
    variant = "outline",
  }: {
    actionKey: string;
    flow: BillingPortalFlow;
    label: string;
    icon: typeof CreditCard;
    variant?: "outline" | "default";
  }) {
    const loading = loadingAction === actionKey;
    return (
      <Button
        variant={variant}
        size="sm"
        onClick={() => openPortal(flow, actionKey)}
        disabled={Boolean(loadingAction)}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <Icon className="w-4 h-4" />
            {label}
            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </>
        )}
      </Button>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="font-serif text-lg font-bold text-gray-900">Billing &amp; Subscription</h2>
        <p className="text-xs text-muted-fg mt-1">
          {paymentsEnabled
            ? "Manage your plan, payment method, and invoices via our secure checkout."
            : "View your plan here. Online card and PayNow checkout will be enabled before go-live."}
        </p>
      </div>

      {!paymentsEnabled && (
        <div className="mx-6 mt-4 rounded-xl border border-primary-line bg-primary-soft px-4 py-3 text-sm text-primary-800">
          Payments are not live yet — this page is ready for when Stripe / PayNow is connected. You
          can still review your tier and billing status below.
        </div>
      )}

      {isPastDue && paymentsEnabled && (
        <div className="mx-6 mt-4 flex gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Payment overdue</p>
            <p className="text-xs mt-0.5 text-red-700/90">
              Update your payment method or pay the open invoice to restore access.
            </p>
          </div>
        </div>
      )}

      <div className="divide-y divide-border">
        <div className="flex items-center gap-3 px-6 py-4">
          <span className="text-sm text-muted-fg flex-1">Current plan</span>
          <span className="text-sm font-medium text-gray-800">{subscriptionPlanLabel(tier, track)}</span>
        </div>

        <div className="flex items-center gap-3 px-6 py-4">
          <span className="text-sm text-muted-fg flex-1">Status</span>
          <span
            className={cn(
              "text-sm font-medium capitalize",
              statusTone === "success" && "text-green-600",
              statusTone === "warning" && "text-red-500",
              statusTone === "muted" && "text-gray-500"
            )}
          >
            {tier === "STARTER" && !hasStripeCustomer
              ? "Free"
              : subscriptionStatusLabel(stripeStatus)}
          </span>
        </div>

        {showRenewal && (
          <div className="flex items-center gap-3 px-6 py-4">
            <span className="text-sm text-muted-fg flex-1">Next billing date</span>
            <span className="text-sm font-medium text-gray-800">
              {formatDate(stripeCurrentPeriodEnd!)}
            </span>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-border space-y-4">
        {canManageBilling && paymentsEnabled && (
          <div className="flex flex-wrap gap-2">
            {isPastDue && (
              <ActionButton
                actionKey="pay-now"
                flow="manage"
                label="Pay now"
                icon={CreditCard}
                variant="default"
              />
            )}
            <ActionButton
              actionKey="manage"
              flow="manage"
              label="Manage subscription"
              icon={CreditCard}
            />
            <ActionButton
              actionKey="payment-method"
              flow="payment_method"
              label="Update payment method"
              icon={CreditCard}
            />
            <ActionButton
              actionKey="invoices"
              flow="invoices"
              label="View invoices"
              icon={FileText}
            />
          </div>
        )}

        {upgradePlan && paymentsEnabled && (
          <div className="space-y-2">
            <PlanTermSelector
              track={track === "SALES" ? "SALES" : "CAREER"}
              tier={upgradePlan === "elite" ? "ELITE" : "PRO"}
              value={term}
              onChange={setTerm}
            />
            <Button
              size="sm"
              onClick={() => handleUpgrade(upgradePlan, term)}
              disabled={Boolean(loadingAction)}
            >
              {loadingAction === `upgrade-${upgradePlan}` ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {tier === "STARTER" ? "Upgrade to Pro" : "Upgrade to Elite"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        )}

        {tier === "STARTER" && !hasStripeCustomer && paymentsEnabled && (
          <p className="text-xs text-muted-fg">
            Upgrade to Pro or Elite to start a subscription. Checkout opens in a secure Stripe
            window with card-on-file support (Stripe Link). Cancel anytime from this page.
          </p>
        )}

        {canManageBilling && paymentsEnabled && (
          <p className="text-xs text-muted-fg">
            Billing is powered by Stripe. Payment method, invoices, and cancellation open in
            Stripe&apos;s hosted portal — the same flow used by Anthropic and other subscription
            products.
          </p>
        )}

        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    </div>
  );
}
