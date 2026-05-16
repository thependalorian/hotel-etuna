/**
 * Namibia hospitality bookkeeping domain (MBA / Libby terminology + COA).
 */

import { describe, expect, it } from 'vitest';
import {
  ACCOUNTING_SYNONYM_GROUPS,
  resolveAccountingSynonym,
} from '@/lib/domain/accounting/accounting-terminology';
import {
  cashAccountForPayment,
  getChartAccount,
  revenueAccountForChargeType,
} from '@/lib/domain/accounting/namibia-hospitality-coa';
import { computeHospitalityVatBreakdown } from '@/lib/platform/namibia-tax';

describe('accounting terminology', () => {
  it('resolves P&L synonyms to Income Statement', () => {
    expect(resolveAccountingSynonym('P&L')).toBe('Income Statement');
    expect(resolveAccountingSynonym('Profit and Loss Statement')).toBe('Income Statement');
  });

  it('has Namibia hospitality synonym groups', () => {
    expect(ACCOUNTING_SYNONYM_GROUPS.some((g) => g.includes('Net Income'))).toBe(true);
  });
});

describe('Namibia hospitality chart of accounts', () => {
  it('maps charge types to revenue accounts', () => {
    expect(revenueAccountForChargeType('room')).toBe('4000');
    expect(revenueAccountForChargeType('fnb')).toBe('4100');
  });

  it('maps Adumo card payments to clearing account', () => {
    expect(cashAccountForPayment('adumo_virtual')).toBe('1020');
    expect(cashAccountForPayment(null, 'cash')).toBe('1000');
  });

  it('includes VAT and platform payable accounts', () => {
    expect(getChartAccount('2100')?.name).toContain('VAT output');
    expect(getChartAccount('2300')?.type).toBe('liability');
  });
});

describe('revenue recognition with VAT (Libby accrual)', () => {
  it('splits inclusive room charge into ex-VAT revenue and VAT liability', () => {
    const profile = {
      legalName: 'Etuna Guesthouse And Tours CC',
      registrationLabel: 'Close Corporation',
      registrationNumber: 'CC/2011/3890',
      vatRegistered: true,
      vatRegistrationNumber: '05517026-015',
      incomeTaxReference: '05517026-011',
      standardVatRatePercent: 15,
      pricesVatInclusive: true,
    };
    const vat = computeHospitalityVatBreakdown(1150, profile);
    expect(vat.amountExVat).toBe(1000);
    expect(vat.vatAmount).toBe(150);
    // Journal pattern: Dr AR 1150, Cr Revenue 1000, Cr VAT output 150
    const debits = 1150;
    const credits = vat.amountExVat + vat.vatAmount;
    expect(debits).toBe(credits);
  });
});
