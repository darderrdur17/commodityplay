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

  const canPreviewSales = userTrack === "SALES" || isAdmin;
  const canPreviewCareer = userTrack === "CAREER" || isAdmin;

  const showSales = canPreviewSales && !forceCareer;
  const showCareer = canPreviewCareer && !forceSales;

  useEffect(() => {
    if (!hashAnchor) return;
    const el = document.getElementById(hashAnchor);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [hashAnchor, showSales, showCareer]);

  return (
    <>
      {showCareer && <PrepLibraryBody track="CAREER" userTier={userTier} />}
      {showSales && <PrepLibraryBody track="SALES" userTier={userTier} />}
    </>
  );
}
