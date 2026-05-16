/**
 * Public marketing pages — home, partners, shared CTAs.
 * Location: lib/copy/public.ts
 */

import { brand } from '@/lib/copy/brand';
import { restaurantHoursLabels } from '@/lib/dining/restaurant-hours';

export const publicCopy = {
  home: {
    meta: {
      title: `${brand.name} - ${brand.taglineTitleCase}`,
      description: `Welcome to ${brand.name} in Ongwediva, Namibia. ${brand.meaning}`,
    },
    hero: {
      title: brand.taglineTitleCase,
      subtitle: `Welcome to ${brand.name} — your home in the heart of Ongwediva`,
    },
    story: {
      heading: 'More than a hotel — a Namibian welcome',
      body: `"Etuna" means "${brand.tagline}" in Oshiwambo. Five room categories, a refreshing pool, and Etuna Restaurant — ${brand.proofPoints.tradeFair}.`,
    },
    booking: {
      heading: 'Book your stay',
      subtitle: brand.leadLine,
    },
    partners: {
      heading: 'Referral partners',
      subtitle:
        'Trusted properties in our referral network when you travel beyond Ongwediva — book through Hotel Etuna.',
    },
  },
  partners: {
    meta: {
      title: `Referral partners | ${brand.name}`,
      description: `Explore trusted partner stays curated by ${brand.name}.`,
    },
    hero: {
      title: 'Referral partners',
      subtitle: 'Trusted accommodation partners across Namibia.',
    },
  },
  dining: {
    hours: {
      breakfast: restaurantHoursLabels.breakfast,
      lunchDinner: restaurantHoursLabels.lunchDinner,
      bar: restaurantHoursLabels.bar,
    },
  },
  trustIndicators: [
    brand.proofPoints.tradeFair,
    'NFC payments on property',
    '24-hour security',
  ],
  /** Gated pricing — sentence case per PRD §9 */
  gated: {
    viewPrices: 'Sign in to view prices',
    viewRates: 'Sign in to view rates',
    viewPricesAndBook: 'Sign in to view prices and book',
    viewPartnerRatesAndBook: 'Sign in to view partner rates and book',
    orderOnline: 'Sign in to order online',
    menuBrowseOnly:
      'This menu is for browsing only. Sign in to place room service or dine-in orders.',
    roomsBrowseOnly:
      'Browse room photo tours freely. Sign in to view rates and complete your booking.',
    completeBooking: 'Sign in to complete booking',
    roomsFoundSignIn: 'Rooms found. Sign in or create an account to complete your booking.',
    roomAvailableSignIn:
      'This room is available for your dates. Sign in or create an account to see rates and confirm booking.',
  },
  ctas: {
    bookStay: 'Book your stay',
    bookNow: 'Book now',
    explore: 'Explore',
    viewDetails: 'View details',
    viewPropertyDetails: 'View property details',
    signIn: 'Sign in',
    signUp: 'Sign up',
    viewFullMenu: 'View full menu',
    contactConcierge: 'Contact concierge',
    inquire: 'Inquire',
  },
} as const;
