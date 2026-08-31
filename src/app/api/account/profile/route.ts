import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isMentorAccount } from "@/lib/mentor-demo";

const schema = z.object({
  email: z.string().email("Enter a valid email address").max(200),
  company: z.string().max(120).optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, isMentor: true, company: true },
  });
  if (!user || !isMentorAccount(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const nextEmail = parsed.data.email.trim().toLowerCase();
  const nextCompany = parsed.data.company?.trim() ? parsed.data.company.trim() : null;

  if (nextEmail !== user.email.toLowerCase()) {
    const taken = await prisma.user.findUnique({
      where: { email: nextEmail },
      select: { id: true },
    });
    if (taken && taken.id !== user.id) {
      return NextResponse.json({ error: "That email is already in use." }, { status: 409 });
    }
  }

  try {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        email: nextEmail,
        company: nextCompany,
      },
      select: { email: true, company: true },
    });

    return NextResponse.json({
      email: updated.email,
      company: updated.company,
    });
  } catch (err) {
    const code = typeof err === "object" && err && "code" in err ? String((err as { code: string }).code) : "";
    if (code === "P2002") {
      return NextResponse.json({ error: "That email is already in use." }, { status: 409 });
    }
    console.error("[account/profile]", err);
    return NextResponse.json({ error: "Could not save profile" }, { status: 500 });
  }
}
