/**
 * RoomsBookRedirect
 *
 * Purpose: Legacy `/rooms?book=1` links forward to the homepage booking widget.
 * Location: /components/features/rooms/RoomsBookRedirect.tsx
 */

'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function RoomsBookRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('book') === '1') {
      router.replace('/#booking');
    }
  }, [router, searchParams]);

  return null;
}
