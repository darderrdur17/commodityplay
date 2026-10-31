import Link from "next/link";
import { ArrowRight, Compass, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BRAND_EMAIL_SUPPORT, BRAND_NAME } from "@/lib/brand";

/**
 * The site-wide 404.
 *
 * WHY THIS FILE EXISTS: without it Next renders its built-in "404 This page could
 * not be found." — a bare sentence inside the site chrome with **no way back**.
 * Anyone arriving from a stale link, a truncated share URL or a typo was stranded
 * and had to edit the address bar. Every dead end now offers the two routes a lost
 * visitor actually wants: the landing page and pricing.
 *
 * It renders inside the root layout, so the header and footer are already there.
 * `not-found.tsx` cannot export `metadata` (it is rendered by the closest layout),
 * so the tab keeps the layout's default title.
 */
export default function NotFound() {
  return (
    <div className="page-container py-20 sm:py-28">
      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft">
          <FileQuestion className="h-7 w-7 text-primary-400" />
        </div>

        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-primary-800">Error 404</p>
        <h1 className="mb-3 font-serif text-3xl font-bold text-gray-900 sm:text-4xl">
          We can&apos;t find that page.
        </h1>
        <p className="mb-8 text-muted-fg">
          The link may be out of date, or the page may have moved. Nothing is broken on your side — pick a
          route below and you&apos;ll be back on the desk.
        </p>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/">
            <Button size="lg">
              <Compass className="h-4 w-4" />
              Back to home
            </Button>
          </Link>
          <Link href="/pricing">
            <Button size="lg" variant="outline">
              See plans
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <p className="mt-8 text-xs text-muted-fg">
          Followed a link from us and landed here? Tell{" "}
          <a className="font-medium text-primary-400 hover:underline" href={`mailto:${BRAND_EMAIL_SUPPORT}`}>
            {BRAND_EMAIL_SUPPORT}
          </a>{" "}
          and we&apos;ll fix it. — {BRAND_NAME}
        </p>
      </div>
    </div>
  );
}
