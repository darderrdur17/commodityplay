import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { canonicalPublicUrl, isBlockedVercelAlias } from "@/lib/canonical-host";

const PROTECTED_PATHS = [
  "/dashboard",
  "/playbook",
  "/resume-templates",
  "/career-roadmap",
  "/interview-questions",
  "/knowledge-test",
  "/case-studies",
  "/desk-channel",
  "/mentor-connect",
  "/job-openings",
  "/onboarding",
  "/account",
  "/admin",
];

/** Starter-tier content — requires a free account before access */
const STARTER_SIGNUP_PATHS = ["/glossary"];

/**
 * Privileged surfaces that must never be confirmed to exist.
 *
 * This is a deny-only, coarse, defence-in-depth filter: it runs on the edge and
 * can only check that a session is present. It can NOT evaluate the email
 * allowlist (that needs a database lookup), so the authoritative gate remains
 * `requireSoleAdminPage()` / `assertSoleAdmin()` inside each route and layout.
 */
const DENY_ONLY_PREFIXES = ["/admin", "/api/admin", "/demo"];

export const proxy = auth((req) => {
  if (isBlockedVercelAlias(req.nextUrl.hostname)) {
    return NextResponse.redirect(canonicalPublicUrl(req.url), 308);
  }

  const { pathname } = req.nextUrl;

  // Deny-only edge filter. A redirect (to /login or /dashboard) or a 403 would
  // both confirm that the surface exists and that the caller is excluded from
  // it, so unauthenticated requests get a bare 404 instead.
  if (DENY_ONLY_PREFIXES.some((p) => pathname.startsWith(p))) {
    if (!req.auth?.user?.id) {
      return new NextResponse(null, { status: 404 });
    }
  }

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  const needsStarterSignup = STARTER_SIGNUP_PATHS.some((p) => pathname.startsWith(p));

  if (needsStarterSignup && !req.auth) {
    const signupUrl = new URL("/signup", req.url);
    signupUrl.searchParams.set("plan", "starter");
    signupUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signupUrl);
  }

  // Authorisation for /demo is decided by the server component in
  // src/app/demo/page.tsx. The edge only establishes that a session exists, so
  // no operator email list is duplicated here and nothing is disclosed.

  if (isProtected && !req.auth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // The role-based /admin redirect was removed: it disclosed the admin surface
  // and relied on the writable `User.role` column. The allowlist gate in
  // src/app/admin/layout.tsx is now responsible for refusing non-operators.

  if (req.auth && (pathname === "/login" || pathname === "/signup")) {
    const dest = req.auth.user?.role === "ADMIN" ? "/admin" : "/dashboard";
    return NextResponse.redirect(new URL(dest, req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png|api/stripe/webhook|api/auth|api/setup-db).*)",
  ],
};
