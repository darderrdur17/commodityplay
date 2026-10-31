"use client";

import { BRAND_EMAIL_SUPPORT, BRAND_NAME } from "@/lib/brand";

/**
 * Last-resort error boundary.
 *
 * `error.tsx` catches failures *inside* the layout. This one catches a failure
 * **of** the layout itself (a crash in the header, the fonts, a provider), and it
 * must therefore supply its own `<html>` and `<body>` — Next does not wrap it.
 *
 * Styling is inline on purpose: if the root layout failed, the stylesheet link it
 * renders may never have been emitted, so a Tailwind-class version of this page
 * could arrive unstyled. Inline styles always survive.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: "#F7F8FA",
          color: "#111827",
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        }}
      >
        <main style={{ maxWidth: "520px", textAlign: "center" }}>
          <p
            style={{
              margin: "0 0 8px",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#065F46",
            }}
          >
            {BRAND_NAME}
          </p>
          <h1 style={{ margin: "0 0 12px", fontSize: "28px", lineHeight: 1.25 }}>
            The site failed to load.
          </h1>
          <p style={{ margin: "0 0 24px", fontSize: "15px", lineHeight: 1.6, color: "#4B5563" }}>
            Something broke before the page could render. Reloading usually fixes it.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={reset}
              style={{
                cursor: "pointer",
                border: "none",
                borderRadius: "10px",
                padding: "12px 20px",
                fontSize: "14px",
                fontWeight: 600,
                color: "#fff",
                background: "#3280ff",
              }}
            >
              Reload the page
            </button>
            <a
              href="/"
              style={{
                borderRadius: "10px",
                padding: "12px 20px",
                fontSize: "14px",
                fontWeight: 600,
                color: "#374151",
                textDecoration: "none",
                border: "1px solid #D1D5DB",
                background: "#fff",
              }}
            >
              Back to home
            </a>
          </div>
          <p style={{ margin: "24px 0 0", fontSize: "12px", color: "#6B7280" }}>
            If it keeps happening, tell{" "}
            <a href={`mailto:${BRAND_EMAIL_SUPPORT}`} style={{ color: "#3280ff" }}>
              {BRAND_EMAIL_SUPPORT}
            </a>
            {error.digest ? ` and quote reference ${error.digest}` : ""}.
          </p>
        </main>
      </body>
    </html>
  );
}
