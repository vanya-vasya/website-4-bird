import "./globals.css";
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import localFont from "next/font/local";
import { cn } from "@/lib/utils";

import { ModalProvider } from "@/components/modal-provider";
import { ToasterProvider } from "@/components/toaster-provider";
import { CurrencyProvider } from "@/contexts/currency-context";
import { CartProvider } from "@/contexts/cart-context";
import { CartDrawer } from "@/components/cart-drawer";

import NextTopLoader from "nextjs-toploader";

import { GoogleAnalytics } from "@next/third-parties/google";

// Self-hosted copies of the Google Fonts files (latin subset) — avoids the
// build-time fetch of fonts.googleapis.com, which fails intermittently on
// Vercel build machines and crashes next/font/google in Next 14.
// Regenerate with `node scripts/download-fonts.mjs`.
const newsreader = localFont({
  src: [
    { path: "./fonts/newsreader-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/newsreader-500-normal.woff2", weight: "500", style: "normal" },
    { path: "./fonts/newsreader-600-normal.woff2", weight: "600", style: "normal" },
    { path: "./fonts/newsreader-400-italic.woff2", weight: "400", style: "italic" },
    { path: "./fonts/newsreader-500-italic.woff2", weight: "500", style: "italic" },
    { path: "./fonts/newsreader-600-italic.woff2", weight: "600", style: "italic" },
  ],
  variable: "--font-newsreader",
  display: "swap",
  // Next.js doesn't have size-adjust overrides for Newsreader yet — suppress the warning
  adjustFontFallback: false,
});

const plexSans = localFont({
  src: [
    { path: "./fonts/ibm-plex-sans-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/ibm-plex-sans-500-normal.woff2", weight: "500", style: "normal" },
    { path: "./fonts/ibm-plex-sans-600-normal.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-plex-sans",
  display: "swap",
  adjustFontFallback: "Arial",
});

const plexMono = localFont({
  src: [
    { path: "./fonts/ibm-plex-mono-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/ibm-plex-mono-500-normal.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-plex-mono",
  display: "swap",
  // Next 14 only types "Arial" | "Times New Roman" for localFont fallback metrics,
  // neither fits a mono face — skip fallback adjustment instead
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  metadataBase: new URL("https://myfastbird.com"),
  title: {
    default: "FastBird — Travel data that just works",
    template: "%s · FastBird",
  },
  description:
    "Pick, pay, and you're online in minutes. FastBird sells eSIM data plans by destination with direct one-time payment.",
  applicationName: "FastBird",
  openGraph: {
    type: "website",
    url: "https://myfastbird.com",
    siteName: "FastBird",
    title: "FastBird — Travel data that just works",
    description:
      "Instant eSIM data plans by destination. Pay directly for your plan, get your QR, and connect anywhere.",
    images: [{ url: "/images/brand/og-card.png", width: 1200, height: 630, alt: "FastBird" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "FastBird — Travel data that just works",
    description: "Instant eSIM data plans by destination. Top up, tap, connect.",
    images: ["/images/brand/og-card.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      signInForceRedirectUrl="/dashboard"
      signUpForceRedirectUrl="/dashboard"
    >
      <html lang="en" suppressHydrationWarning>
        <body
          className={cn(
            "min-h-screen bg-surface font-sans text-ink antialiased",
            newsreader.variable,
            plexSans.variable,
            plexMono.variable
          )}
        >
          <GoogleAnalytics gaId="G-DYY23NK5V1" />
          <CartProvider>
            <CurrencyProvider>
              <ModalProvider />
              <ToasterProvider />
              <NextTopLoader color="#3c3c77" showSpinner={false} />
              {children}
            </CurrencyProvider>
            <CartDrawer />
          </CartProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
