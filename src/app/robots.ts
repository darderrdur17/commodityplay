import type { MetadataRoute } from "next";
import { BRAND_SITE_URL } from "@/lib/brand";

/**
 * Canonical origin for every URL this file emits.
 *
 * The canonical public origin is `https://www.commodityplay.ai`, sourced from
 * `BRAND_SITE_URL` in `src/lib/brand.ts`. This matches the `metadataBase` set in
 * `src/app/layout.tsx` and the `www` canonical host enforced by
 * `src/lib/canonical-host.ts` and the 308 redirects in `vercel.json`, so the
 * sitemap and the canonical tags agree on the origin.
 *
 * We use the constant directly (not `NEXT_PUBLIC_SITE_URL`): a sitemap must
 * always advertise the canonical production origin regardless of environment.
 *
 * The bare apex must never be emitted — it currently serves a parked page.
 */
const SITE_URL = BRAND_SITE_URL;

/**
 * Serves /robots.txt.
 *
 * We allow crawling of the public marketing surface by default and explicitly
 * disallow the gated/private prefixes. Note that `/login` and `/signup` cover
 * the `(auth)` route group (those pages live at the top-level URL), and the
 * gated app routes redirect anonymous visitors there anyway.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/admin",
        "/demo",
        "/account",
        "/dashboard",
        "/job-chat/",
        "/login",
        "/signup",
        "/forgot-password",
        "/reset-password",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
