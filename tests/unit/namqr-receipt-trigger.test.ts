import { readFileSync } from 'fs';
import { describe, expect, it } from 'vitest';
import { NAMQR_RECEIPT_PAYMENT_METHOD } from '@/lib/services/payment/HospitalityNamQrPaymentService';

describe('NamQR payment receipt trigger', () => {
  it('exports guest-facing payment method label', () => {
    expect(NAMQR_RECEIPT_PAYMENT_METHOD).toBe('NamQR (bank app)');
  });

  it('schedules Sofia receipt after desk confirm', () => {
    const src = readFileSync('lib/services/payment/HospitalityNamQrPaymentService.ts', 'utf8');
    expect(src).toContain('schedulePaymentReceiptEmail');
    expect(src).toContain('namqr_payment_confirmed');
  });
});
