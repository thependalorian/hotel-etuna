/**
 * NamQR v5.0 NRTC payee-presented payload (BoN tag 17 — Nedbank / NamClear).
 * Location: lib/compliance/namqr/nrtc-payload.ts
 */

import { NAMQR_STANDARDS } from '@/lib/compliance/namqr/standards';
import { HOTEL_ETUNA_SETTLEMENT } from '@/lib/platform/settlement-accounts';
import { buildNamQrTlv, calculateNamQrCrc } from '@/lib/services/qr/namqr-core';

export type NamQrPayeePresentedInput = {
  /** Static (11) vs dynamic (12) per §4.10 */
  dynamic: boolean;
  merchantName: string;
  merchantCity: string;
  merchantCategoryCode: string;
  /** ISO 4217 numeric; default NAD 516 */
  transactionCurrency?: string;
  /** Omit for static open amount */
  amount?: number;
  /** 8-digit NREF (NamClear human-readable reference) */
  nref: string;
  /** Reverse domain — e.g. na.com.nedbank */
  globallyUniqueIdentifier?: string;
  payeePspId?: string;
  payeeIdentifier?: string;
  purposeLabel?: string;
  countryCode?: string;
};

export type NamQrValidationResult = {
  valid: boolean;
  errors: string[];
  tags: Record<string, string>;
  crcOk: boolean;
};

function buildPayeeAccountTag17(input: NamQrPayeePresentedInput): string {
  const gui =
    input.globallyUniqueIdentifier ??
    process.env.HOTEL_ETUNA_NAMQR_GUI ??
    'na.com.nedbank';
  const pspId = input.payeePspId ?? HOTEL_ETUNA_SETTLEMENT.branchCode;
  const payeeId =
    input.payeeIdentifier ?? HOTEL_ETUNA_SETTLEMENT.accountNumber;

  return (
    buildNamQrTlv('00', gui) +
    buildNamQrTlv('01', pspId) +
    buildNamQrTlv('02', payeeId)
  );
}

function buildAdditionalDataTag62(nref: string, purpose?: string): string {
  let inner = buildNamQrTlv('01', nref.slice(0, 25));
  if (purpose) {
    inner += buildNamQrTlv('08', purpose.slice(0, 25));
  }
  return inner;
}

/** Build EMVCo TLV payload with CRC tag 63 last (§4.10). */
export function buildNamQrPayeePresentedPayload(
  input: NamQrPayeePresentedInput
): string {
  if (!/^\d{8}$/.test(input.nref)) {
    throw new Error('NREF must be exactly 8 digits per NamQR conventions');
  }

  const poi = input.dynamic
    ? NAMQR_STANDARDS.pointOfInitiation.payeeDynamic
    : NAMQR_STANDARDS.pointOfInitiation.payeeStatic;

  let payload = '';
  payload += buildNamQrTlv('00', NAMQR_STANDARDS.payloadFormatIndicator);
  payload += buildNamQrTlv('01', poi);
  payload += buildNamQrTlv(
    NAMQR_STANDARDS.payeeAccountTagNrtc,
    buildPayeeAccountTag17(input)
  );
  payload += buildNamQrTlv('52', input.merchantCategoryCode.padStart(4, '0').slice(0, 4));
  payload += buildNamQrTlv(
    '53',
    input.transactionCurrency ?? NAMQR_STANDARDS.currencyNadIso4217
  );

  if (input.amount != null && input.amount > 0) {
    payload += buildNamQrTlv('54', input.amount.toFixed(2));
  }

  payload += buildNamQrTlv('58', input.countryCode ?? NAMQR_STANDARDS.countryNamibia);
  payload += buildNamQrTlv('59', input.merchantName.slice(0, 25));
  payload += buildNamQrTlv('60', input.merchantCity.slice(0, 15));
  payload += buildNamQrTlv(
    '62',
    buildAdditionalDataTag62(
      input.nref,
      input.purposeLabel ?? 'Hotel Etuna payment'
    )
  );

  const crc = calculateNamQrCrc(payload + NAMQR_STANDARDS.crcTag + '04');
  payload += buildNamQrTlv(NAMQR_STANDARDS.crcTag, crc);

  return payload;
}

