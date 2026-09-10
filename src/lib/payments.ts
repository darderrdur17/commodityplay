/**
 * Paid checkout stays closed until files are ready and this flag is flipped in Vercel.
 * Set NEXT_PUBLIC_PAYMENTS_ENABLED=true (and Stripe keys) to go live.
 */
export function isPaymentsLive(): boolean {
  return process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === "true";
}

/** Server-only: live flag plus Stripe secret. */
export function isCheckoutConfigured(): boolean {
  return isPaymentsLive() && Boolean(process.env.STRIPE_SECRET_KEY);
}
