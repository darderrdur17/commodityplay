import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import type { Prisma } from "@prisma/client";
import {
  claimStripeEvent,
  getStripe,
  releaseStripeEvent,
  resolveTierFromPriceId,
  shouldApplyStripeTierWrites,
} from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { RATE_LIMITS, checkRateLimit, getClientIp, rateLimitKey, rateLimitResponse } from "@/lib/rate-limit";
import { sendBillingReceiptEmail, notifyOperatorLead } from "@/lib/email";
import { subscriptionPlanLabel, isSubscriptionLive, maxTier, normalizeTier, type BillingTier } from "@/lib/billing";

/**
 * Stripe expects a fast 2xx and retries on timeout. The handler writes to
 * Postgres, claims an idempotency row and sends a receipt email, so give it room
 * to finish rather than being killed part-way and leaving the event half-applied.
 *
 * Declared here rather than in `vercel.json`: a route-level export is the
 * framework-native way to set this and does not depend on guessing how Vercel
 * maps source paths to built function names.
 */
export const maxDuration = 60;

interface BillingUserRow {
  id: string;
  tier: string;
  email: string;
  name: string | null;
  stripeStatus: string | null;
  stripeCurrentPeriodEnd: Date | null;
}

const BILLING_USER_SELECT = {
  id: true,
  tier: true,
  email: true,
  name: true,
  // Needed by the refund handler to work out whether the member still holds a
  // live Elite subscription after a one-time Pro payment is reversed.
  stripeStatus: true,
  stripeCurrentPeriodEnd: true,
} as const;

/** Resolve the member for a Stripe object, by user id first and customer id second. */
async function findBillingUser(
  userId: string | null | undefined,
  customerId: string | Stripe.Customer | Stripe.DeletedCustomer | null | undefined
): Promise<BillingUserRow | null> {
  if (userId) {
    const byId = await prisma.user.findUnique({
      where: { id: userId },
      select: BILLING_USER_SELECT,
    });
    if (byId) return byId;
  }

  const customer = typeof customerId === "string" ? customerId : customerId?.id;
  if (customer) {
    return prisma.user.findFirst({
      where: { stripeCustomerId: customer },
      select: BILLING_USER_SELECT,
    });
  }

  return null;
}

/**
 * Authoritative price id for a Checkout Session, read from Stripe's own line items
 * rather than from mutable session metadata.
 */
async function resolveCheckoutPriceId(
  stripe: Stripe,
  sessionId: string
): Promise<string | null> {
  try {
    const full = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items.data.price"],
    });
    const expanded = full.line_items?.data?.[0]?.price?.id ?? null;
    if (expanded) return expanded;
  } catch (err) {
    console.error("[webhook] line_item expand failed:", err);
  }

  try {
    const items = await stripe.checkout.sessions.listLineItems(sessionId, { limit: 5 });
    return items.data[0]?.price?.id ?? null;
  } catch (err) {
    console.error("[webhook] listLineItems failed:", err);
    return null;
  }
}

/** Paid-through date of a subscription (top-level on acacia, nested on newer APIs). */
function subscriptionPeriodEnd(sub: Stripe.Subscription): Date | null {
  const direct = (sub as unknown as { current_period_end?: number }).current_period_end;
  if (typeof direct === "number") return new Date(direct * 1000);

  const fromItem = (sub.items?.data?.[0] as unknown as { current_period_end?: number })
    ?.current_period_end;
  if (typeof fromItem === "number") return new Date(fromItem * 1000);

  return null;
}

function subscriptionId(sub: Stripe.Subscription | string | null | undefined): string | null {
  if (!sub) return null;
  return typeof sub === "string" ? sub : sub.id;
}

/**
 * Emails Frances about a billing lapse.
 *
 * `operator_billing_lapse` is added to BOTH OperatorLeadKind (src/lib/email.ts) and
 * DemoEmailKind + DEMO_EMAIL_KIND_LABELS (src/lib/demo-email-log.ts).
 */
async function notifyBillingLapse(
  user: { id: string; email: string; name: string | null },
  subject: string,
  lines: { label: string; value: string | null | undefined }[]
): Promise<void> {
  await notifyOperatorLead({ kind: "operator_billing_lapse", subject, lines });
}

