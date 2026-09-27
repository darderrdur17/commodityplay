import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { normalizeEmail } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";
import {
  RESET_COOKIE_MAX_AGE_SECONDS,
  RESET_COOKIE_NAME,
  consumePasswordResetToken,
  peekPasswordResetToken,
} from "@/lib/password-reset";
import { incrementUserTokenVersion } from "@/lib/mobile-auth";
import { RATE_LIMITS, checkRateLimit, getClientIp, rateLimitKey, rateLimitResponse } from "@/lib/rate-limit";

/**
 * The reset link emailed to the user points here.
 *
 * Chosen approach: **httpOnly cookie**, not a POST body. The token unavoidably
 * travels in the emailed URL, but it should not then sit in the page URL where
 * it lingers in browser history and leaks through the `Referer` header of every
 * resource the form page loads. This GET validates the token, stashes it in an
 * httpOnly cookie and redirects to a clean `/reset-password`, so the token is
 * never in the address bar of a page the user interacts with.
 *
 * It does not consume the token — the reset POST does that — so a link
 * prefetcher or email scanner cannot burn the user's link.
 */
export async function GET(req: NextRequest) {
  const limit = checkRateLimit(
    rateLimitKey("reset-password", getClientIp(req)),
    RATE_LIMITS.resetPassword
  );

  const raw = req.nextUrl.searchParams.get("token") ?? "";
  const valid = limit.allowed && (await peekPasswordResetToken(raw));

  const target = new URL("/reset-password", req.nextUrl.origin);
  if (!valid) {
    target.searchParams.set("error", "invalid");
    return NextResponse.redirect(target);
  }

  const response = NextResponse.redirect(target);
  response.cookies.set(RESET_COOKIE_NAME, raw, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: RESET_COOKIE_MAX_AGE_SECONDS,
  });
  return response;
}

const schema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[0-9]/, "Must contain a number"),
});

function clearResetCookie(response: NextResponse): NextResponse {
  response.cookies.set(RESET_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}

export async function POST(req: NextRequest) {
  const limit = checkRateLimit(
    rateLimitKey("reset-password", getClientIp(req)),
    RATE_LIMITS.resetPassword
  );
  if (!limit.allowed) return rateLimitResponse(limit);

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Enter a valid password." },
      { status: 400 }
    );
  }

  // The token is read from the httpOnly cookie, never from the request body.
  const raw = req.cookies.get(RESET_COOKIE_NAME)?.value ?? "";
  const tokenEmail = await consumePasswordResetToken(raw);
  if (!tokenEmail) {
    return clearResetCookie(
      NextResponse.json(
        { error: "This reset link is invalid or has expired. Request a new one." },
        { status: 400 }
      )
    );
  }

  const email = normalizeEmail(tokenEmail);
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) {
    return clearResetCookie(
      NextResponse.json(
        { error: "This reset link is invalid or has expired. Request a new one." },
        { status: 400 }
      )
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await incrementUserTokenVersion(user.id, { passwordHash });

  return clearResetCookie(NextResponse.json({ ok: true }));
}
