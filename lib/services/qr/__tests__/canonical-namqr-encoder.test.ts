/**
 * Canonical NamQR encoder contract test.
 *
 * Asserts that the SINGLE canonical payee-presented encoder
 * (`buildNamQrPayeePresentedPayload`, BoN tag-17 NRTC template — the format
 * every live desk / guest-folio QR path issues) produces a CRC-correct,
 * spec-shaped payload and that the divergent tag-26 encoder is hard-disabled.
 *
 * Live trace: HospitalityNamQrPaymentService.generateDeskQr
 *   -> NamQRService.generateQR (paymentStream NRTC/EnCR/IPP)
 *   -> buildNrtcPayload -> buildNamQrPayeePresentedPayload (this encoder).
 *
 * Location: lib/services/qr/__tests__/canonical-namqr-encoder.test.ts
 */

import { describe, it, expect } from 'vitest';
import {
  buildNamQrPayeePresentedPayload,
  validateNamQrPayload,
  parseNamQrTopLevelTags,
} from '@/lib/compliance/namqr/nrtc-payload';
import {
  validateNamQrCrc,
  parseNamQrTlv,
  calculateNamQrCrc,
  encodeNamQrPayloadV5,
} from '@/lib/services/qr/namqr-core';

/** Reference CRC-16 CCITT (poly 0x1021, init 0xFFFF) — independent of the helper under test. */
function referenceCrc16Ccitt(input: string): string {
  let crc = 0xffff;
  for (const byte of Buffer.from(input, 'utf8')) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

describe('Canonical NamQR encoder (tag-17 NRTC, single source of truth)', () => {
  it('produces a CRC-correct, spec-shaped dynamic payload', () => {
    const payload = buildNamQrPayeePresentedPayload({
      dynamic: true,
      merchantName: 'Hotel Etuna',
      merchantCity: 'Ongwediva',
      merchantCategoryCode: '7011',
      amount: 1234.5,
      nref: '12345678',
      payeeIdentifier: '11000481744',
    });

    const fields = parseNamQrTlv(payload);
    const tags = Object.fromEntries(fields.map((f) => [f.tag, f.value]));

    // Tag 63 (CRC) MUST be the last data object on the wire.
    expect(fields[fields.length - 1]?.tag).toBe('63');

    // Mandatory spec shape.
    expect(tags['00']).toBe('01'); // payload format indicator
    expect(tags['01']).toBe('12'); // dynamic point-of-initiation
    expect(tags['17']).toBeDefined(); // tag-17 NRTC payee account template (canonical)
    expect(tags['26']).toBeUndefined(); // NOT the divergent tag-26 template
    expect(tags['52']).toBe('7011'); // MCC
    expect(tags['53']).toBe('516'); // NAD ISO 4217 numeric
    expect(tags['58']).toBe('NA'); // country
    expect(tags['54']).toBe('1234.50'); // amount toFixed(2)

    // CRC-16 CCITT (poly 0x1021, init 0xFFFF) over everything up to & incl. "6304".
    const withoutCrc = payload.slice(0, payload.length - 8); // strip "63" + "04" + 4 hex
    const expectedCrc = referenceCrc16Ccitt(withoutCrc + '6304');
    expect(tags['63']).toBe(expectedCrc);
    expect(calculateNamQrCrc(withoutCrc + '6304')).toBe(expectedCrc);

    // Round-trips through both validators.
    expect(validateNamQrCrc(payload)).toBe(true);
    const validation = validateNamQrPayload(payload);
    expect(validation.valid).toBe(true);
    expect(validation.crcOk).toBe(true);
    expect(parseNamQrTopLevelTags(payload)['17']).toBeDefined();
  });

  it('formats whole-NAD amounts with two decimal places', () => {
    const payload = buildNamQrPayeePresentedPayload({
      dynamic: true,
      merchantName: 'Hotel Etuna',
      merchantCity: 'Ongwediva',
      merchantCategoryCode: '7011',
      amount: 500,
      nref: '87654321',
    });
    const tags = Object.fromEntries(parseNamQrTlv(payload).map((f) => [f.tag, f.value]));
    expect(tags['54']).toBe('500.00');
    expect(validateNamQrCrc(payload)).toBe(true);
  });

  it('static (open-amount) payload omits tag 54 and still validates', () => {
    const payload = buildNamQrPayeePresentedPayload({
      dynamic: false,
      merchantName: 'Hotel Etuna',
      merchantCity: 'Ongwediva',
      merchantCategoryCode: '7011',
      nref: '11112222',
      payeeIdentifier: '11000481744',
    });
    const tags = Object.fromEntries(parseNamQrTlv(payload).map((f) => [f.tag, f.value]));
    expect(tags['01']).toBe('11'); // static POI
    expect(tags['54']).toBeUndefined();
    expect(validateNamQrPayload(payload).valid).toBe(true);
  });

  it('a single tampered character fails CRC validation', () => {
    const payload = buildNamQrPayeePresentedPayload({
      dynamic: true,
      merchantName: 'Hotel Etuna',
      merchantCity: 'Ongwediva',
      merchantCategoryCode: '7011',
      amount: 100,
      nref: '99998888',
    });
    const tampered = `${payload.slice(0, payload.length - 8)}6304FFFF`;
    expect(validateNamQrCrc(tampered)).toBe(false);
  });

  it('the divergent tag-26 encoder is hard-disabled for live issuance', () => {
    expect(() =>
      encodeNamQrPayloadV5({
        presentationMode: 'dynamic',
        merchantName: 'Hotel Etuna',
        merchantCity: 'Ongwediva',
        merchantCategoryCode: '7011',
        amount: 100,
        referenceLabel: '12345678',
        payeeIdentifier: '11000481744',
      })
    ).toThrow(/deprecated/i);
  });
});
