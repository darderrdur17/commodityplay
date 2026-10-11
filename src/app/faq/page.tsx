import { permanentRedirect } from "next/navigation";

/**
 * `/faq` is retired.
 *
 * The FAQ is no longer its own page. At the owner's request (11 Oct 2026) it
 * moved to the bottom of `/pricing`, where the content actually belongs — the
 * FAQ is entirely about plans, billing and access — and the footer link now
 * points straight at `/pricing#faq`.
 *
 * This route survives as a 308 so nothing breaks:
 *   - the old footer/inbound `/faq` links still land on the FAQ,
 *   - the Search Console index entry for `/faq` transfers instead of 404-ing.
 *
 * `permanentRedirect` (not `redirect`) is deliberate: a 308 is what tells a
 * crawler to move the indexed URL rather than keep both. That is also why
 * `/faq` was REMOVED from `sitemap.ts` — a sitemap may only advertise canonical
 * URLs that return 200, and this one now redirects.
 *
 * There is no `metadata` export: a redirecting route has no page to describe.
 */
export default function FaqPage(): never {
  permanentRedirect("/pricing#faq");
}
