/**
 * Navigation Header Component
 *
 * Purpose: Landing page navigation header with logo, navigation links, and CTA button
 * Location: /components/sections/landing/NavigationHeader.tsx
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { HotelEtunaLogo } from '@/components/brand/HotelEtunaLogo';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { PublicAuthNav } from '@/components/shared/PublicAuthNav';
import { GuestNavLink } from '@/components/shared/GuestNavLink';
import { cn } from '@/lib/utils/cn';

const NAV_LINKS = [
  { href: '/rooms', label: 'Rooms' },
  { href: '/facilities', label: 'Facilities' },
  { href: '/dining', label: 'Dining' },
  { href: '/partners', label: 'Partners' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
] as const;

export default function NavigationHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-nude-200 bg-surface-header">
      <div className="etuna-container-marketing">
        <div className="flex h-16 items-center justify-between md:h-20">
          <HotelEtunaLogo size="md" variant="horizontal-compact" href="/" />

          <nav className="hidden items-center gap-6 md:flex" aria-label="Main navigation">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'etuna-nav-link',
                  pathname === item.href || pathname.startsWith(`${item.href}/`)
                    ? 'etuna-nav-link-active'
                    : undefined,
                )}
              >
                {item.label}
              </Link>
            ))}
            <GuestNavLink className="etuna-nav-link" />
          </nav>

          <div className="hidden items-center gap-4 md:flex">
            <PublicAuthNav variant="header" />
            <Button asChild variant="primary" size="default" className="min-h-[44px]">
              <Link href="/#booking">Book Now</Link>
            </Button>
          </div>

          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-etuna-button hover:bg-nude-50 md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-ink-900" />
            ) : (
              <Menu className="h-6 w-6 text-ink-900" />
            )}
          </button>
        </div>
      </div>

      <div
        id="mobile-menu"
        className={cn(
          'border-t border-nude-200 bg-white md:hidden',
          mobileMenuOpen ? '' : 'hidden',
        )}
        role="dialog"
        aria-label="Mobile navigation"
        aria-hidden={!mobileMenuOpen}
      >
        <nav className="space-y-3 px-4 py-4" aria-label="Mobile navigation">
          {NAV_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-h-[44px] items-center py-3 text-body font-semibold text-ink-900"
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <GuestNavLink
            className="flex min-h-[44px] items-center py-3 text-body font-semibold text-ink-900"
            onNavigate={() => setMobileMenuOpen(false)}
          />
          <PublicAuthNav
            variant="header"
            className="py-1"
            onNavigate={() => setMobileMenuOpen(false)}
          />
          <Button asChild variant="primary" size="lg" className="w-full min-h-12">
            <Link href="/#booking" onClick={() => setMobileMenuOpen(false)}>
              Book Now
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
