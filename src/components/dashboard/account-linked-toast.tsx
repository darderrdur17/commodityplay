"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function AccountLinkedToast({
  show,
  accountName,
}: {
  show: boolean;
  accountName?: string | null;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!show || !mounted) return null;

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed bottom-6 left-1/2 z-[200] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2",
        "rounded-xl border border-green-200 bg-white px-4 py-3 shadow-lg"
      )}
    >
      <p className="flex items-center gap-2 text-sm font-semibold text-green-800">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
          <Check className="h-3.5 w-3.5 text-green-700" aria-hidden />
        </span>
        Account is linked!
      </p>
      {accountName ? (
        <p className="mt-1 pl-8 text-xs text-muted-fg leading-relaxed">
          {accountName} now shows this on Account Intelligence.
        </p>
      ) : (
        <p className="mt-1 pl-8 text-xs text-muted-fg leading-relaxed">
          It now shows on Account Intelligence.
        </p>
      )}
    </div>,
    document.body
  );
}
