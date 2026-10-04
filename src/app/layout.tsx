import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Nav } from "@/components/nav";
import { FooterWrapper } from "@/components/footer-wrapper";
import { SiteChrome } from "@/components/site-chrome";
import { SessionProvider } from "@/components/session-provider";
import { Toaster } from "@/components/ui/toaster";
import { BRAND_NAME, BRAND_SITE_URL } from "@/lib/brand";

// Inter and Roboto are self-hosted as latin-subset *variable* fonts (wght 100-900).
//
// Why not `next/font/google`: that fetches the CSS + font files from Google at build
// time, and Google intermittently responds 200 with extensionless `/l/font?kit=...`
// URLs. Next's loader then runs `/\.(woff|woff2|eot|ttf|otf)$/.exec(url)![1]` on those
// URLs and throws `TypeError: Cannot read properties of null (reading '1')`, failing
// the whole build (vercel/next.js#99114, roughly 1 in 60 responses). Next's internal
// `retry()` only covers transport errors and non-200s, so a 200 with bad URLs passes
// straight through. Self-hosting removes the build-time Google fetch entirely.
//
// One variable file per family replaces the previous nine per-weight files:
// 89 KB total instead of 409 KB, with identical glyph coverage. The latin subset
// omits U+2192 (->) and U+2264/U+2265 (<=/>=), but nothing in `src/` renders those
// characters, and this is the same subset `next/font/google` was already serving.
//
// `weight: "100 900"` is REQUIRED, not decorative: next/font/local only emits a
// `font-weight` descriptor when `weight` is set, so omitting it would pin every
// weight to `normal` (400) and silently flatten all bold text.
const inter = localFont({
  src: "./fonts/inter-variable.woff2",
  variable: "--font-inter",
  display: "swap",
  weight: "100 900",
  fallback: ["system-ui", "sans-serif"],
});

const roboto = localFont({
  src: "./fonts/roboto-variable.woff2",
  variable: "--font-roboto",
  display: "swap",
  weight: "100 900",
  fallback: ["system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? BRAND_SITE_URL
  ),
  title: {
    default: `${BRAND_NAME} — Build Your Career in Commodity Trading`,
    template: `%s | ${BRAND_NAME}`,
  },
  description:
    "The definitive career and sales guide for commodity trading. Starter, Pro, and Elite resources for anyone building a desk, breaking in, or selling into trading firms.",
  keywords: [
    "commodity trading",
    "career guide",
    "playbook",
    "energy trading",
    "metals trading",
    "agriculture trading",
    "desk analyst",
  ],
  openGraph: {
    type: "website",
    locale: "en_SG",
    url: BRAND_SITE_URL,
    siteName: BRAND_NAME,
    title: `${BRAND_NAME} — Build Your Career in Commodity Trading`,
    description:
      "The definitive career guide for commodity trading. From first desk to senior coverage.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: BRAND_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND_NAME,
    description: "The definitive career guide for commodity trading.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/brand/logo-mark.png",
    apple: "/brand/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#0830a0",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${roboto.variable}`}>
      <body className="font-sans antialiased bg-white text-gray-800 min-h-screen flex flex-col overflow-x-hidden">
        <SessionProvider>
          <SiteChrome nav={<Nav />} footer={<FooterWrapper />}>
            {children}
          </SiteChrome>
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
