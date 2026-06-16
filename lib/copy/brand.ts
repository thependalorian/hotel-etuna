/**
 * Brand copy spine — single source for tagline, voice, and forbidden phrases.
 * Location: lib/copy/brand.ts
 * Source: docs/REBRAND_QUESTIONNAIRE_AND_LANDSCAPE.md
 */

/** Registered legal entity (Namibia CC) — align with HOTEL_ETUNA_LEGAL_NAME env on server. */
export const HOTEL_ETUNA_LEGAL_NAME = 'Etuna Guesthouse And Tours CC';

export const brand = {
  name: 'Hotel Etuna',
  legalName: HOTEL_ETUNA_LEGAL_NAME,
  /** Script tagline on the official logo lockup (English marketing line). */
  logoTagline: 'Your house away from home',
  /** Oshiwambo meaning — use in copy, footers, and brand voice (not on the logo image). */
  tagline: 'He takes care of us',
  taglineTitleCase: 'He Takes Care of Us',
  meaning:
    'In Oshiwambo, Etuna means "He takes care of us" — protection, stewardship, and communal well-being.',
  leadLine:
    'Hotel Etuna — where "He takes care of us" is how we host you.',
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
  /** Official logo palette (burgundy square mark + cream monogram). */
  colors: {
    burgundy: '#7b161e',
    cream: '#f1e6d2',
  },
  assets: {
    logoLockup: '/brand/hotel-etuna-logo.png',
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
