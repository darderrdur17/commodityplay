import type { MetadataRoute } from "next";
import { BRAND_NAME } from "@/lib/brand";
import { SITE_DESCRIPTION } from "@/lib/seo";

/**
 * Serves /manifest.webmanifest — the Web App Manifest.
 *
 * Next injects the `<link rel="manifest">` automatically once this file exists.
 *
 * Why it matters here: Android/Chrome will not offer "Add to Home screen" with a
 * proper name and icon without it, and the manifest is what a PWA-installability
 * check reads. It is NOT an Android app listing — a Play Store entry is a separate
 * artefact with its own package id, signing key and review process, and there is
 * no Play listing for CommodityPlay today.
 *
 * ⚠️ ICON SIZES ARE DECLARED AS THEY ACTUALLY ARE (184/180 px). The installability
 * criteria want 192×192 and 512×512. Claiming 192 when the file is 184 would be a
 * lie the browser can detect, so the honest thing is to declare the real size and
 * export proper 192/512 assets later. Replace both entries when those exist.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    // `BRAND_NAME` carries the trailing period used in the site title; the
    // launcher label does not need it.
    name: BRAND_NAME,
    short_name: "CommodityPlay",
    description: SITE_DESCRIPTION,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    // The emerald used across the marketing surface (`#065F46`).
    theme_color: "#065F46",
    lang: "en",
    dir: "ltr",
    categories: ["education", "business", "finance"],
    icons: [
      {
        src: "/brand/logo-mark.png",
        sizes: "184x184",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
