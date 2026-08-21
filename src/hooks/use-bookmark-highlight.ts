"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const HIGHLIGHT_DURATION_MS = 4000;
const SCROLL_RETRY_MS = 150;
const MAX_SCROLL_ATTEMPTS = 24;

export function useBookmarkHighlight(ready = true) {
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");
  const [activeId, setActiveId] = useState<string | null>(null);

  const isHighlighted = useCallback(
    (elementId: string) => activeId === elementId,
    [activeId]
  );

  useEffect(() => {
    if (!highlightId || !ready) return;

    let cancelled = false;
    let attempts = 0;
    let highlightTimer: ReturnType<typeof setTimeout> | undefined;

    const tryScroll = () => {
      if (cancelled) return;

      const el = document.getElementById(highlightId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setActiveId(highlightId);
        highlightTimer = setTimeout(() => setActiveId(null), HIGHLIGHT_DURATION_MS);
        return;
      }

      attempts += 1;
      if (attempts < MAX_SCROLL_ATTEMPTS) {
        setTimeout(tryScroll, SCROLL_RETRY_MS);
      }
    };

    const initialTimer = setTimeout(tryScroll, 100);

    return () => {
      cancelled = true;
      clearTimeout(initialTimer);
      if (highlightTimer) clearTimeout(highlightTimer);
    };
  }, [highlightId, ready]);

  return { highlightId, isHighlighted, activeId };
}