/**
 * Writes the subscription state onto the User row. Shared by
 * `customer.subscription.created` and `customer.subscription.updated` so the two can
 * never drift.
 */
async function applySubscriptionState(
  sub: Stripe.Subscription,
  user: BillingUserRow,
  opts: { notifyPlanChange: boolean }
): Promise<void> {
  const priceId = sub.items?.data?.[0]?.price?.id ?? null;
  const tierFromPrice = resolveTierFromPriceId(priceId);
  const periodEnd = subscriptionPeriodEnd(sub);

  const data: Prisma.UserUpdateInput = {
    stripeSubscriptionId: sub.id,
    stripeStatus: sub.status,
    // Unknown price: keep the existing tier (never silently downgrade).
    tier: tierFromPrice ?? normalizeTier(user.tier),
  };
  if (priceId) data.stripePriceId = priceId;
  if (periodEnd) data.stripeCurrentPeriodEnd = periodEnd;

  await prisma.user.update({ where: { id: user.id }, data });

  // Operator lead: notify only on a Pro→Elite plan change (not renewals, and not the
  // STARTER→ELITE purchase which checkout.session.completed already covers).
  if (
    opts.notifyPlanChange &&
    tierFromPrice === "ELITE" &&
    normalizeTier(user.tier) === "PRO"
  ) {
    void notifyOperatorLead({
      kind: "operator_upgrade",
      subject: `Upgraded to ELITE — ${user.email ?? user.id}`,
      lines: [
        { label: "Member", value: user.name ?? "—" },
        { label: "Email", value: user.email ?? "—" },
        { label: "Tier", value: "ELITE" },
        { label: "Plan", value: subscriptionPlanLabel("ELITE", undefined) },
        { label: "Reason", value: "Subscription plan change (Pro → Elite)" },
      ],
    });
  }
}

