import { Loader2 } from "lucide-react";

/**
 * Route-level loading state.
 *
 * WHY THIS FILE EXISTS: 42 route files opt out of caching with
 * `export const dynamic = "force-dynamic"`, and the app had no `loading.tsx`
 * anywhere. Every navigation therefore blocked on a server render with the old
 * page frozen on screen — no spinner, no skeleton, no feedback at all, which reads
 * as a dead click on a slow connection.
 *
 * Kept deliberately small: a skeleton that guesses the layout of 38 different
 * pages would be wrong on most of them, and the `min-h` stops the footer jumping
 * when the real content arrives.
 */
export default function Loading() {
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
