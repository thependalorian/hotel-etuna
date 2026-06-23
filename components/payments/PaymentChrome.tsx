/**
 * PaymentChrome
 *
 * Purpose: Slim site header for payment flows (deposit, success, failed) so guests can navigate back.
 * Location: /components/payments/PaymentChrome.tsx
 */

import Link from 'next/link';
import { HotelEtunaLogo } from '@/components/brand/HotelEtunaLogo';
import { GuestNavLink } from '@/components/shared/GuestNavLink';

export function PaymentChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-background flex flex-col">
      <header className="border-b border-base-300 bg-base-100/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <HotelEtunaLogo size="sm" variant="horizontal-compact" href="/" />
          <nav className="flex items-center gap-3 text-sm" aria-label="Payment navigation">
            <Link
              href="/guest"
              className="btn btn-ghost btn-sm rounded-full min-h-[44px] px-4"
            >
              My stays
            </Link>
            <GuestNavLink className="btn btn-ghost btn-sm rounded-full min-h-[44px] px-4 hidden sm:inline-flex" />
            <Link href="/" className="btn btn-outline btn-sm rounded-full min-h-[44px] px-4">
              Home
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
