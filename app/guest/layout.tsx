/**
 * Guest portal layout
 *
 * Purpose: Authenticated guest area for in-stay folio and room service.
 * Location: /app/guest/layout.tsx
 */

import Link from 'next/link';
import NavigationHeader from '@/components/sections/landing/NavigationHeader';
import Footer from '@/components/shared/Footer';
import { HotelEtunaLogo } from '@/components/brand/HotelEtunaLogo';

export default function GuestLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-background flex flex-col">
      <NavigationHeader />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <HotelEtunaLogo size="sm" href="/" showTagline />
            <nav className="text-sm text-nude-600" aria-label="Guest navigation">
              <Link href="/guest" className="hover:text-terracotta-900 font-medium">
                My stays
              </Link>
            </nav>
          </div>
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
