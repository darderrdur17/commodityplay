import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isMentorAccount } from "@/lib/mentor-demo";
import { syncUserContactToMentorProfile } from "@/lib/mentor-profile-sync";

const schema = z.object({
  email: z.string().email("Enter a valid email address").max(200),
  company: z.string().max(120).optional(),
  profession: z.string().max(120).optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, isMentor: true, company: true, mentorProfileId: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const nextEmail = parsed.data.email.trim().toLowerCase();
  const nextCompany = parsed.data.company?.trim() ? parsed.data.company.trim() : null;
  const nextProfession = parsed.data.profession?.trim() ? parsed.data.profession.trim() : null;

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
        profession: nextProfession,
      },
      select: { email: true, company: true, profession: true },
    });

    if (isMentorAccount(user)) {
      await syncUserContactToMentorProfile(user.id, user.email, nextEmail, nextCompany);
    }

    return NextResponse.json({
      email: updated.email,
      company: updated.company,
      profession: updated.profession,
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
