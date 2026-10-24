import type { PlanTerm } from "@/data/pricing-shared";
import type { BillingCadence } from "@/data/pricing-shared";

export type CheckoutPlan = "pro" | "elite";

/**
 * Start Stripe Checkout for Pro or Elite. Returns redirect URL or null on failure.
 *
 * `term` defaults to "monthly" so all three existing callers keep working unchanged.
 *
 * `referralCode` is optional and only sent when the member actually typed one.
 * It is NOT trusted: `/api/stripe/checkout` re-validates the code (existence,
 * expiry, eligibility and both single-use rules) before attaching any discount.
 */
export async function startCheckout(
  plan: CheckoutPlan,
  term: PlanTerm = "monthly",
  cadence: BillingCadence = "monthly",
  referralCode?: string
): Promise<string | null> {
  const code = referralCode?.trim();
  const res = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      plan,
      term,
      cadence,
      ...(code ? { referralCode: code } : {}),
    }),
  });

  const data = (await res.json()) as { url?: string; error?: string };
  if (!res.ok) {
    throw new Error(data.error || "Could not start checkout");
  }
  return data.url ?? null;
}
