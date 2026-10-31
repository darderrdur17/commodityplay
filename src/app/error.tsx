"use client";

import Link from "next/link";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BRAND_EMAIL_SUPPORT } from "@/lib/brand";

/**
 * Route-level error boundary for the whole app.
 *
 * WHY THIS FILE EXISTS: the app had **no** `error.tsx` anywhere, so any uncaught
 * render error fell through to Next's built-in error screen — an unstyled,
 * unbranded page with no navigation. A member who hit a transient database or
 * content error was stranded and had to reload the browser manually.
 *
 * Two things this gives them that the default does not:
 *  - `reset()`, which re-renders the segment without a full page load, so a
 *    one-off failure recovers in place;
 *  - a link home, so a persistent failure is still escapable.
 *
 * The error's own message is deliberately NOT rendered. It is usually a stack
 * trace or a database string, which leaks internals and means nothing to a
 * reader. The digest is shown instead — it is the one token that lets us find the
 * matching server log entry.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="page-container py-20 sm:py-28">
      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50">
          <AlertTriangle className="h-7 w-7 text-amber-500" />
        </div>

        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-primary-800">Something went wrong</p>
        <h1 className="mb-3 font-serif text-3xl font-bold text-gray-900 sm:text-4xl">
          This page didn&apos;t load.
        </h1>
        <p className="mb-8 text-muted-fg">
          The problem is on our side, not yours. Try again — if it keeps happening, tell us and we&apos;ll
          look into it.
        </p>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" onClick={reset}>
            <RotateCcw className="h-4 w-4" />
            Try again
          </Button>
          <Link href="/">
            <Button size="lg" variant="outline">
              <Home className="h-4 w-4" />
              Back to home
            </Button>
          </Link>
        </div>

        <p className="mt-8 text-xs text-muted-fg">
          Report it to{" "}
          <a className="font-medium text-primary-400 hover:underline" href={`mailto:${BRAND_EMAIL_SUPPORT}`}>
            {BRAND_EMAIL_SUPPORT}
          </a>
          {error.digest ? (
            <>
              {" "}
              and quote reference <span className="font-mono text-gray-700">{error.digest}</span>
            </>
          ) : null}
          .
        </p>
      </div>
    </div>
  );
}
