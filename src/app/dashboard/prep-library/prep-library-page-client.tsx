"use client";

import { useEffect, useState } from "react";
import { PrepLibraryBody } from "@/components/dashboard/prep-library-section";
import { PREP_LIBRARY_SEGMENTS } from "@/data/prep-library";

interface PrepLibraryPageClientProps {
  userTier: string;
  userTrack: "CAREER" | "SALES";
  isAdmin: boolean;
}

function readHashAnchor(): string | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.replace(/^#/, "");
  return hash || null;
}

export function PrepLibraryPageClient({
  userTier,
  userTrack,
  isAdmin,
}: PrepLibraryPageClientProps) {
  const [hashAnchor, setHashAnchor] = useState<string | null>(null);

  useEffect(() => {
    setHashAnchor(readHashAnchor());

    function onHashChange() {
      setHashAnchor(readHashAnchor());
    }

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const forceSales = hashAnchor === PREP_LIBRARY_SEGMENTS.SALES.anchor;
  const forceCareer = hashAnchor === PREP_LIBRARY_SEGMENTS.CAREER.anchor;

  const showSales =
    userTrack === "SALES" || isAdmin || forceSales;
  const showCareer =
    (userTrack === "CAREER" || isAdmin) && !forceSales;

  useEffect(() => {
    if (!hashAnchor) return;
    const el = document.getElementById(hashAnchor);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [hashAnchor, showSales, showCareer]);

  return (
    <>
      {showCareer && (
        <div className="mb-8">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900">
            {PREP_LIBRARY_SEGMENTS.CAREER.title}
          </h1>
          <p className="text-sm text-muted-fg mt-1">
            {PREP_LIBRARY_SEGMENTS.CAREER.cardDescription}
          </p>
        </div>
      )}
      {showCareer && <PrepLibraryBody track="CAREER" userTier={userTier} />}
      {showSales && <PrepLibraryBody track="SALES" userTier={userTier} />}
      {!showCareer && !showSales && forceCareer && (
        <PrepLibraryBody track="CAREER" userTier={userTier} />
      )}
    </>
  );
}
