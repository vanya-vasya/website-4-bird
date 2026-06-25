import "./globals.css";
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Newsreader, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { cn } from "@/lib/utils";

import { ModalProvider } from "@/components/modal-provider";
import { ToasterProvider } from "@/components/toaster-provider";
import { CurrencyProvider } from "@/contexts/currency-context";

import NextTopLoader from "nextjs-toploader";

import { GoogleAnalytics } from "@next/third-parties/google";

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
  display: "swap",
  // Next.js doesn't have size-adjust overrides for Newsreader yet — suppress the warning
  adjustFontFallback: false,
});

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://myfastbird.com"),
  title: {
    default: "FastBird — Travel data that just works",
    template: "%s · FastBird",
  },
  description:
    "Top up, tap, and you're online in minutes. FastBird sells eSIM data plans by destination on a simple prepaid Points balance.",
  applicationName: "FastBird",
  openGraph: {
    type: "website",
    url: "https://myfastbird.com",
    siteName: "FastBird",
    title: "FastBird — Travel data that just works",
    description:
      "Instant eSIM data plans by destination. Top up your Points, get your QR, and connect anywhere.",
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
    <ClerkProvider>
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
          <CurrencyProvider>
            <ModalProvider />
            <ToasterProvider />
            <NextTopLoader color="#3c3c77" showSpinner={false} />
            {children}
          </CurrencyProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
