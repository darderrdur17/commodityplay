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
 * The complete set of indexable public pages.
 *
 * WHY ONLY THESE (do not "helpfully" add more): a sitemap may only contain
 * canonical URLs that return HTTP 200 to an anonymous crawler. Every other
 * content route is gated by the edge middleware in `src/proxy.ts` and returns
 * a 307 redirect to /login or /signup for anonymous visitors — for example
 * `/glossary` -> /signup?plan=starter and `/playbook` -> /login. Listing a
 * redirecting URL violates the sitemap contract, produces "Submitted URL not
 * found / redirected" errors in Search Console, and wastes crawl budget.
 *
 * The deny-only surfaces (`/admin`, `/demo`, `/api`) return a bare 404 to
 * anonymous requests on purpose and must never be advertised at all.
 *
 * If you want a gated page in here, first remove its middleware gate so it
 * serves 200 to anonymous Googlebot; otherwise it does not belong.
 *
 * These are static marketing pages, so the list is hardcoded — there is no CMS
 * and no database query is used (a DB call here would break the sitemap
 * whenever the DB is unreachable).
 */
const PUBLIC_ROUTES: ReadonlyArray<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/pricing", changeFrequency: "weekly", priority: 0.9 },
  { path: "/starter-pack", changeFrequency: "weekly", priority: 0.8 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.7 },
  { path: "/mentor-apply", changeFrequency: "monthly", priority: 0.6 },
  { path: "/waitlist", changeFrequency: "monthly", priority: 0.5 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
];

/** Serves /sitemap.xml. */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return PUBLIC_ROUTES.map(({ path, changeFrequency, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
