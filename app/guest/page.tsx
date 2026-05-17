/**
 * Guest stays hub
 *
 * Purpose: List active stays for the signed-in guest.
 * Location: /app/guest/page.tsx
 */

import { Metadata } from 'next';
import { GuestStaysList } from '@/components/features/guest/GuestStaysList';
import { guestCopy } from '@/lib/copy/guest';

export const metadata: Metadata = {
  title: guestCopy.hub.title,
  description: guestCopy.hub.description,
};

export default function GuestStaysPage() {
  return (
    <div>
      <h1 className="buffr-page-title">{guestCopy.hub.title}</h1>
      <p className="buffr-page-desc mb-8">{guestCopy.hub.description}</p>
      <GuestStaysList />
    </div>
  );
}
