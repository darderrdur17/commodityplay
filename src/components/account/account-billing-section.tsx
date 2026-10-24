"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CreditCard,
  ExternalLink,
  FileText,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  subscriptionPlanLabel,
  subscriptionStatusLabel,
  subscriptionStatusTone,
  type BillingTier,
  type BillingTrack,
} from "@/lib/billing";
import { PAYMENTS_STATUS_COPY, PAYMENTS_STATUS_LABEL } from "@/lib/payments";
import { startBillingPortal, type BillingPortalFlow } from "@/lib/start-billing-portal";
import { cn, formatDate } from "@/lib/utils";
import { LANDING_CTA } from "@/lib/landing-cta";

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

  const statusTone = subscriptionStatusTone(stripeStatus);
  const isPastDue = stripeStatus === "past_due";
  const showRenewal = tier !== "STARTER" && stripeCurrentPeriodEnd;
  const canManageBilling = hasStripeCustomer && tier !== "STARTER";
  // Only whether an upgrade exists matters here now — the button hands off to
  // /pricing, which owns the plan choice, the term toggle and the checkout call.
  const canUpgrade = tier === "STARTER" || tier === "PRO";

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
            : PAYMENTS_STATUS_COPY.accountSubtitle}
        </p>
      </div>

      {!paymentsEnabled && (
        <div className="mx-6 mt-4 flex items-start gap-2 rounded-xl border border-primary-line bg-primary-soft px-4 py-3 text-sm text-primary-800">
          <Badge variant="warning" className="mt-0.5 flex-shrink-0">
            {PAYMENTS_STATUS_LABEL}
          </Badge>
          <span>{PAYMENTS_STATUS_COPY.accountNote}</span>
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

        {canUpgrade && paymentsEnabled && (
          <Link href="/pricing">
            {/* No size override: deliberately the default, so this matches the
                "Save profile" button on the Personal info card above (owner
                request, 20 Oct 2026). It used to be `size="sm"`, which rendered
                it visibly smaller. */}
            <Button className={LANDING_CTA}>
              Upgrade Plan
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        )}

        {tier === "STARTER" && !hasStripeCustomer && paymentsEnabled && (
          <p className="text-xs text-muted-fg">
            Compare Pro and Elite on the pricing page. Checkout opens in a secure Stripe window
            with card-on-file support (Stripe Link).
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
