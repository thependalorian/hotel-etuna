/**
 * Guest portal layout
 *
 * Purpose: Authenticated guest self-service hub (overview, loyalty, profile, data rights).
 * Location: /app/guest/layout.tsx
 */

import Link from 'next/link';
import NavigationHeader from '@/components/sections/landing/NavigationHeader';
import Footer from '@/components/shared/Footer';

/** Guest portal sections. Bookings calendar + requests are added in a later slice. */
const GUEST_NAV: Array<{ href: string; label: string }> = [
  { href: '/guest', label: 'Overview' },
  { href: '/guest/loyalty', label: 'Loyalty' },
  { href: '/guest/profile', label: 'Profile' },
  { href: '/guest/dsar', label: 'Data & privacy' },
];

export default function GuestLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-background flex flex-col">
      <NavigationHeader />
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <nav
            className="mb-8 flex flex-wrap items-center gap-2 border-b border-nude-200 pb-2"
            aria-label="Guest navigation"
          >
            {GUEST_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium text-nude-600 hover:bg-nude-100 hover:text-terracotta-800"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
