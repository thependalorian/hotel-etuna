/**
 * Header nav link to guest hub when signed in as a traveller.
 * Location: /components/shared/GuestNavLink.tsx
 */

'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { isGuestConsumerRole } from '@/lib/auth/roles';

type GuestNavLinkProps = {
  className?: string;
  onNavigate?: () => void;
};

export function GuestNavLink({ className, onNavigate }: GuestNavLinkProps) {
  const { data: session, status } = useSession();

  if (status !== 'authenticated' || !isGuestConsumerRole(session?.user?.role)) {
    return null;
  }

  return (
    <Link
      href="/guest"
      className={className}
      onClick={onNavigate}
    >
      My stays
    </Link>
  );
}
