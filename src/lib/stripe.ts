import Stripe from "stripe";

let stripeClient: Stripe | null = null;

/** Lazy Stripe client — avoids build failure when STRIPE_SECRET_KEY is unset at compile time. */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(key, {
      apiVersion: "2025-02-24.acacia",
      typescript: true,
    });
  }

  return stripeClient;
}

export function getStripePrices() {
  const pro = process.env.STRIPE_PRO_PRICE_ID;
  const elite = process.env.STRIPE_ELITE_PRICE_ID;

  if (!pro || !elite) {
    throw new Error("STRIPE_PRO_PRICE_ID and STRIPE_ELITE_PRICE_ID must be configured");
  }

  // NOTE: PRO_MONTHLY is the ONE-TIME Pro price (SGD 99). The key name is kept for
  // backwards compatibility; checkout must use mode "payment" for it.
  // ELITE_MONTHLY is the recurring Elite price (SGD 299/mo) — mode "subscription".
  return {
    PRO_MONTHLY: pro,
    ELITE_MONTHLY: elite,
  } as const;
}

export async function createOrRetrieveCustomer(userId: string, email: string) {
  const stripe = getStripe();
  const { prisma } = await import("@/lib/prisma");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });

  if (user?.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

/**
 * Authoritative price → tier resolution.
 *
 * Returns `null` for an unknown price id so callers can keep the member's existing
 * tier instead of silently downgrading a paying member to STARTER.
 */
export function resolveTierFromPriceId(
  priceId: string | null | undefined
): "STARTER" | "PRO" | "ELITE" | null {
  if (!priceId) return null;

  try {
    const prices = getStripePrices();
    if (priceId === prices.ELITE_MONTHLY) return "ELITE";
    if (priceId === prices.PRO_MONTHLY) return "PRO";
  } catch {
    // Stripe price env vars are not configured — treat as unknown rather than throwing.
    return null;
  }

  return null;
}

/**
 * Legacy helper. Display-only (receipt labels, badges) — an unknown price maps to
 * STARTER here, which is fine for copy but must never drive an access decision.
 */
export function getTierFromPriceId(priceId: string): "STARTER" | "PRO" | "ELITE" {
  return resolveTierFromPriceId(priceId) ?? "STARTER";
}

/**
 * Resolve the tier for a one-time payment by matching the amount charged against
 * the configured one-time Pro price. Used as a safety net for
 * `payment_intent.succeeded`, which carries no line items.
 */
export async function resolveOneTimeTierFromAmount(
  amountCents: number | null | undefined,
  currency: string | null | undefined
): Promise<"PRO" | null> {
  if (!amountCents) return null;
  if (currency && currency.toLowerCase() !== "sgd") return null;

  try {
    const prices = getStripePrices();
    const price = await getStripe().prices.retrieve(prices.PRO_MONTHLY);
    if (price.unit_amount === amountCents) return "PRO";
  } catch (err) {
    console.error("[stripe] could not resolve one-time price amount:", err);
  }

  return null;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Webhook idempotency
 *
 * Stripe may deliver the same event more than once. We persist the event id and
 * skip replays. The table is created lazily with raw SQL (mirroring the
 * `ensure*` bootstrap in src/lib/setup-database.ts) because we cannot run
 * `prisma migrate` against the hosted DB. If the table cannot be created we
 * degrade to an in-memory guard instead of failing the webhook.
 * ──────────────────────────────────────────────────────────────────────────── */

const STRIPE_EVENT_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS "StripeEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StripeEvent_pkey" PRIMARY KEY ("id")
);
`;

const MEMORY_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const recentEvents = new Map<string, number>();

let stripeEventTableReady: Promise<boolean> | null = null;

async function ensureStripeEventTable(): Promise<boolean> {
  if (stripeEventTableReady) return stripeEventTableReady;

  stripeEventTableReady = (async () => {
    try {
      const { prisma } = await import("@/lib/prisma");
      await prisma.$executeRawUnsafe(STRIPE_EVENT_TABLE_SQL);
      return true;
    } catch (err) {
      console.error(
        "[stripe] StripeEvent table unavailable, using in-memory dedupe only:",
        err
      );
      return false;
    }
  })();

  return stripeEventTableReady;
}

function claimInMemory(eventId: string): boolean {
  const now = Date.now();
  for (const [id, seenAt] of recentEvents) {
    if (now - seenAt > MEMORY_TTL_MS) recentEvents.delete(id);
  }
  if (recentEvents.has(eventId)) return false;
  recentEvents.set(eventId, now);
  return true;
}

/**
 * Claim an event for processing.
 * @returns true if the caller should process it; false if it is a redelivery.
 */
export async function claimStripeEvent(
  eventId: string | null | undefined,
  eventType: string
): Promise<boolean> {
  if (!eventId) return true; // nothing to key on — process once

  if (await ensureStripeEventTable()) {
    try {
      const { prisma } = await import("@/lib/prisma");
      const inserted = await prisma.$executeRaw`
        INSERT INTO "StripeEvent" ("id", "type", "createdAt")
        VALUES (${eventId}, ${eventType}, NOW())
        ON CONFLICT ("id") DO NOTHING
      `;
      return Number(inserted) > 0;
    } catch (err) {
      console.error("[stripe] event claim insert failed:", err);
    }
  }

  return claimInMemory(eventId);
}

/**
 * Release a previously claimed event, so a failed handler can be retried by Stripe.
 */
export async function releaseStripeEvent(eventId: string | null | undefined): Promise<void> {
  if (!eventId) return;

  recentEvents.delete(eventId);

  if (await ensureStripeEventTable()) {
    try {
      const { prisma } = await import("@/lib/prisma");
      await prisma.$executeRaw`DELETE FROM "StripeEvent" WHERE "id" = ${eventId}`;
    } catch (err) {
      console.error("[stripe] event claim release failed:", err);
    }
  }
}
