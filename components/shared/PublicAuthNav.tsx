/**
 * Session-aware sign-in / account / sign-out links for public layouts.
 * Location: /components/shared/PublicAuthNav.tsx
 */

'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import {
  getSignedInAccountHref,
  getSignedInAccountLabel,
} from '@/lib/auth/public-session-nav';
import { publicCopy } from '@/lib/copy/public';
import { cn } from '@/lib/utils/cn';

const GUEST_SIGN_IN_HREF = '/login?redirect=/guest';

type PublicAuthNavProps = {
  variant?: 'header' | 'footer';
  className?: string;
  onNavigate?: () => void;
};

export function PublicAuthNav({
  variant = 'header',
  className,
  onNavigate,
}: PublicAuthNavProps) {
  const { data: session, status } = useSession();
  const isHeader = variant === 'header';
  const linkClass = isHeader
    ? 'text-sm font-medium text-base-content hover:text-primary transition-colors min-h-[44px] flex items-center'
    : 'text-nude-100 hover:text-khaki-sand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-khaki-sand focus-visible:ring-offset-2 focus-visible:ring-offset-terracotta-900 rounded-sm transition-colors';

  const signOutClass = isHeader
    ? linkClass
    : cn(linkClass, 'font-medium');

  if (status === 'loading') {
    return (
      <Link
        href={GUEST_SIGN_IN_HREF}
        className={cn(linkClass, className)}
        onClick={onNavigate}
        aria-label={publicCopy.nav.guestSignInAria}
      >
        {publicCopy.nav.guestSignIn}
      </Link>
    );
  }

  if (status !== 'authenticated' || !session?.user) {
    return (
      <Link
        href={GUEST_SIGN_IN_HREF}
        className={cn(linkClass, className)}
        onClick={onNavigate}
        aria-label={publicCopy.nav.guestSignInAria}
      >
        {publicCopy.nav.guestSignIn}
      </Link>
    );
  }

  const role = session.user.role;
  const email = session.user.email ?? '';
  const accountHref = getSignedInAccountHref(role, email);
  const accountLabel = getSignedInAccountLabel(role, email);

  return (
    <div
      className={cn(
        'flex items-center gap-3',
        isHeader ? 'flex-row' : 'flex-col items-start gap-2',
        className,
      )}
    >
      <Link
        href={accountHref}
        className={linkClass}
        onClick={onNavigate}
        title={email}
      >
        {accountLabel}
      </Link>
      <button
        type="button"
        className={signOutClass}
        onClick={() => {
          onNavigate?.();
          void signOut({ callbackUrl: '/' });
        }}
      >
        {publicCopy.nav.signOut}
      </button>
    </div>
  );
}
