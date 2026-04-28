/**
 * Partner self-service layout.
 *
 * Purpose: Restrict partner UI to self-service navigation only.
 * Location: /app/partner/layout.tsx
 */

import Link from 'next/link';
import { ReactNode } from 'react';

const partnerLinks = [
  { href: '/partner/dashboard', label: 'Dashboard' },
  { href: '/partner/my-property', label: 'My Property' },
  { href: '/partner/rooms', label: 'Rooms' },
  { href: '/partner/rates', label: 'Rates' },
  { href: '/partner/bookings', label: 'Bookings' },
  { href: '/partner/settings', label: 'Settings' },
];

export default function PartnerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-base-100">
      <header className="border-b border-base-300 bg-base-100">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-base-content/60">Partner Portal</p>
            <h1 className="text-lg font-semibold text-base-content">Hotel Etuna Network</h1>
          </div>
          <Link href="/" className="btn btn-ghost btn-sm">
            Hotel Etuna
          </Link>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 md:grid-cols-[260px_1fr]">
        <aside className="rounded-xl border border-base-300 bg-base-100 p-3">
          <nav className="menu gap-1">
            {partnerLinks.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </nav>
        </aside>
        <main className="rounded-xl border border-base-300 bg-base-100 p-6">{children}</main>
      </div>
    </div>
  );
}
