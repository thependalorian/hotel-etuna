/**
 * Brand copy spine — single source for tagline, voice, and forbidden phrases.
 * Location: lib/copy/brand.ts
 * Source: docs/brand/Hotel-Etuna-CI-Guide-Extract.pdf
 */

/** Registered legal entity (Namibia CC) — align with HOTEL_ETUNA_LEGAL_NAME env on server. */
export const HOTEL_ETUNA_LEGAL_NAME = 'Etuna Guesthouse And Tours CC';

export const brand = {
  name: 'Hotel Etuna',
  legalName: HOTEL_ETUNA_LEGAL_NAME,
  /** Script tagline on the official logo lockup (English marketing line). */
  logoTagline: 'Your house away from home',
  /** Public hero headline and primary marketing title. */
  taglineTitleCase: 'Hotel Etuna',
  /** Oshiwambo etymology — about page and story copy only (not hero headline). */
  oshiwamboMeaning: 'He takes care of us',
  /** Email and Sofia footers — CI script tagline. */
  tagline: 'Your house away from home',
  meaning:
    'In Oshiwambo, Etuna means "He takes care of us" — protection, stewardship, and communal well-being.',
  leadLine: 'Hotel Etuna — your house away from home in Ongwediva.',
  secondaryLines: {
    placeAndTable: "Ongwediva's table — sleep, meet, dine at Hotel Etuna.",
    category: 'Premium guesthouse. Hotel service.',
  },
  address: '5544 Valley Street, Ongwediva, Namibia',
  phones: '+264 65 231 177 | +264 81 802 4833',
  /** Administration, legal, partner onboarding */
  email: 'admin@hoteletuna.com',
  emailAdmin: 'admin@hoteletuna.com',
  /** Reservations, check-in, stay queries, Sofia guest replies */
  emailFrontDesk: 'frontdesk@hoteletuna.com',
  /** Events, conferences, campaigns, referral partners */
  emailMarketing: 'marketing@hoteletuna.com',
  /** Website, guest portal, and technical support */
  emailSupport: 'support@hoteletuna.com',
  /** Security vulnerability reports (responsible disclosure) */
  emailSecurity: 'support@hoteletuna.com',
  /** Privacy and cookie policy inquiries */
  emailPrivacy: 'admin@hoteletuna.com',
  /** Executive / ownership inquiries */
  emailFounder: 'founder@hoteletuna.com',
  /** Staff + transactional footers: `lib/email/hotel-etuna-email-signature.ts` */
  proofPoints: {
    tradeFair: 'About 500 metres from the Ongwediva Trade Fair Centre',
    shuttle: 'Airport shuttle available — N$250 flat (on request)',
    checkIn: 'Check-in from 14:00 · Check-out by 11:00',
    loyalty: '100 loyalty points = N$50 folio credit (earn 1 point per N$10 settled)',
    roomService: 'Room service target: 30 minutes when checked in',
  },
  roomTiersFrom: 'From N$800 per night',
  /** Official CI palette — canonical hex from Hotel-Etuna-CI-Guide-Extract.pdf */
  colors: {
    rusticRed: '#790C19',
    cream: '#F3E8D7',
    secondary: {
      tan: '#DABC92',
      taupe: '#A58B72', // CI-corrected: guide page 3 swatch is #A58B72 (was mis-transcribed #B58B72)
      chocolate: '#4B3428',
      gold: '#D4AF37',
      crimson: '#BA082C',
    },
    accent: {
      ochre: '#9A7D43',
      gold: '#C6A46A',
      offWhite: '#FAF6F0',
      forest: '#5E6651',
      sage: '#9BAE8A',
      terracotta: '#6D3722',
      rose: '#C89B95',
    },
  },
  assets: {
    logoPrimary: '/brand/hotel-etuna-logo-primary.png',
    logoHorizontal: '/brand/hotel-etuna-logo-horizontal.png',
    logoHorizontalCompact: '/brand/hotel-etuna-logo-horizontal-compact.png',
    logoStacked: '/brand/hotel-etuna-logo-stacked.png',
    logoStackedCompact: '/brand/hotel-etuna-logo-stacked-compact.png',
    logoWordmark: '/brand/hotel-etuna-wordmark.png',
    logoMark: '/brand/hotel-etuna-mark.png',
  },
  voice: {
    use: [
      'cared-for',
      'refined',
      'memorable dining',
      'confidently hosted',
      'northern Namibian table',
      'event-ready',
    ],
    avoid: [
      'only luxury in the north',
      'free forever',
      'hospitality management platform',
      'enterprise-grade platform',
      'no credit card required',
      'setup in 5 minutes',
    ],
  },
} as const;

export const forbiddenGuestPhrases = brand.voice.avoid;
