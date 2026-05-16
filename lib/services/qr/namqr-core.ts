/**
 * NamQR v5.0 core — TLV encoding per Bank of Namibia NAMQR Code Standards (May 2025).
 * Location: lib/services/qr/namqr-core.ts
 *
 * Reference: mba-agent/documents/mba-agent/regulatory/namibia/namibia_qr_code_standards.md
 */

/** ISO 4217 numeric code for NAD */
export const NAMQR_CURRENCY_NAD = '516';

/** Payload format indicator for merchant-presented NAMQR (tag 00) */
export const NAMQR_PAYLOAD_FORMAT_V5 = '01';

/** Point of initiation — payee-presented static / dynamic (tag 01) */
export const NAMQR_POI_STATIC = '11';
export const NAMQR_POI_DYNAMIC = '12';

/** Hospitality MCC defaults */
export const MCC_HOTEL = '7011';
export const MCC_RESTAURANT = '5812';

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

function buildMerchantAccountInfo(input: NamQrEncodeInput): string {
  let inner = '';
  inner += buildNamQrTlv('00', input.globalUniqueId ?? 'com.buffr.hoteletuna');
  inner += buildNamQrTlv('01', input.payeeIdentifier);
  inner += buildNamQrTlv('02', input.payeeAccountType ?? 'bank');
  if (input.merchantId) {
    inner += buildNamQrTlv('03', input.merchantId);
  }
  return inner;
}

function buildAdditionalData(input: NamQrEncodeInput): string {
  let inner = '';
  inner += buildNamQrTlv('01', input.referenceLabel.slice(0, 25));
  inner += buildNamQrTlv('05', input.referenceLabel.slice(0, 25));
  if (input.purpose) {
    inner += buildNamQrTlv('08', input.purpose.slice(0, 50));
  }
  return inner;
}

/**
 * Build full payee-presented NAMQR payload string (includes tag 63 CRC).
 */
export function encodeNamQrPayloadV5(input: NamQrEncodeInput): string {
  let payload = '';

  payload += buildNamQrTlv(NamQrTag.PAYLOAD_FORMAT, NAMQR_PAYLOAD_FORMAT_V5);
  payload += buildNamQrTlv(
    NamQrTag.POINT_OF_INITIATION,
    input.presentationMode === 'static' ? NAMQR_POI_STATIC : NAMQR_POI_DYNAMIC
  );

  payload += buildNamQrTlv(NamQrTag.MERCHANT_ACCOUNT_INFO, buildMerchantAccountInfo(input));
  payload += buildNamQrTlv(NamQrTag.MERCHANT_CATEGORY, input.merchantCategoryCode);
  payload += buildNamQrTlv(NamQrTag.TRANSACTION_CURRENCY, NAMQR_CURRENCY_NAD);

  if (input.amount != null && input.amount > 0) {
    payload += buildNamQrTlv(NamQrTag.TRANSACTION_AMOUNT, input.amount.toFixed(2));
  }

  payload += buildNamQrTlv(NamQrTag.COUNTRY, input.countryCode ?? 'NA');
  payload += buildNamQrTlv(NamQrTag.MERCHANT_NAME, input.merchantName.slice(0, 25));
  payload += buildNamQrTlv(NamQrTag.MERCHANT_CITY, input.merchantCity.slice(0, 15));

  if (input.postalCode) {
    payload += buildNamQrTlv(NamQrTag.POSTAL_CODE, input.postalCode.slice(0, 10));
  }

  payload += buildNamQrTlv(NamQrTag.ADDITIONAL_DATA, buildAdditionalData(input));

  if (input.tokenVaultId) {
    payload += buildNamQrTlv(NamQrTag.TOKEN_VAULT, input.tokenVaultId);
  }
  if (input.discountPercent != null) {
    payload += buildNamQrTlv(NamQrTag.DISCOUNT, input.discountPercent.toFixed(2));
  }
  if (input.cashbackPercent != null) {
    payload += buildNamQrTlv(NamQrTag.CASHBACK, input.cashbackPercent.toFixed(2));
  }

  const crc = calculateNamQrCrc(payload + NamQrTag.CRC + '04');
  payload += buildNamQrTlv(NamQrTag.CRC, crc);

  if (payload.length > 512) {
    throw new Error('NamQR payload exceeds 512 character limit (BoN v5.0)');
  }

  return payload;
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
