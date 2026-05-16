/**
 * In-stay guest hub copy.
 * Location: lib/copy/guest.ts
 */

import { brand } from '@/lib/copy/brand';

export const guestCopy = {
  hub: {
    title: 'My stay',
    description:
      'Manage your folio, order room service, and settle charges during your stay. Sign in with the email on your reservation.',
    loyaltyHint: brand.proofPoints.loyalty,
  },
} as const;
