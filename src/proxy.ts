import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { canAccessInternalDemo } from "@/lib/demo-access";

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

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  const needsStarterSignup = STARTER_SIGNUP_PATHS.some((p) => pathname.startsWith(p));

  if (needsStarterSignup && !req.auth) {
    const signupUrl = new URL("/signup", req.url);
    signupUrl.searchParams.set("plan", "starter");
    signupUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signupUrl);
  }

  if (pathname.startsWith("/demo")) {
    if (!req.auth) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (!canAccessInternalDemo(req.auth.user)) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  if (isProtected && !req.auth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin") && req.auth?.user?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

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
