import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sign } from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { notifyOperatorLead } from "@/lib/email";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  track: z.enum(["CAREER", "SALES"]).default("CAREER"),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return NextResponse.json({ error: "Email already registered" }, { status: 409 });

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      tier: "STARTER",
      track: parsed.data.track,
    },
  });

  void notifyOperatorLead({
    kind: "operator_member_signup",
    subject: "New starter member signup",
    lines: [
      { label: "Name", value: parsed.data.name },
      { label: "Email", value: parsed.data.email },
      { label: "Track", value: parsed.data.track },
      { label: "Tier", value: "STARTER" },
      { label: "Source", value: "Mobile" },
    ],
  });

  const token = sign({ userId: user.id }, process.env.AUTH_SECRET!, { expiresIn: "30d" });
  return NextResponse.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, tier: user.tier, track: user.track, persona: user.persona, mentorCredits: user.mentorCredits },
  }, { status: 201 });
}
