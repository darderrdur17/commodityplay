"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CAREER_PLAN_HREF, SALES_PLAN_HREF } from "@/lib/pricing-routes";
import {
  subscriptionPlanLabel,
  subscriptionStatusLabel,
  subscriptionStatusTone,
  type BillingTier,
  type BillingTrack,
} from "@/lib/billing";
import { startBillingPortal } from "@/lib/start-billing-portal";
import { cn, formatDate } from "@/lib/utils";

interface AccountBillingSectionProps {
  tier: BillingTier;
  track?: BillingTrack;
  stripeStatus?: string | null;
  stripeCurrentPeriodEnd?: Date | null;
  hasStripeCustomer: boolean;
}

export function AccountBillingSection({
  tier,
  track,
  stripeStatus,
  stripeCurrentPeriodEnd,
  hasStripeCustomer,
}: AccountBillingSectionProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const planHref = track === "SALES" ? SALES_PLAN_HREF : CAREER_PLAN_HREF;
  const statusTone = subscriptionStatusTone(stripeStatus);
  const showRenewal = tier !== "STARTER" && stripeCurrentPeriodEnd;
  const canManageBilling = hasStripeCustomer && tier !== "STARTER";

  async function handleManageBilling() {
    setLoading(true);
    setError(null);
    try {
      const url = await startBillingPortal();
      if (url) {
        window.location.href = url;
        return;
      }
      setError("Could not open billing portal. Please try again or contact support.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="font-serif text-lg font-bold text-gray-900">Billing &amp; Subscription</h2>
        <p className="text-xs text-muted-fg mt-1">
          View your plan, renewal date, invoices, and payment method.
        </p>
      </div>

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

      <div className="p-6 border-t border-border flex flex-wrap gap-3">
        {canManageBilling && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleManageBilling}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Manage billing
                <ExternalLink className="w-4 h-4" />
              </>
            )}
          </Button>
        )}

        {tier !== "ELITE" && (
          <Link href={tier === "STARTER" ? planHref("pro") : planHref("elite")}>
            <Button size="sm">
              {tier === "STARTER" ? "Upgrade to Pro" : "Upgrade to Elite"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        )}

        {tier === "STARTER" && !hasStripeCustomer && (
          <p className="text-xs text-muted-fg w-full">
            Upgrade to Pro or Elite to start a subscription. You can cancel anytime from this page.
          </p>
        )}

        {error && <p className="text-xs text-red-500 w-full">{error}</p>}
      </div>
    </div>
  );
}
