/**
 * NamQR amount re-check on confirm — guards the highest-risk money path.
 *
 * A dynamic (payee-presented) NamQR encodes a fixed amount; staff confirming a settlement
 * must not be able to close a folio for a different value, nor settle against an
 * expired/deactivated code (BoN NamQR v5.0). Exercises the pure decision used by
 * HospitalityNamQrPaymentService.confirmDeskPayment.
 *
 * Location: tests/unit/namqr-settlement-recheck.test.ts
 */

import { describe, it, expect } from 'vitest';
import { checkNamQrSettlement } from '@/lib/services/payment/HospitalityNamQrPaymentService';

const NOW = new Date('2026-06-09T12:00:00Z').getTime();

describe('checkNamQrSettlement', () => {
  it('allows a dynamic QR settled for its exact encoded amount', () => {
    const err = checkNamQrSettlement(
      { amount: '1500.00', qrType: 'dynamic', isActive: true, expiresAt: null },
      1500,
      NOW,
    );
    expect(err).toBeNull();
  });

  it('allows a 1-cent rounding tolerance', () => {
    const err = checkNamQrSettlement(
      { amount: '3250.50', qrType: 'dynamic', isActive: true, expiresAt: null },
      3250.5,
      NOW,
    );
    expect(err).toBeNull();
  });

  it('rejects a dynamic QR settled for a different amount (under-payment)', () => {
    const err = checkNamQrSettlement(
      { amount: '1500.00', qrType: 'dynamic', isActive: true, expiresAt: null },
      500,
      NOW,
    );
    expect(err).toMatch(/does not match the QR amount/);
  });

  it('rejects a dynamic QR settled for a higher amount (over-payment)', () => {
    const err = checkNamQrSettlement(
      { amount: '1500.00', qrType: 'dynamic', isActive: true, expiresAt: null },
      2000,
      NOW,
    );
    expect(err).toMatch(/does not match the QR amount/);
  });

  it('rejects an expired dynamic QR', () => {
    const err = checkNamQrSettlement(
      {
        amount: '1500.00',
        qrType: 'dynamic',
        isActive: true,
        expiresAt: new Date(NOW - 60_000),
      },
      1500,
      NOW,
    );
    expect(err).toMatch(/expired/);
  });

  it('rejects a deactivated QR', () => {
    const err = checkNamQrSettlement(
      { amount: '1500.00', qrType: 'dynamic', isActive: false, expiresAt: null },
      1500,
      NOW,
    );
    expect(err).toMatch(/deactivated/);
  });

  it('allows a static QR (ask-on-scan, no encoded amount) for any amount', () => {
    const err = checkNamQrSettlement(
      { amount: null, qrType: 'static', isActive: true, expiresAt: null },
      4321,
      NOW,
    );
    expect(err).toBeNull();
  });

  it('does not enforce amount when a dynamic QR has no stored amount', () => {
    const err = checkNamQrSettlement(
      { amount: null, qrType: 'dynamic', isActive: true, expiresAt: null },
      999,
      NOW,
    );
    expect(err).toBeNull();
  });
});
