/**
 * Guest portal layout
 *
 * Purpose: Authenticated guest area for in-stay folio and room service.
 * Location: /app/guest/layout.tsx
 */

import Link from 'next/link';
import NavigationHeader from '@/components/sections/landing/NavigationHeader';
import Footer from '@/components/shared/Footer';

export default function GuestLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-background flex flex-col">
      <NavigationHeader />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <nav
            className="flex flex-wrap items-center justify-end gap-4 mb-6 text-sm text-nude-600"
            aria-label="Guest navigation"
          >
            <Link href="/guest" className="inline-flex min-h-11 items-center hover:text-terracotta-800 font-medium">
              My stays
            </Link>
            <Link href="/guest/loyalty" className="inline-flex min-h-11 items-center hover:text-terracotta-800 font-medium">
              Loyalty
            </Link>
            <Link href="/profile" className="inline-flex min-h-11 items-center hover:text-terracotta-800 font-medium">
              Account
            </Link>
            <Link href="/guest/dsar" className="inline-flex min-h-11 items-center hover:text-terracotta-800 font-medium text-xs opacity-70">
              Data rights
            </Link>
          </nav>
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
