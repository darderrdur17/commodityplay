import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Roboto } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { SessionProvider } from "@/components/session-provider";
import { Toaster } from "@/components/ui/toaster";
import { NAV_OFFSET } from "@/lib/layout-constants";
import { BRAND_NAME, BRAND_SITE_URL } from "@/lib/brand";
import { getFooterGuides } from "@/lib/content/accessors";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const roboto = Roboto({
  subsets: ["latin"],
  variable: "--font-roboto",
  display: "swap",
  weight: ["400", "500", "700"],
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
  const footerGuides = await getFooterGuides();

  return (
    <html lang="en" className={`${inter.variable} ${roboto.variable}`}>
      <body className="font-sans antialiased bg-white text-gray-800 min-h-screen flex flex-col overflow-x-hidden">
        <SessionProvider>
          <Nav />
          <main className="flex-1" style={{ paddingTop: NAV_OFFSET }}>{children}</main>
          <Footer footerGuides={footerGuides} />
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
