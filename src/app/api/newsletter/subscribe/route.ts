import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
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

  await prisma.emailSubscriber.upsert({
    where: { email: parsed.data.email },
    update: { subscribed: true },
    create: {
      email: parsed.data.email,
      source: "footer-newsletter",
      subscribed: true,
    },
  });

  void notifyOperatorLead({
    kind: "operator_newsletter",
    subject: "New newsletter signup",
    lines: [
      { label: "Email", value: parsed.data.email },
      { label: "Source", value: "Footer newsletter" },
    ],
  });

  return NextResponse.json({ success: true, message: "You're on the list!" });
}
