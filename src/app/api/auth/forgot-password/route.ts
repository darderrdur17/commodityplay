import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { BRAND_SITE_URL } from "@/lib/brand";
import { isEmailConfigured, sendPasswordResetEmail } from "@/lib/email";
import { createPasswordResetToken } from "@/lib/password-reset";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  if (!isEmailConfigured()) {
    return NextResponse.json(
      { error: "Password reset email is not available yet. Email support if you need access." },
      { status: 503 }
    );
  }

  const email = parsed.data.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (user) {
    const raw = await createPasswordResetToken(email);
    const origin =
      process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || BRAND_SITE_URL;
    const resetUrl = `${origin.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(raw)}`;
    await sendPasswordResetEmail({ to: email, resetUrl });
  }

  return NextResponse.json({
    ok: true,
    message: "If that email has an account, a reset link is on its way.",
  });
}
