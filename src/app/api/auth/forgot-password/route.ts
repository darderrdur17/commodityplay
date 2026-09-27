import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizeEmail } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";
import { BRAND_SITE_URL } from "@/lib/brand";
import { isEmailConfigured, sendPasswordResetEmail } from "@/lib/email";
import { createPasswordResetToken } from "@/lib/password-reset";
import { RATE_LIMITS, checkRateLimit, rateLimitKey, rateLimitResponse } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const email = normalizeEmail(parsed.data.email);

  // 3 per day per address. Every accepted request sends a Resend email, so
  // without this the endpoint is a free email-bombing primitive against any
  // inbox. Keyed on the submitted address, so a 429 reveals nothing about
  // whether that address has an account.
  const limit = await checkRateLimit(
    rateLimitKey("forgot-password", email),
    RATE_LIMITS.forgotPassword
  );
  if (!limit.allowed) {
    return rateLimitResponse(
      limit,
      "Too many reset requests for this address. Please try again tomorrow."
    );
  }

  if (!isEmailConfigured()) {
    return NextResponse.json(
      { error: "Password reset email is not available yet. Email support if you need access." },
      { status: 503 }
    );
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (user) {
    const raw = await createPasswordResetToken(email);
    const origin =
      process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || BRAND_SITE_URL;
    // The link points at the API, which validates the token, moves it into an
    // httpOnly cookie and redirects to a clean /reset-password URL. That keeps
    // the token out of the page URL, out of browser history and out of the
    // `Referer` header of anything the form page loads.
    const resetUrl = `${origin.replace(/\/$/, "")}/api/auth/reset-password?token=${encodeURIComponent(raw)}`;
    await sendPasswordResetEmail({ to: email, resetUrl });
  }

  return NextResponse.json({
    ok: true,
    message: "If that email has an account, a reset link is on its way.",
  });
}
