import {
  ELITE_SUBSCRIPTION,
  PRO_SUBSCRIPTION,
  SALES_ELITE_SUBSCRIPTION,
  SALES_PRO_SUBSCRIPTION,
} from "@/data/pricing-shared";

export type BillingTrack = "CAREER" | "SALES" | null | undefined;
export type BillingTier = "STARTER" | "PRO" | "ELITE";

export function subscriptionPlanLabel(tier: BillingTier, track?: BillingTrack): string {
  if (tier === "STARTER") return "Starter (Free)";
  if (tier === "PRO") {
    return track === "SALES"
      ? `Pro · ${SALES_PRO_SUBSCRIPTION.label}`
      : `Pro · ${PRO_SUBSCRIPTION.label}`;
  }
  return track === "SALES"
    ? `Elite · ${SALES_ELITE_SUBSCRIPTION.label}`
    : `Elite · ${ELITE_SUBSCRIPTION.label}`;
}

export function subscriptionStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case "active":
      return "Active";
    case "past_due":
      return "Past due";
    case "cancelled":
    case "canceled":
      return "Cancelled";
    case "inactive":
      return "No active subscription";
    default:
      return status ? status.replace(/_/g, " ") : "No active subscription";
  }
}

export function subscriptionStatusTone(
  status: string | null | undefined
): "success" | "warning" | "muted" {
  if (status === "active") return "success";
  if (status === "past_due") return "warning";
  return "muted";
}
