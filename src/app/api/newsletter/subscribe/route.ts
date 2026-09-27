import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { normalizeEmail } from "@/lib/admin-access";
import { notifyOperatorLead } from "@/lib/email";

const schema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  // Lowercase before using the address as a key, so `Foo@X.com` and `foo@x.com`
  // resolve to the same subscriber rather than creating a duplicate row.
  const email = normalizeEmail(parsed.data.email);

  await prisma.emailSubscriber.upsert({
    where: { email },
    update: { subscribed: true },
    create: {
      email,
      source: "footer-newsletter",
      subscribed: true,
    },
  });

  void notifyOperatorLead({
    kind: "operator_newsletter",
    subject: "New newsletter signup",
    lines: [
      { label: "Email", value: email },
      { label: "Source", value: "Footer newsletter" },
    ],
  });

  return NextResponse.json({ success: true, message: "You're on the list!" });
}
