import Stripe from "stripe";
import type { PlanTerm, PlanTier, PlanTrack } from "@/data/pricing-shared";

let stripeClient: Stripe | null = null;

/** Lazy Stripe client — avoids build failure when STRIPE_SECRET_KEY is unset at compile time. */
/** True when the configured secret is a Stripe test key. */
export function isStripeTestSecret(): boolean {
  return (process.env.STRIPE_SECRET_KEY ?? "").includes("sk_test_");
}

/**
 * Whether this webhook may write `User.tier` / billing columns.
 *
 * Refuse:
 *  - a live event while the secret is `sk_test_` (or the reverse)
 *  - any test-key event on Vercel Production, so a leftover test secret cannot
 *    grant Pro/Elite on real member rows
 */
export function shouldApplyStripeTierWrites(livemode: boolean): boolean {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  const testKey = key.includes("sk_test_");
  const liveKey = key.includes("sk_live_");
  if (testKey && livemode) return false;
  if (liveKey && !livemode) return false;
  if (testKey && process.env.VERCEL_ENV === "production") return false;
  return true;
}

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

/**
 * All four prices are RECURRING monthly subscriptions (no one-time product remains).
 * Career Pro S$19 · Career Elite S$34 · Sales Pro S$39 · Sales Elite S$56.
 *
 * These amounts MUST equal `PLAN_BASE_PRICE` in `src/data/pricing-shared.ts`. That
 * file is what the page QUOTES; this one is what the member is BILLED. They are two
 * halves of one decision — never change one without the other.
 */
export function getStripePrices() {
  const careerPro = process.env.STRIPE_PRICE_CAREER_PRO;
  const careerElite = process.env.STRIPE_PRICE_CAREER_ELITE;
  const salesPro = process.env.STRIPE_PRICE_SALES_PRO;
  const salesElite = process.env.STRIPE_PRICE_SALES_ELITE;

  if (!careerPro || !careerElite || !salesPro || !salesElite) {
    throw new Error(
      "STRIPE_PRICE_CAREER_PRO, STRIPE_PRICE_CAREER_ELITE, STRIPE_PRICE_SALES_PRO and STRIPE_PRICE_SALES_ELITE must be configured"
    );
  }

  return {
    CAREER_PRO: careerPro,
    CAREER_ELITE: careerElite,
    SALES_PRO: salesPro,
    SALES_ELITE: salesElite,
  } as const;
}

export function getStripeAnnualPrices() {
  const careerPro = process.env.STRIPE_PRICE_CAREER_PRO_ANNUAL;
  const careerElite = process.env.STRIPE_PRICE_CAREER_ELITE_ANNUAL;
  const salesPro = process.env.STRIPE_PRICE_SALES_PRO_ANNUAL;
  const salesElite = process.env.STRIPE_PRICE_SALES_ELITE_ANNUAL;
  if (!careerPro || !careerElite || !salesPro || !salesElite) {
    throw new Error("Annual price env vars not configured");
  }
  return { CAREER_PRO: careerPro, CAREER_ELITE: careerElite, SALES_PRO: salesPro, SALES_ELITE: salesElite } as const;
}

export function resolveStripeAnnualPriceId(track: PlanTrack, tier: PlanTier): string {
  const prices = getStripeAnnualPrices();
  if (track === "SALES") return tier === "ELITE" ? prices.SALES_ELITE : prices.SALES_PRO;
  return tier === "ELITE" ? prices.CAREER_ELITE : prices.CAREER_PRO;
}

/** Track + tier → price id. Written as a switch so the const object stays indexable. */
export function resolveStripePriceId(track: PlanTrack, tier: PlanTier): string {
  const prices = getStripePrices();
  if (track === "SALES") return tier === "ELITE" ? prices.SALES_ELITE : prices.SALES_PRO;
  return tier === "ELITE" ? prices.CAREER_ELITE : prices.CAREER_PRO;
}

/**
 * Term coupon for a (track, tier, term) combination.
 *
 * ⚠️ Currently UNREACHABLE from checkout: the route now rejects a 12-month term that
 * is not billed annually, and this returns null for "monthly" — so no call site can
 * ever resolve a coupon. Kept deliberately rather than deleted: it cannot be exercised
 * in this environment, and the annual plan's 15% discount could later be delivered as
 * a coupon again.
 *
 * `null` means "monthly" or "not configured" — the CALLER decides whether that is
 * fatal (checkout returns 503 for that plan only; see the checkout route). Do NOT add
 * these to isCheckoutConfigured(): that gate is all-or-nothing and one typo would 503
 * the monthly plan too.
 *
 * The env var is keyed by the remaining long term (`_TERM12`) so that giving the
 * 12-month plan a deeper discount later stays a Dashboard edit rather than a PR.
 */
export function getStripeCoupon(track: PlanTrack, tier: PlanTier, term: PlanTerm): string | null {
  if (term === "monthly") return null;
  // PlanTerm's only long value is "12"; the env var is _TERM12.
  const key = `STRIPE_COUPON_${track}_${tier}_TERM${term}`;
  return process.env[key] || null;
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
    // Tier can NEVER be guessed from an amount, only from the price id. Track is not
    // derivable from a price either, and is not needed for tier resolution.
    if (priceId === prices.CAREER_ELITE || priceId === prices.SALES_ELITE) return "ELITE";
    if (priceId === prices.CAREER_PRO || priceId === prices.SALES_PRO) return "PRO";
  } catch {
    // Stripe price env vars are not configured — treat as unknown rather than throwing.
  }

  try {
    const annual = getStripeAnnualPrices();
    if (priceId === annual.CAREER_ELITE || priceId === annual.SALES_ELITE) return "ELITE";
    if (priceId === annual.CAREER_PRO || priceId === annual.SALES_PRO) return "PRO";
  } catch {
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

/** How often (in event claims) we attempt a DB purge. */
const PURGE_EVERY_N_CLAIMS = 50;
let claimCount = 0;

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
      // Lazy periodic cleanup: every N successful DB claims, delete rows > 30 days old.
      claimCount++;
      if (claimCount % PURGE_EVERY_N_CLAIMS === 0) {
        try {
          await prisma.$executeRaw`
            DELETE FROM "StripeEvent" WHERE "createdAt" < NOW() - INTERVAL '30 days'
          `;
        } catch (cleanupErr) {
          console.error("[stripe] StripeEvent cleanup failed:", cleanupErr);
        }
      }
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
