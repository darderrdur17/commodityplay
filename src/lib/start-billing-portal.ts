export type BillingPortalFlow = "manage" | "payment_method" | "invoices";

/** Open Stripe Customer Portal for invoices, payment method, and cancellation. */
export async function startBillingPortal(
  flow: BillingPortalFlow = "manage"
): Promise<string | null> {
  const res = await fetch("/api/stripe/portal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ flow }),
  });

  const data = (await res.json()) as { url?: string; error?: string };
  if (!res.ok) {
    throw new Error(data.error || "Could not open billing portal");
  }
  return data.url ?? null;
}
