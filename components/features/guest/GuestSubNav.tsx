/**
 * GuestSubNav — active-route guest portal sub-navigation.
 * Location: components/features/guest/GuestSubNav.tsx
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

const GUEST_NAV: Array<{ href: string; label: string }> = [
  { href: '/guest', label: 'Overview' },
  { href: '/guest/loyalty', label: 'Loyalty' },
  { href: '/guest/profile', label: 'Profile' },
  { href: '/guest/dsar', label: 'Data & privacy' },
];

function isActivePath(pathname: string, href: string): boolean {
  if (href === '/guest') return pathname === '/guest';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function GuestSubNav() {
  const pathname = usePathname() ?? '';

  return (
    <nav
      className="mb-8 flex flex-wrap items-center gap-2 border-b border-nude-200 pb-2"
      aria-label="Guest navigation"
    >
      {GUEST_NAV.map((item) => {
        const active = isActivePath(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium transition-colors',
              active
                ? 'bg-ci-primary/10 text-ci-secondary-chocolate font-semibold'
                : 'text-ink-600 hover:bg-nude-100 hover:text-ci-accent-terracotta'
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
