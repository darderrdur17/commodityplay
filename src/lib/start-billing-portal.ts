/** Open Stripe Customer Portal for invoices, payment method, and cancellation. */
export async function startBillingPortal(): Promise<string | null> {
  const res = await fetch("/api/stripe/portal", { method: "POST" });

  if (!res.ok) return null;

  const data = (await res.json()) as { url?: string };
  return data.url ?? null;
}
