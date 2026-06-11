import { describe, expect, it } from 'vitest';
import {
  buildNamQrPayeePresentedPayload,
  generateNref,
  validateNamQrPayload,
} from '@/lib/compliance/namqr/nrtc-payload';
import {
  encodeNamQrPayloadV5,
  validateNamQrCrc,
  parseNamQrTlv,
  NAMQR_PAYLOAD_FORMAT_V5,
  NAMQR_POI_DYNAMIC,
} from '@/lib/services/qr/namqr-core';
describe('NamQR v5.0 (BoN May 2025)', () => {
  it('tag 00 is payload format 01, not version string 5.0', () => {
    const nref = generateNref();
    const payload = buildNamQrPayeePresentedPayload({
      dynamic: true,
      merchantName: 'Etuna Guesthouse',
      merchantCity: 'Ongwediva',
      merchantCategoryCode: '7011',
      amount: 150.5,
      nref,
    });
    const tags = Object.fromEntries(parseNamQrTlv(payload).map((f) => [f.tag, f.value]));
    expect(tags['00']).toBe('01');
    expect(tags['01']).toBe(NAMQR_POI_DYNAMIC);
    expect(tags['53']).toBe('516');
    expect(tags['58']).toBe('NA');
    expect(validateNamQrPayload(payload).valid).toBe(true);
    expect(validateNamQrCrc(payload)).toBe(true);
  });

  it('NRTC desk payload uses tag 17 payee account (Nedbank)', () => {
    const nref = '12345678';
    const payload = buildNamQrPayeePresentedPayload({
      dynamic: false,
      merchantName: 'Hotel Etuna',
      merchantCity: 'Ongwediva',
      merchantCategoryCode: '7011',
      nref,
      payeeIdentifier: '11000481744',
    });
    const tags = Object.fromEntries(parseNamQrTlv(payload).map((f) => [f.tag, f.value]));
    expect(tags['17']).toBeDefined();
    expect(tags['26']).toBeUndefined();
    expect(validateNamQrPayload(payload).valid).toBe(true);
  });

  it('hospitality builder rejects invalid NREF', () => {
    expect(() =>
      buildNamQrPayeePresentedPayload({
        dynamic: false,
        merchantName: 'Test',
        merchantCity: 'Windhoek',
        merchantCategoryCode: '7011',
        nref: '123',
      })
    ).toThrow(/NREF/);
  });

  it('deprecated tag-26 encoder throws and is never used for live issuance', () => {
    expect(() =>
      encodeNamQrPayloadV5({
        presentationMode: 'dynamic',
        payeeIdentifier: '11000481744@nedbank.na',
        merchantCategoryCode: '7011',
        merchantName: 'Hotel Etuna',
        merchantCity: 'Ongwediva',
        amount: 99.99,
        referenceLabel: '12345678',
      })
    ).toThrow(/deprecated/i);
  });

  it('canonical NRTC encoder is CRC-correct with tag 63 last', () => {
    const payload = buildNamQrPayeePresentedPayload({
      dynamic: true,
      merchantName: 'Hotel Etuna',
      merchantCity: 'Ongwediva',
      merchantCategoryCode: '7011',
      amount: 250,
      nref: '12345678',
      payeeIdentifier: '11000481744',
    });
    expect(payload.length).toBeLessThanOrEqual(512);
    expect(validateNamQrCrc(payload)).toBe(true);
    const fields = parseNamQrTlv(payload);
    expect(fields[fields.length - 1]?.tag).toBe('63');
    expect(fields.find((f) => f.tag === '00')?.value).toBe(NAMQR_PAYLOAD_FORMAT_V5);
  });
});
