/**
 * Room QR entry — redirect to stay folio
 *
 * Purpose: Scan in-room QR → resolve booking → guest stay folio (login if needed).
 * Location: /app/guest/room/page.tsx
 */

import { Suspense } from 'react';
import { GuestRoomQrClient } from '@/app/guest/room/GuestRoomQrClient';

export default function GuestRoomQrPage() {
  return (
    <Suspense
      fallback={
        <div className="skeleton h-32 w-full rounded-xl" aria-hidden />
      }
    >
      <GuestRoomQrClient />
    </Suspense>
  );
}