/** Parse top-level TLV tags (does not recurse nested templates). */
export function parseNamQrTopLevelTags(payload: string): Record<string, string> {
  const tags: Record<string, string> = {};
  let position = 0;

  while (position + 4 <= payload.length) {
    const tag = payload.substring(position, position + 2);
    const length = Number.parseInt(payload.substring(position + 2, position + 4), 10);
    if (Number.isNaN(length) || length < 0 || position + 4 + length > payload.length) {
      break;
    }
    const value = payload.substring(position + 4, position + 4 + length);
    tags[tag] = value;
    position += 4 + length;
  }

  return tags;
}

/** Validate payload against NamQR v5.0 mandatory top-level tags. */
export function validateNamQrPayload(payload: string): NamQrValidationResult {
  const errors: string[] = [];
  const tags = parseNamQrTopLevelTags(payload);

  if (tags['00'] !== NAMQR_STANDARDS.payloadFormatIndicator) {
    errors.push(
      `Tag 00 must be "${NAMQR_STANDARDS.payloadFormatIndicator}" (NamQR v5.0), got "${tags['00'] ?? 'missing'}"`
    );
  }

  const poi = tags['01'];
  if (
    !poi ||
    !Object.values(NAMQR_STANDARDS.pointOfInitiation).includes(
      poi as (typeof NAMQR_STANDARDS.pointOfInitiation)[keyof typeof NAMQR_STANDARDS.pointOfInitiation]
    )
  ) {
    errors.push('Tag 01 point of initiation must be 11–14');
  }

  if (!tags['17'] && !tags['26'] && !tags['08']) {
    errors.push('At least one payee account template (08, 17, or 26) is required');
  }

  if (!tags['52']) errors.push('Tag 52 merchant category code is mandatory');
  if (tags['53'] !== NAMQR_STANDARDS.currencyNadIso4217) {
    errors.push(`Tag 53 must be NAD (${NAMQR_STANDARDS.currencyNadIso4217})`);
  }
  if (!tags['58']) errors.push('Tag 58 country code is mandatory');
  if (!tags['59']) errors.push('Tag 59 merchant name is mandatory');
  if (!tags['60']) errors.push('Tag 60 merchant city is mandatory');
  if (!tags['63']) errors.push('Tag 63 CRC is mandatory and must be last');

  let crcOk = false;
  if (tags['63']) {
    const crcTagIndex = payload.lastIndexOf(NAMQR_STANDARDS.crcTag);
    const withoutCrcValue =
      crcTagIndex >= 0 ? payload.substring(0, crcTagIndex) : payload;
    const expected = calculateNamQrCrc(
      withoutCrcValue + NAMQR_STANDARDS.crcTag + '04'
    );
    crcOk = expected === tags['63'];
    if (!crcOk) {
      errors.push(`CRC mismatch: expected ${expected}, got ${tags['63']}`);
    }
  }

  if (poi === NAMQR_STANDARDS.pointOfInitiation.payeeDynamic && !tags['54']) {
    errors.push('Dynamic payee-presented QR (12) requires tag 54 amount');
  }

  return {
    valid: errors.length === 0,
    errors,
    tags,
    crcOk,
  };
}

export function generateNref(): string {
  return String(Math.floor(10000000 + Math.random() * 90000000));
}

export function defaultHotelEtunaNamQrInput(
  overrides: Partial<NamQrPayeePresentedInput> = {}
): NamQrPayeePresentedInput {
  return {
    dynamic: false,
    merchantName: HOTEL_ETUNA_SETTLEMENT.legalName,
    merchantCity: 'Ongwediva',
    merchantCategoryCode: NAMQR_STANDARDS.mccHotel,
    nref: generateNref(),
    purposeLabel: 'Hotel Etuna — guest payment',
    ...overrides,
  };
}
