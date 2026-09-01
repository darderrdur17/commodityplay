import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe, getTierFromPriceId } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { sendBillingReceiptEmail } from "@/lib/email";
import { subscriptionPlanLabel } from "@/lib/billing";

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("[webhook] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      // One-time Pro purchase
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_status !== "paid") break;

        const userId = session.metadata?.userId;
        if (!userId) break;

        const plan = session.metadata?.plan;
        const tier = plan === "elite" ? "ELITE" : plan === "pro" ? "PRO" : "STARTER";

        await prisma.user.update({
          where: { id: userId },
          data: {
            tier: tier as any,
            stripeStatus: "active",
            ...(session.subscription && {
              stripeSubscriptionId: session.subscription as string,
            }),
          },
        });
        break;
      }

      // Subscription updated (e.g., plan change, renewal)
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;
        if (!userId) break;

        const priceId = sub.items.data[0]?.price?.id;
        const tier = getTierFromPriceId(priceId || "");

        await prisma.user.update({
          where: { id: userId },
          data: {
            tier: tier as any,
            stripeSubscriptionId: sub.id,
            stripePriceId: priceId,
            stripeCurrentPeriodEnd: new Date(sub.current_period_end * 1000),
            stripeStatus: sub.status,
          },
        });
        break;
      }

      // Subscription cancelled / expired
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;
        if (!userId) break;

        await prisma.user.update({
          where: { id: userId },
          data: {
            tier: "STARTER",
            stripeSubscriptionId: null,
            stripePriceId: null,
            stripeStatus: "cancelled",
          },
        });
        break;
      }

      // Invoice payment failed
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

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

        const priceId = invoice.lines.data[0]?.price?.id;
        const tier = priceId ? getTierFromPriceId(priceId) : user?.tier ?? "PRO";
        const planLabel = subscriptionPlanLabel(tier as "STARTER" | "PRO" | "ELITE", user?.track);

        const period = invoice.lines.data[0]?.period;
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
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
