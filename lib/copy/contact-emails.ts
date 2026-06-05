/**
 * Hotel Etuna team inboxes — single source for public contact UI and form routing.
 * Location: lib/copy/contact-emails.ts
 */

import { brand } from '@/lib/copy/brand';

export type TeamEmailEntry = {
  role: string;
  email: string;
  description: string;
};

/** Canonical list for /contact and docs — marketing, admin, support, founder, frontdesk */
export const HOTEL_ETUNA_TEAM_EMAILS: readonly TeamEmailEntry[] = [
  {
    role: 'Front desk',
    email: brand.emailFrontDesk,
    description: 'Reservations, availability, check-in, and questions during your stay',
  },
  {
    role: 'Marketing',
    email: brand.emailMarketing,
    description: 'Events, conference hall, campsite, promotions, and referral partners',
  },
  {
    role: 'Support',
    email: brand.emailSupport,
    description: 'Help with the website, guest portal, or online booking',
  },
  {
    role: 'Administration',
    email: brand.emailAdmin,
    description: 'Contracts, legal notices, and partner property updates',
  },
  {
    role: 'Founder',
    email: brand.emailFounder,
    description: 'Executive and ownership inquiries',
  },
] as const;

/** Route contact-form submissions to the right inbox by subject. */
export function contactFormRecipient(subject: string): string {
  const normalized = subject.toLowerCase();
  if (normalized.includes('event') || normalized.includes('conference')) {
    return brand.emailMarketing;
  }
  if (normalized.includes('feedback')) {
    return brand.emailSupport;
  }
  return brand.emailFrontDesk;
}
