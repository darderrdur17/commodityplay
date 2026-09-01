import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid work email"),
  track: z.enum(["CAREER", "SALES"], { message: "Please select a track" }),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  const body = await req.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { firstName, lastName, email, track } = parsed.data;
  const name = `${firstName.trim()} ${lastName.trim()}`;

  const source = track === "CAREER" ? "starter-pack-modal-career" : "starter-pack-modal-sales";

  await prisma.emailSubscriber.upsert({
    where: { email },
    update: {
      subscribed: true,
      name,
      source,
    },
    create: {
      email,
      name,
      source,
      subscribed: true,
    },
  });

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    await prisma.user.update({
      where: { email },
      data: { track },
    });
  } else if (session?.user?.id) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { track },
    });
  }

  return NextResponse.json({ success: true, message: "Starter pack request received" }, { status: 201 });
}