export async function POST(req: NextRequest) {
  const flood = await checkRateLimit(
    rateLimitKey("stripe-webhook", getClientIp(req)),
    RATE_LIMITS.stripeWebhook
  );
  if (!flood.allowed) return rateLimitResponse(flood);

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("[webhook] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Idempotency guard: acknowledge redeliveries without reprocessing them.
  const shouldProcess = await claimStripeEvent(event.id, event.type);
  if (!shouldProcess) {
    console.warn(`[webhook] duplicate event ignored: ${event.type} ${event.id}`);
    return NextResponse.json({ received: true, duplicate: true });
  }

  if (!shouldApplyStripeTierWrites(event.livemode)) {
    console.warn(
      `[webhook] acknowledging ${event.type} ${event.id} without mutating tiers (test secret / livemode mismatch)`
    );
    return NextResponse.json({ received: true, skipped: true });
  }

  try {
    switch (event.type) {
      // Checkout completed — handles BOTH the one-time Pro payment and the Elite
      // subscription. Tier is derived from the Stripe price id, never from metadata.
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_status !== "paid") break;

        const stripe = getStripe();
        const priceId = await resolveCheckoutPriceId(stripe, session.id);
        const user = await findBillingUser(
          session.metadata?.userId ?? session.client_reference_id ?? null,
          session.customer
        );
        if (!user) {
          console.warn("[webhook] checkout.session.completed with no matching user");
          break;
        }

        const tierFromPrice = resolveTierFromPriceId(priceId);
        if (!tierFromPrice) {
          // Unrecognised price id: keep the member's current tier and return 200 so
          // Stripe stops retrying. We never silently downgrade a paying member.
          console.warn(
            `[webhook] unrecognised price id "${priceId}" — keeping tier "${user.tier}"`
          );
          const subId = subscriptionId(session.subscription);
          if (subId) {
            await prisma.user.update({
              where: { id: user.id },
              data: { stripeSubscriptionId: subId },
            });
          }
          break;
        }

        // A completed purchase must never downgrade an existing entitlement.
        const grantedTier: BillingTier = maxTier(user.tier, tierFromPrice);

        const data: Prisma.UserUpdateInput = {
          tier: grantedTier,
          stripeStatus: "active",
        };

        // Only record the price id when we recognised it, so later events can resolve it.
        if (priceId) data.stripePriceId = priceId;

        // Every plan is a subscription now: always record the subscription id and NEVER
        // null out the period end. `customer.subscription.created` (below) supplies the
        // actual period end from the first minute.
        const subId = subscriptionId(session.subscription);
        if (subId) data.stripeSubscriptionId = subId;

        await prisma.user.update({ where: { id: user.id }, data });
        // Operator lead: tell Frances about the paid upgrade so she can curate a reply.
        if (grantedTier === "PRO" || grantedTier === "ELITE") {
          void notifyOperatorLead({
            kind: "operator_upgrade",
            subject: `New ${grantedTier} upgrade — ${user.email ?? user.id}`,
            lines: [
              { label: "Member", value: user.name ?? "—" },
              { label: "Email", value: user.email ?? "—" },
              { label: "Tier", value: grantedTier },
              { label: "Plan", value: subscriptionPlanLabel(grantedTier, undefined) },
              { label: "Type", value: "Subscription" },
              { label: "Term", value: session.metadata?.term ?? "monthly" },
              { label: "Stripe price", value: priceId ?? "—" },
            ],
          });
        }
        break;
      }

      /**
       * A brand-new subscription. Handling it here (not only in checkout.session.completed)
       * is what guarantees `stripeCurrentPeriodEnd` is populated from the first minute.
       * checkout.session.completed sets stripeStatus:"active" but no period end, and
       * isSubscriptionLive() tolerates a null period end — tolerance that was fine for a
       * one-time purchase and would now keep a cancelled Pro member's access alive.
       */
      case "customer.subscription.created": {
        const sub = event.data.object as Stripe.Subscription;
        const user = await findBillingUser(sub.metadata?.userId, sub.customer);
        if (!user) {
          console.warn("[webhook] customer.subscription.created with no matching user");
          break;
        }
        await applySubscriptionState(sub, user, { notifyPlanChange: false });
        break;
      }

      // Subscription updated (e.g., plan change, renewal, past_due, pause)
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const user = await findBillingUser(sub.metadata?.userId, sub.customer);
        if (!user) {
          console.warn("[webhook] customer.subscription.updated with no matching user");
          break;
        }

        await applySubscriptionState(sub, user, { notifyPlanChange: true });
        break;
      }

      // Subscription cancelled / expired — the only intentional downgrade path.
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const user = await findBillingUser(sub.metadata?.userId, sub.customer);
        if (!user) {
          console.warn("[webhook] customer.subscription.deleted with no matching user");
          break;
        }

        await prisma.user.update({
          where: { id: user.id },
          data: {
            tier: "STARTER",
            stripeSubscriptionId: null,
            stripePriceId: null,
            stripeCurrentPeriodEnd: null,
            stripeStatus: "cancelled",
          },
        });

        // The actual lapse — always notify.
        await notifyBillingLapse(user, `Access lapsed — ${user.email ?? user.id}`, [
          { label: "Member", value: user.name ?? "—" },
          { label: "Email", value: user.email ?? "—" },
          { label: "Tier before lapse", value: normalizeTier(user.tier) },
          { label: "Stripe subscription", value: sub.id },
        ]);
        break;
      }

      /**
       * Refund or dispute on a charge that is NOT attached to an invoice.
       *
       * With no one-time product left, every real payment carries `charge.invoice`, so
       * this handler now always early-returns below. The guard is kept deliberately:
       * it is cheap, and removing it would silently revoke a paying member's tier the
       * day a non-invoice charge appears (a future one-off product, an adjustment).
       *
       * Deliberately narrow: a refund of a *subscription* payment is NOT revoked
       * here, because Stripe drives that through `customer.subscription.*` and
       * acting early would cut off a member who is still legitimately paid up.
       * `charge.invoice` is set for subscription payments and absent for one-time
       * charges, which is how the two are told apart.
       */
      case "charge.refunded":
      case "charge.dispute.created": {
        const charge = event.data.object as Stripe.Charge;

        if (charge.invoice) {
          console.log(
            "[webhook] refund/dispute on a subscription payment — leaving the tier to customer.subscription.*"
          );
          break;
        }

        const customerId =
          typeof charge.customer === "string"
            ? charge.customer
            : charge.customer?.id ?? null;
        const user = await findBillingUser(charge.metadata?.userId ?? null, customerId);
        if (!user) {
          console.warn("[webhook] refund/dispute with no matching user");
          break;
        }

        // The member may ALSO hold a live Elite subscription, so recompute the
        // resulting tier rather than blindly dropping to STARTER.
        const stillElite = isSubscriptionLive(
          user.stripeStatus,
          user.stripeCurrentPeriodEnd
        );

        await prisma.user.update({
          where: { id: user.id },
          data: {
            tier: stillElite ? "ELITE" : "STARTER",
            ...(stillElite
              ? {}
              : { stripePriceId: null, stripeCurrentPeriodEnd: null }),
          },
        });

        console.log(
          `[webhook] reversed one-time payment → tier ${stillElite ? "ELITE" : "STARTER"}`
        );
        break;
      }

      // Invoice payment failed — status flips to past_due; effectiveTier() then
      // withholds PRO *and* ELITE access without destroying the stored tier.
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;

        if (customerId) {
          await prisma.user.updateMany({
            where: { stripeCustomerId: customerId },
            data: { stripeStatus: "past_due" },
          });
        }

        // 🔴 Dunning dedupe. Stripe emits a DISTINCT invoice.payment_failed event for
        // each retry (up to 4), and claimStripeEvent() dedupes on event.id — which does
        // NOT help here, because these are four different event ids.
        //
        // Notify on attempt 1 ONLY. Retries 2-4 are silent, and the FINAL attempt is
        // NOT notified either: it is always followed by customer.subscription.deleted,
        // which does notify. Notifying on both is how one dead card becomes 3-4 emails
        // instead of 2.
        if ((invoice.attempt_count ?? 0) !== 1) break;

        if (!customerId) break;
        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId },
          select: { id: true, name: true, email: true, tier: true },
        });
        if (!user) break;

        await notifyBillingLapse(
          user,
          `Payment failed — ${user.email ?? user.id}`,
          [
            { label: "Member", value: user.name ?? "—" },
            { label: "Email", value: user.email ?? "—" },
            { label: "Tier", value: normalizeTier(user.tier) },
            { label: "Attempt", value: String(invoice.attempt_count ?? 0) },
            { label: "Invoice", value: invoice.id ?? "—" },
          ]
        );
        break;
      }

      // Paid subscription invoice — send branded receipt email
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.amount_paid <= 0) break;

        const billingReason = invoice.billing_reason;
        if (
          billingReason !== "subscription_create" &&
          billingReason !== "subscription_cycle" &&
          billingReason !== "subscription_update"
        ) {
          break;
        }

        const customerId =
          typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
        if (!customerId) break;

        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId },
          select: { name: true, email: true, tier: true, track: true },
        });

        const recipient = invoice.customer_email || user?.email;
        if (!recipient) break;

        const priceId = invoice.lines?.data?.[0]?.price?.id ?? null;
        // Receipt copy only: fall back to the stored tier (then PRO) when the price is
        // unrecognised, so the email still reads sensibly.
        const tier: BillingTier =
          resolveTierFromPriceId(priceId) ?? (user ? normalizeTier(user.tier) : "PRO");
        const planLabel = subscriptionPlanLabel(tier, user?.track);

        const period = invoice.lines?.data?.[0]?.period;
        const periodStart = period?.start ? new Date(period.start * 1000) : null;
        const periodEnd = period?.end ? new Date(period.end * 1000) : null;

        await sendBillingReceiptEmail({
          to: recipient,
          memberName: user?.name ?? null,
          invoiceNumber: invoice.number || invoice.id,
          amountCents: invoice.amount_paid,
          currency: invoice.currency,
          planLabel,
          periodStart,
          periodEnd,
          invoicePdfUrl: invoice.invoice_pdf,
          hostedInvoiceUrl: invoice.hosted_invoice_url,
        });
        break;
      }
    }
  } catch (err) {
    console.error("[webhook] handler error:", err);
    // Release the claim so Stripe's retry can actually reprocess this event.
    await releaseStripeEvent(event.id);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
