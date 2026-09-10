import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { isCheckoutConfigured } from "@/lib/payments";
import { z } from "zod";

const schema = z.object({
  flow: z.enum(["manage", "payment_method", "invoices"]).optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isCheckoutConfigured()) {
    return NextResponse.json(
      { error: "Payments are not live yet." },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  const flow = parsed.success ? parsed.data.flow ?? "manage" : "manage";

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true },
  });

  if (!user?.stripeCustomerId) {
    return NextResponse.json({ error: "No billing account on file" }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const origin = req.headers.get("origin") || process.env.NEXTAUTH_URL;
    const returnUrl = `${origin}/account`;

    const configuration = process.env.STRIPE_BILLING_PORTAL_CONFIGURATION_ID;

    const sessionParams: Parameters<typeof stripe.billingPortal.sessions.create>[0] = {
      customer: user.stripeCustomerId,
      return_url: returnUrl,
      ...(configuration && { configuration }),
    };

    if (flow === "payment_method") {
      sessionParams.flow_data = { type: "payment_method_update" };
    }

    const portalSession = await stripe.billingPortal.sessions.create(sessionParams);

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    console.error("[stripe/portal]", err);
    return NextResponse.json({ error: "Could not open billing portal" }, { status: 500 });
  }
}
