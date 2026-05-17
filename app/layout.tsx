import type { Metadata, Viewport } from "next";
import { Dancing_Script, Inter, JetBrains_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { StackProviderWrapper } from "@/components/providers/StackProviderWrapper";
import { SessionProviderWrapper } from "@/components/providers/SessionProviderWrapper";
import { AuthGateProvider } from "@/components/providers/AuthGateProvider";
import { RootErrorBoundary } from "@/components/RootErrorBoundary";
import { PostHogProvider } from "@/components/providers/PostHogProvider";
import OfflineBanner from "@/components/providers/OfflineBanner";
import { DevTestSessionBanner } from "@/components/shared/DevTestSessionBanner";
import ServiceWorkerRegistration from "@/components/providers/ServiceWorkerRegistration";
import { Toaster } from "@/components/ui";
import { Suspense } from "react";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfairDisplay = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair-display" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });
const dancingScript = Dancing_Script({ subsets: ["latin"], variable: "--font-dancing-script" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: "Hotel Etuna – He Takes Care of Us",
    template: "%s | Hotel Etuna",
  },
  description: "Welcome to Hotel Etuna in Ongwediva, Namibia. Experience authentic Namibian hospitality with 5 room types, on-site restaurant, and pool. Your home away from home near the Ongwediva Trade Fair.",
  keywords: [
    "Hotel Etuna",
    "Ongwediva hotel",
    "Namibia accommodation",
    "Ongwediva Trade Fair hotel",
    "Namibian hospitality",
    "hotel booking Namibia",
    "guest house Ongwediva",
    "Windhoek nearby accommodation",
    "conference facilities Namibia",
    "restaurant Ongwediva",
  ],
  authors: [{ name: "Hotel Etuna" }],
  creator: "Hotel Etuna",
  publisher: "Hotel Etuna",
  openGraph: {
    type: "website",
    locale: "en_NA",
    url: "https://hoteletuna.com",
    siteName: "Hotel Etuna",
    title: "Hotel Etuna – He Takes Care of Us",
    description: "Experience authentic Namibian hospitality in Ongwediva. 5 room types, on-site restaurant, and pool.",
    images: [
      {
        url: "/images/hotel-etuna-og.jpg",
        width: 1200,
        height: 630,
        alt: "Hotel Etuna - Your Home in Ongwediva, Namibia",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hotel Etuna – He Takes Care of Us",
    description: "Experience authentic Namibian hospitality in Ongwediva.",
    images: ["/images/hotel-etuna-og.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add verification codes when available
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#b8955a',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-NA" data-theme="hoteletuna">
      <body
        className={`${inter.variable} ${playfairDisplay.variable} ${jetbrainsMono.variable} ${dancingScript.variable} min-h-screen bg-surface-background text-surface-foreground font-sans antialiased`}
      >
        <ServiceWorkerRegistration />
        <OfflineBanner />
        <SessionProviderWrapper>
          <DevTestSessionBanner />
          <Suspense fallback={null}>
            <PostHogProvider>
              <StackProviderWrapper>
                <AuthGateProvider>
                  <RootErrorBoundary>{children}</RootErrorBoundary>
                </AuthGateProvider>
              </StackProviderWrapper>
            </PostHogProvider>
          </Suspense>
        </SessionProviderWrapper>
        <Toaster />
      </body>
    </html>
  );
}