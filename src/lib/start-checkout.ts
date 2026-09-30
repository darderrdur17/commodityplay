import type { PlanTerm } from "@/data/pricing-shared";
import type { BillingCadence } from "@/data/pricing-shared";

export type CheckoutPlan = "pro" | "elite";

/**
 * Start Stripe Checkout for Pro or Elite. Returns redirect URL or null on failure.
 *
 * `term` defaults to "monthly" so all three existing callers keep working unchanged.
 */
export async function startCheckout(
  plan: CheckoutPlan,
  term: PlanTerm = "monthly",
  cadence: BillingCadence = "monthly"
): Promise<string | null> {
  const res = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan, term, cadence }),
  });

  const data = (await res.json()) as { url?: string; error?: string };
  if (!res.ok) {
    throw new Error(data.error || "Could not start checkout");
  }
  return data.url ?? null;
}
