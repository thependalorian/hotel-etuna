/**
 * Namibia hospitality chart of accounts and VAT split for journal posting.
 */

import { describe, expect, it } from 'vitest';
import {
  cashAccountForPayment,
  revenueAccountForChargeType,
  getChartAccount,
} from '@/lib/domain/accounting/namibia-hospitality-coa';
import { computeHospitalityVatBreakdown } from '@/lib/platform/namibia-tax';
import type { TaxProfile } from '@/lib/platform/namibia-tax';
import { NAMIBIA_STANDARD_VAT_RATE_PERCENT } from '@/lib/platform/namibia-tax';

const etunaRegistered: TaxProfile = {
  legalName: 'Etuna Guesthouse And Tours CC',
  registrationLabel: 'Close Corporation',
  registrationNumber: 'CC/2011/3890',
  vatRegistered: true,
  vatRegistrationNumber: '05517026-015',
  incomeTaxReference: '05517026-011',
  standardVatRatePercent: NAMIBIA_STANDARD_VAT_RATE_PERCENT,
  pricesVatInclusive: true,
};

describe('namibia-hospitality-coa', () => {
  it('maps charge types to revenue accounts', () => {
    expect(revenueAccountForChargeType('room')).toBe('4000');
    expect(revenueAccountForChargeType('fnb')).toBe('4100');
    expect(revenueAccountForChargeType('adjustment')).toBe('4200');
  });

  it('routes card payments to card clearing', () => {
    expect(cashAccountForPayment('adumo')).toBe('1020');
    expect(cashAccountForPayment(null, 'cash')).toBe('1000');
  });

  it('includes NamRA VAT output account', () => {
    expect(getChartAccount('2100')?.name).toContain('VAT output');
  });
});

describe('journal VAT split (Libby accrual)', () => {
  it('splits inclusive NAD 1150 into revenue and VAT for room stay', () => {
    const vat = computeHospitalityVatBreakdown(1150, etunaRegistered);
    expect(vat.amountExVat).toBe(1000);
    expect(vat.vatAmount).toBe(150);
    expect(vat.totalInclVat).toBe(1150);
  });
});
