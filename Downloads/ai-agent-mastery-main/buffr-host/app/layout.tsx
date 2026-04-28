import type { Metadata, Viewport } from "next";
import { Dancing_Script, Inter, JetBrains_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { StackProviderWrapper } from "@/components/providers/StackProviderWrapper";
import { SessionProviderWrapper } from "@/components/providers/SessionProviderWrapper";
import { RootErrorBoundary } from "@/components/RootErrorBoundary";
import { PostHogProvider } from "@/components/providers/PostHogProvider";
import { Toaster } from "@/components/ui";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfairDisplay = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair-display" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });
const dancingScript = Dancing_Script({ subsets: ["latin"], variable: "--font-dancing-script" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: "Buffr Host - AI-Native Hospitality Management Platform",
    template: "%s | Buffr Host",
  },
  description: "Turn missed inquiries into direct bookings with AI-powered Sofia. Answer guest inquiries 24/7, manage reservations, restaurants, and operations—all in one unified platform. Get started free, no credit card required.",
  keywords: [
    "hospitality management",
    "hotel management system",
    "restaurant management",
    "AI concierge",
    "property management system",
    "booking system",
    "guest management",
    "Namibia hospitality",
    "Sofia AI",
    "direct bookings",
  ],
  authors: [{ name: "Buffr Host" }],
  creator: "Buffr Host",
  publisher: "Buffr Host",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://buffrhost.com",
    siteName: "Buffr Host",
    title: "Buffr Host - AI-Native Hospitality Management",
    description: "Turn missed inquiries into direct bookings with AI-powered Sofia. Answer guest inquiries 24/7.",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Buffr Host - AI-Native Hospitality Management Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Buffr Host - AI-Native Hospitality Management",
    description: "Turn missed inquiries into direct bookings with AI-powered Sofia.",
    images: ["/images/og-image.jpg"],
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
    // Add your verification codes when available
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="buffr">
      <body
        className={`${inter.variable} ${playfairDisplay.variable} ${jetbrainsMono.variable} ${dancingScript.variable} min-h-screen bg-surface-background text-surface-foreground font-sans antialiased`}
      >
        <PostHogProvider>
          <StackProviderWrapper>
            <SessionProviderWrapper>
              <RootErrorBoundary>{children}</RootErrorBoundary>
            </SessionProviderWrapper>
          </StackProviderWrapper>
        </PostHogProvider>
        <Toaster />
      </body>
    </html>
  );
}