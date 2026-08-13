/** Fixed app header height — keep logo + layout offsets in sync */
export const NAV_HEIGHT_PX = 72;

export const NAV_HEIGHT = `${NAV_HEIGHT_PX}px`;

export const NAV_OFFSET = `calc(${NAV_HEIGHT_PX}px + env(safe-area-inset-top, 0px))`;

export const MAIN_MIN_HEIGHT_BELOW_NAV = `calc(100svh - ${NAV_HEIGHT_PX}px - env(safe-area-inset-top, 0px))`;

/** Bottom safe-area — applied on footer, not main, so page content sits flush above footer */
export const FOOTER_BOTTOM_SAFE_PADDING =
  "max(1rem, env(safe-area-inset-bottom, 0px))";

/**
 * Shared content grid — matches Nav inner shell and .page-container in globals.css.
 * Full-width with horizontal padding only (no max-w cap).
 */
export const PAGE_GRID =
  "w-full max-w-none px-4 sm:px-8 lg:px-12";

/** Standard blue-section hero padding (starter pack pattern) */
export const PAGE_HERO_TOP = "pt-12 sm:pt-16 lg:pt-20";
export const PAGE_HERO_BOTTOM = "pb-16 sm:pb-24";

/** Landing career/sales heroes — same rhythm as PAGE_HERO (below track strip in document flow) */
export const LANDING_HERO_TOP = PAGE_HERO_TOP;
export const LANDING_HERO_BOTTOM = PAGE_HERO_BOTTOM;

/** Mid-page content sections (light or dark) */
export const PAGE_SECTION_PY = "py-16 sm:py-24";

/** Compact CTA bands before footer */
export const PAGE_CTA_PY = "py-14 sm:py-16";

/** Primary nav wordmark — gradient lockup (~4.3:1); explicit height keeps nav grid aligned */
export const PROMINENT_WORDMARK_WRAPPER =
  "inline-flex items-center h-11 sm:h-12 md:h-[3.25rem] max-h-full max-w-[min(100%,320px)] sm:max-w-[400px] md:max-w-[460px] lg:max-w-[520px] shrink-0 overflow-hidden";

/** Standalone wordmark (auth panels, etc.) — matches nav visual weight */
export const PROMINENT_WORDMARK_STANDALONE =
  "inline-flex items-center h-11 sm:h-12 md:h-[3.25rem] max-w-[min(100%,320px)] sm:max-w-[400px] md:max-w-[460px] lg:max-w-[520px] shrink-0 overflow-hidden";

export const PROMINENT_WORDMARK_IMAGE =
  "h-full w-auto max-w-full object-contain object-left";

export const HERO_EYEBROW_BASE =
  "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium tracking-wide mb-6 sm:mb-7";
