/**
 * The shared landing-page CTA treatment (owner request, 11 Oct 2026):
 * "for every button on both landing pages — change to this same round edge shape
 * and when hover over, showing the green-blue gradient colour."
 *
 * Two things happen here, and deliberately ONLY two:
 *
 *   1. `rounded-full` — the pill radius. `twMerge` lets it beat the radius baked
 *      into `Button`'s `size` variants, so a call site only ever adds this string.
 *
 *   2. `hover:bg-gradient-to-r hover:from-emerald-500 hover:to-primary-400` —
 *      the green -> blue gradient, applied as a background *image* on hover.
 *      That is what lets every CTA keep its resting palette untouched: the white
 *      "Join Free" button on the navy career hero stays white, the teal-outlined
 *      "Contact Us" stays outlined, and only the hover state changes. A gradient
 *      image paints over whatever `background-color` the variant already set, so
 *      no variant needs editing and nothing else on the site moves.
 *
 * `hover:text-white` rides along because the gradient is a mid-tone surface: the
 * `primary-dark` variant's dark-navy label would otherwise sit on top of it.
 * Buttons that are already white-labelled are unaffected.
 *
 * WHY THIS IS NOT IN `components/ui/button.tsx`: that module is `"use client"`,
 * and `PricingCtaBand` is a Server Component. A client-reference proxy is not a
 * usable string, so the constant lives in a plain module both graphs can import.
 *
 * SCOPE: the CTAs on `/` (both tracks) and the pop-ups they open. Accordion and
 * disclosure rows are deliberately excluded — they are `<button>` elements
 * structurally but read as list rows, and a pill radius would break them. The
 * inert mock panels in `sales-feature-mocks.tsx` / `mentor-demo-card.tsx` are
 * product mock-ups, not buttons, and are excluded too.
 */
export const LANDING_CTA =
  "rounded-full hover:bg-gradient-to-r hover:from-emerald-500 hover:to-primary-400 hover:text-white";
