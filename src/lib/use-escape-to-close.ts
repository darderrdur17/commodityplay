"use client";

import { useEffect, useRef } from "react";

/**
 * Closes a modal when Escape is pressed.
 *
 * Every modal in this app previously relied on its small "Close" button (or a
 * backdrop click) as the only exit. A keyboard user had no conventional way out,
 * and because the overlay sits at `z-[100]` and swallows pointer events, the page
 * behind it was unreachable too. `role="dialog"` + `aria-modal` announce the
 * surface correctly, but they do not provide an exit — this does.
 *
 * The callback is held in a ref so an inline `onClose={() => setOpen(false)}` does
 * not re-subscribe the listener on every render.
 */
export function useEscapeToClose(open: boolean, onClose: () => void): void {
  const handler = useRef(onClose);

  useEffect(() => {
    handler.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      // A nested handler (e.g. a search box inside the dialog) may already have
      // consumed the key; only the outermost unhandled Escape should close.
      if (event.defaultPrevented) return;
      event.stopPropagation();
      handler.current();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);
}
