import { Loader2 } from "lucide-react";

/**
 * Route-level loading state, shared by the per-segment `loading.tsx` files.
 *
 * WHY THIS IS NO LONGER `src/app/loading.tsx`: a `loading.tsx` at the app root puts
 * EVERY route inside a Suspense boundary. Because most pages are `force-dynamic`, the
 * shell — including this fallback — is flushed with `200 OK` before the server
 * component finishes, and a `notFound()` thrown after that point can no longer set
 * the status line. That is why `/playbook/zzz` and `/case-studies/zzz` answered 200
 * while rendering "We can't find that page." (verified: removing the root boundary
 * makes them 404 again).
 *
 * The boundary is therefore scoped to the segments that benefit from it. Segments
 * that call `notFound()` — `/playbook`, `/case-studies`, `/demo`, `/admin` — are
 * deliberately left without one so their 404s are real.
 *
 * Kept deliberately small: a skeleton that guesses the layout of 38 different pages
 * would be wrong on most of them, and the `min-h` stops the footer jumping when the
 * real content arrives.
 */
export function RouteLoading() {
  return (
    <div
      className="page-container flex min-h-[60vh] items-center justify-center py-20"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary-400" aria-hidden="true" />
        <p className="text-sm text-muted-fg">Loading…</p>
      </div>
    </div>
  );
}
