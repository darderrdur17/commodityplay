import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "fonts.googleapis.com" },
      { protocol: "https", hostname: "fonts.gstatic.com" },
    ],
  },
  serverExternalPackages: ["@prisma/client", "bcryptjs"],

  /**
   * Security headers.
   *
   * WHY: the app was shipping `strict-transport-security` (Vercel's default) and
   * nothing else. That left authenticated surfaces — `/account`, `/dashboard`,
   * `/admin`, and the checkout flow — frameable by any origin, so a third-party
   * page could overlay them and harvest clicks. `nosniff` and a referrer policy
   * are cheap defence-in-depth for the same reason.
   *
   * ⚠️ A Content-Security-Policy is deliberately NOT set here. Next injects
   * inline bootstrap/flight scripts into every page, and Stripe's checkout
   * redirect plus Google OAuth need script/connect origins that change per
   * environment. A CSP written without nonce plumbing would either break the app
   * outright or need `'unsafe-inline'`, which buys nothing. Doing it properly
   * means generating a per-request nonce in middleware — a separate change, not a
   * header string.
   */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
