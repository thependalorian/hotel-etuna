/**
 * NamQR v5.0 core — TLV encoding per Bank of Namibia NAMQR Code Standards (May 2025).
 * Location: lib/services/qr/namqr-core.ts
 *
 * Reference: mba-agent/documents/mba-agent/regulatory/namibia/namibia_qr_code_standards.md
 */

import {
  NAMQR_CURRENCY_NAD,
  NAMQR_PAYLOAD_FORMAT,
  NAMQR_POI_DYNAMIC,
  NAMQR_POI_STATIC,
  NAMQR_STANDARDS,
} from '@/lib/compliance/namqr/standards';

export { NAMQR_CURRENCY_NAD, NAMQR_POI_STATIC, NAMQR_POI_DYNAMIC };

/** Payload format indicator for merchant-presented NAMQR (tag 00) */
export const NAMQR_PAYLOAD_FORMAT_V5 = NAMQR_PAYLOAD_FORMAT;

/** Hospitality MCC defaults — canonical values live in lib/compliance/namqr/standards.ts */
export const MCC_HOTEL = NAMQR_STANDARDS.mccHotel;
export const MCC_RESTAURANT = NAMQR_STANDARDS.mccRestaurant;

export const NamQrTag = {
  PAYLOAD_FORMAT: '00',
  POINT_OF_INITIATION: '01',
  MERCHANT_ACCOUNT_INFO: '26',
  MERCHANT_CATEGORY: '52',
  TRANSACTION_CURRENCY: '53',
  TRANSACTION_AMOUNT: '54',
  COUNTRY: '58',
  MERCHANT_NAME: '59',
  MERCHANT_CITY: '60',
  POSTAL_CODE: '61',
  ADDITIONAL_DATA: '62',
  CRC: '63',
  TOKEN_VAULT: '65',
  DISCOUNT: '66',
  CASHBACK: '67',
} as const;

export type NamQrPresentationMode = 'static' | 'dynamic';

export type NamQrEncodeInput = {
  presentationMode: NamQrPresentationMode;
  merchantName: string;
  merchantCity: string;
  merchantCategoryCode: string;
  countryCode?: string;
  amount?: number;
  /** NREF or booking reference — stored in tag 62 sub-tag 01 */
  referenceLabel: string;
  payeeIdentifier: string;
  payeeAccountType?: 'bank' | 'ewallet' | 'card';
  merchantId?: string;
  globalUniqueId?: string;
  tokenVaultId?: string;
  purpose?: string;
  discountPercent?: number;
  cashbackPercent?: number;
  postalCode?: string;
};

export function buildNamQrTlv(tag: string, value: string): string {
  if (!/^\d{2}$/.test(tag)) {
    throw new Error(`Invalid NamQR tag: ${tag}`);
  }
  if (value.length > 99) {
    throw new Error(`NamQR value exceeds max length 99 for tag ${tag}`);
  }
  const length = value.length.toString().padStart(2, '0');
  return `${tag}${length}${value}`;
}

/** CRC-16/CCITT-FALSE per EMVCo / NamQR tag 63 */
export function calculateNamQrCrc(payloadWithoutCrc: string): string {
  let crc = 0xffff;
  const bytes = Buffer.from(payloadWithoutCrc, 'utf8');

  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i] << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
    }
  }

  crc &= 0xffff;
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * @deprecated DO NOT USE FOR LIVE QR ISSUANCE.
 *
 * This tag-26 (merchant-account-information template) encoder is NOT the
 * NamClear-registered on-the-wire format for Hotel Etuna. The single canonical
 * payee-presented encoder is `buildNamQrPayeePresentedPayload` in
 * `lib/compliance/namqr/nrtc-payload.ts`, which emits the tag-17 NRTC payee
 * account template that every live desk / guest-folio QR path uses
 * (HospitalityNamQrPaymentService → NamQRService.generateQR → buildNrtcPayload).
 *
 * Calling this function throws to prevent a second divergent payload from ever
 * being issued. It is retained only so historical references/tests resolve;
 * the shared TLV/CRC helpers in this module (buildNamQrTlv, calculateNamQrCrc,
 * parseNamQrTlv, validateNamQrCrc) remain the live, reused implementations.
 */
export function encodeNamQrPayloadV5(_input: NamQrEncodeInput): string {
  throw new Error(
    'encodeNamQrPayloadV5 (tag-26 template) is deprecated and must not be used for live NamQR issuance. ' +
      'Use buildNamQrPayeePresentedPayload (tag-17 NRTC) from lib/compliance/namqr/nrtc-payload.ts.'
  );
}

export type ParsedNamQrField = { tag: string; value: string };

/** Parse top-level TLV chain (does not recurse nested templates). */
export function parseNamQrTlv(payload: string): ParsedNamQrField[] {
  const fields: ParsedNamQrField[] = [];
  let position = 0;

  while (position + 4 <= payload.length) {
    const tag = payload.substring(position, position + 2);
    const length = parseInt(payload.substring(position + 2, position + 4), 10);
    if (Number.isNaN(length) || length < 0) break;
    const value = payload.substring(position + 4, position + 4 + length);
    fields.push({ tag, value });
    position += 4 + length;
  }

  return fields;
}

export function validateNamQrCrc(payload: string): boolean {
  const fields = parseNamQrTlv(payload);
  const crcField = fields.find((f) => f.tag === NamQrTag.CRC);
  if (!crcField) return false;

  const withoutCrc = payload.slice(0, payload.length - (4 + crcField.value.length));
  const expected = calculateNamQrCrc(withoutCrc + NamQrTag.CRC + '04');
  return crcField.value.toUpperCase() === expected;
}

export function extractNamQrReference(payload: string): string | undefined {
  const additional = parseNamQrTlv(payload).find((f) => f.tag === NamQrTag.ADDITIONAL_DATA);
  if (!additional) return undefined;
  const sub = parseNamQrTlv(additional.value).find((f) => f.tag === '01');
  return sub?.value;
}
