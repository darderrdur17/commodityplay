"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { CAREER_PRICING_PATH } from "@/lib/pricing-routes";

function PricingRedirectContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const plan = searchParams.get("plan");
    const params = new URLSearchParams();
    params.set("track", "career");

    for (const key of ["locked", "cancelled"] as const) {
      const value = searchParams.get(key);
      if (value) params.set(key, value);
    }

    let url = `${CAREER_PRICING_PATH.split("?")[0]}?${params.toString()}`;
    if (plan === "pro" || plan === "elite") url += `#plan-${plan}`;
    else url += "#pricing";

    window.location.replace(url);
  }, [searchParams]);

  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <div className="animate-spin w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full" />
    </div>
  );
}

export function PricingRedirect() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="animate-spin w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full" />
        </div>
      }
    >
      <PricingRedirectContent />
    </Suspense>
  );
}
