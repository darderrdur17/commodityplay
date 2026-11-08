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

  /**
   * Legacy `/sales` → the sales landing variant.
   *
   * WHY: the sales variant of the landing page is NOT a route of its own — it
   * is `/?track=sales`. `LandingPageClient` switches on the `track` query
   * param (`src/components/landing/landing-page-client.tsx`), and there is no
   * `src/app/sales/` directory anywhere in the repo. So any inbound link that
   * still points at `/sales` — an old campaign, a backlink, a bookmark, a
   * typed URL — 404s instead of landing the visitor on the page it meant.
   *
   * The redirect is the cheapest fix that keeps ONE canonical sales URL. The
   * alternative — adding a `src/app/sales/page.tsx` that redirects internally —
   * would create a second document for the same content, and the landing
   * page's canonical is deliberately `/` for both tracks
   * (`src/app/page.tsx`): `?track=sales` is a different VIEW of the same
   * document, not a different page.
   *
   * `permanent: true` → 308, so the mapping is cached by browsers and search
   * engines and the old URL does not keep costing a round trip.
   *
   * ⚠️ Do NOT add a second rule for `/sales/`. Next normalises the trailing
   * slash itself (`trailingSlash` defaults to false), so `/sales/` already
   * 308s to `/sales` before this rule is ever consulted, and a `/sales/` rule
   * would be unreachable dead config. Verified empirically against Next
   * 16.2.9: `/sales` → 308 → `/?track=sales`, and `/sales/` → 308 → `/sales`
   * → 308 → `/?track=sales`. Query strings on the inbound URL are preserved
   * and merged (`/sales?utm=x` → `/?utm=x&track=sales`), so campaign
   * parameters survive the hop.
   *
   * ⚠️ There is deliberately NO `/sales#pricing`-style rule. The fragment is
   * never sent to the server, so it cannot be matched here, and the sales
   * landing panel already handles its own in-page anchors client-side.
   */
  async redirects() {
    return [
      {
        source: "/sales",
        destination: "/?track=sales",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
