import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { notifyOperatorLead } from "@/lib/email";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email(),
  message: z.string().min(1, "Message is required"),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  await prisma.contactMessage.create({ data: parsed.data });

  await prisma.emailSubscriber.upsert({
    where: { email: parsed.data.email },
    update: {},
    create: { email: parsed.data.email, name: parsed.data.name, source: "contact" },
  });

  void notifyOperatorLead({
    kind: "operator_contact",
    subject: "New Contact Us message",
    lines: [
      { label: "Name", value: parsed.data.name },
      { label: "Email", value: parsed.data.email },
      { label: "Message", value: parsed.data.message },
    ],
  });

  return NextResponse.json({ success: true, message: "Message sent!" }, { status: 201 });
}
