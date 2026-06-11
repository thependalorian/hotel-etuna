/**
 * Guest stays hub
 *
 * Purpose: List active stays for the signed-in guest.
 * Location: /app/guest/page.tsx
 */

import { Metadata } from 'next';
import { GuestDashboard } from '@/components/features/guest/GuestDashboard';
import { guestCopy } from '@/lib/copy/guest';

export const metadata: Metadata = {
  title: guestCopy.hub.title,
  description: guestCopy.hub.description,
};

export default function GuestHomePage() {
  return <GuestDashboard />;
}
