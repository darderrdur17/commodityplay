import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import type { Prisma } from "@prisma/client";
import {
  claimStripeEvent,
  getStripe,
  releaseStripeEvent,
  resolveOneTimeTierFromAmount,
  resolveTierFromPriceId,
} from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { sendBillingReceiptEmail } from "@/lib/email";
import { subscriptionPlanLabel, isSubscriptionLive, maxTier, normalizeTier, type BillingTier } from "@/lib/billing";

/**
 * Grace window used only if an Elite-priced line item is somehow bought one-time.
 * Pro (the real one-time product) is lifetime and deliberately gets no expiry.
 */
const ONE_TIME_ELITE_GRACE_DAYS = 30;

interface BillingUserRow {
  id: string;
  tier: string;
  stripeStatus: string | null;
  stripeCurrentPeriodEnd: Date | null;
}

const BILLING_USER_SELECT = {
  id: true,
  tier: true,
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

export async function POST(req: NextRequest) {
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

        const isOneTime = session.mode === "payment";

        // A completed purchase must never downgrade an existing entitlement.
        const grantedTier: BillingTier = maxTier(user.tier, tierFromPrice);

        const data: Prisma.UserUpdateInput = {
          tier: grantedTier,
          stripeStatus: "active",
        };

        // Only record the price id when we recognised it, so later events can resolve it.
        if (priceId) data.stripePriceId = priceId;

        if (isOneTime) {
          // One-time Pro: no subscription, and no expiry — it is a lifetime purchase.
          data.stripeSubscriptionId = null;
          data.stripeCurrentPeriodEnd =
            grantedTier === "ELITE"
              ? new Date(Date.now() + ONE_TIME_ELITE_GRACE_DAYS * 24 * 60 * 60 * 1000)
              : null;
        } else {
          const subId = subscriptionId(session.subscription);
          if (subId) data.stripeSubscriptionId = subId;
        }

        await prisma.user.update({ where: { id: user.id }, data });
        break;
      }

      /**
       * Safety net for one-time payments: if checkout.session.completed was missed or
       * failed, grant Pro from the charged amount (matched against the Pro price).
       * Never downgrades — an unmatched amount leaves the tier untouched.
       */
      case "payment_intent.succeeded": {
        const intent = event.data.object as Stripe.PaymentIntent;
        // Subscription invoices are handled by the invoice.* events.
        if (intent.invoice) break;

        const user = await findBillingUser(intent.metadata?.userId ?? null, intent.customer);
        if (!user) break;

        const tier = await resolveOneTimeTierFromAmount(
          intent.amount_received,
          intent.currency
        );
        if (!tier) break;

        await prisma.user.update({
          where: { id: user.id },
          data: {
            tier: maxTier(user.tier, tier),
            stripeStatus: "active",
            stripeSubscriptionId: null,
            stripeCurrentPeriodEnd: null,
          },
        });
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
        break;
      }

      /**
       * Refund or dispute on a ONE-TIME payment (Pro, SGD 99).
       *
       * Pro is a lifetime purchase, so nothing else in this file ever revokes it —
       * without this handler a member who buys Pro and is then refunded keeps Pro
       * permanently.
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
      // withholds ELITE access without destroying the stored tier.
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;

        if (customerId) {
          await prisma.user.updateMany({
            where: { stripeCustomerId: customerId },
            data: { stripeStatus: "past_due" },
          });
        }
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
