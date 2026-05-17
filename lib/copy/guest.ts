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
    pastStaysTitle: 'Past stays',
    pastStaysEmpty: 'Completed stays will appear here after check-out.',
  },
  loyalty: {
    title: 'Loyalty rewards',
    empty: 'Earn points when you settle your folio during a stay.',
  },
  folio: {
    pastStayBanner:
      'This stay has ended. You can view your folio history; room service and payments are closed.',
  },
} as const;
