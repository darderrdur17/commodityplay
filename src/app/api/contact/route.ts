import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { normalizeEmail } from "@/lib/admin-access";
import { notifyOperatorLead } from "@/lib/email";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email(),
  message: z.string().min(1, "Message is required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { name, message } = parsed.data;
    const email = normalizeEmail(parsed.data.email);

    const { ensureCoreInfrastructure } = await import("@/lib/setup-database");
    await ensureCoreInfrastructure();

    await prisma.contactMessage.create({ data: { name, email, message } });

    await prisma.emailSubscriber.upsert({
      where: { email },
      update: {},
      create: { email, name, source: "contact" },
    });

    void notifyOperatorLead({
      kind: "operator_contact",
      subject: "New Contact Us message",
      lines: [
        { label: "Name", value: name },
        { label: "Email", value: email },
        { label: "Message", value: message },
      ],
    });

    return NextResponse.json({ success: true, message: "Message sent!" }, { status: 201 });
  } catch (err) {
    console.error("[contact]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
