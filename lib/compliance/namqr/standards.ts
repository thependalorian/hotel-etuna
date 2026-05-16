/**
 * NamQR regulatory reference — Bank of Namibia NAMQR Code Standards v5.0 (May 2025).
 * Location: lib/compliance/namqr/standards.ts
 *
 * Canonical source document (compliance pack):
 * mba-agent/documents/mba-agent/regulatory/namibia/namibia_qr_code_standards.md
 */

export const NAMQR_STANDARD_VERSION = '5.0' as const;
export const NAMQR_STANDARD_DATE = '2025-05-09' as const;

/** Relative path from monorepo root for auditors */
export const NAMQR_REGULATORY_DOC_PATH =
  'mba-agent/documents/mba-agent/regulatory/namibia/namibia_qr_code_standards.md';

/** ISO 4217 numeric code for NAD (BoN Table 1) */
export const NAMQR_CURRENCY_NAD = '516' as const;

/** ISO 3166-1 alpha-2 country code for Namibia */
export const NAMQR_COUNTRY_NA = 'NA' as const;

/** Lodging / hotels MCC (hospitality payee-presented QR) */
export const NAMQR_MCC_LODGING = '7011' as const;

/** EMVCo payload format indicator */
export const NAMQR_PAYLOAD_FORMAT = '01' as const;

/** Point of initiation: static (amount entered by payer) */
export const NAMQR_POI_STATIC = '11' as const;

/** Point of initiation: dynamic (amount embedded in QR) */
export const NAMQR_POI_DYNAMIC = '12' as const;

/** Consolidated constants for builders and validators */
export const NAMQR_STANDARDS = {
  version: NAMQR_STANDARD_VERSION,
  lastUpdated: NAMQR_STANDARD_DATE,
  regulatoryDocPath: NAMQR_REGULATORY_DOC_PATH,
  payloadFormatIndicator: NAMQR_PAYLOAD_FORMAT,
  pointOfInitiation: {
    payeeStatic: NAMQR_POI_STATIC,
    payeeDynamic: NAMQR_POI_DYNAMIC,
    payerStatic: '13',
    payerDynamic: '14',
  },
  currencyNadIso4217: NAMQR_CURRENCY_NAD,
  countryNamibia: NAMQR_COUNTRY_NA,
  crcTag: '63',
  /** Tag 17 — payee presented, existing Namibia payment system (NRTC / Nedbank) */
  payeeAccountTagNrtc: '17',
  /** Tag 26 — IPP full-form alias (future) */
  payeeAccountTagIpp: '26',
  mccHotel: NAMQR_MCC_LODGING,
  mccRestaurant: '5812',
} as const;
