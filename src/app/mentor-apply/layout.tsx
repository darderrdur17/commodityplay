import type { Metadata } from "next";

/**
 * This page is intentionally unlisted — reachable only via a direct link the
 * admin sends by email/WhatsApp to invited mentor candidates. It is never
 * linked from the site's nav, homepage, or any sitemap. `noindex`/`nofollow`
 * is set as defense-in-depth in case the URL is ever crawled or shared
 * publicly, so it can't end up in search results.
 */
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

/**
 * Site header/footer are omitted for this route via `SiteChrome` in the root layout
 * (`/mentor-apply` only — not a global hide).
 */
export default function MentorApplyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
