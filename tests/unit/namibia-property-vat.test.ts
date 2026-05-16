/**
 * Property hospitality VAT calculations (Hotel Etuna — not Buffr platform fees).
 */

import { describe, expect, it } from 'vitest';
import {
  computeHospitalityVatBreakdown,
  computeVatOnTaxableSupply,
  NAMIBIA_STANDARD_VAT_RATE_PERCENT,
  type TaxProfile,
} from '@/lib/platform/namibia-tax';
import { buildFolioVatSummary } from '@/lib/services/tax/PropertyVatService';
import type { FolioLineItem } from '@/lib/types/folio';

const registeredInclusive: TaxProfile = {
  legalName: 'Hotel Etuna CC',
  registrationLabel: 'Close Corporation',
  registrationNumber: null,
  vatRegistered: true,
  vatRegistrationNumber: 'VAT-TEST',
  incomeTaxReference: null,
  standardVatRatePercent: NAMIBIA_STANDARD_VAT_RATE_PERCENT,
  pricesVatInclusive: true,
};

describe('computeHospitalityVatBreakdown', () => {
  it('extracts 15% VAT from inclusive NAD 1150', () => {
    const vat = computeHospitalityVatBreakdown(1150, registeredInclusive);
    expect(vat.amountExVat).toBe(1000);
    expect(vat.vatAmount).toBe(150);
    expect(vat.totalInclVat).toBe(1150);
    expect(vat.pricingMode).toBe('inclusive');
  });

  it('returns zero VAT when not registered', () => {
    const vat = computeHospitalityVatBreakdown(500, {
      ...registeredInclusive,
      vatRegistered: false,
    });
    expect(vat.vatAmount).toBe(0);
    expect(vat.amountExVat).toBe(500);
  });
});

describe('computeVatOnTaxableSupply (Buffr B2B exclusive)', () => {
  it('adds 15% on exclusive amount', () => {
    const result = computeVatOnTaxableSupply(1000, registeredInclusive);
    expect(result.vatAmount).toBe(150);
    expect(result.totalInclVat).toBe(1150);
  });
});

describe('buildFolioVatSummary', () => {
  it('sums open room and fnb lines only', () => {
    const lines: FolioLineItem[] = [
      {
        id: '1',
        chargeType: 'room',
        description: 'Room',
        amount: 1000,
        currency: 'NAD',
        status: 'open',
        referenceId: null,
        createdAt: null,
        settledAt: null,
      },
      {
        id: '2',
        chargeType: 'fnb',
        description: 'Breakfast',
        amount: 150,
        currency: 'NAD',
        status: 'open',
        referenceId: null,
        createdAt: null,
        settledAt: null,
      },
      {
        id: '3',
        chargeType: 'payment',
        description: 'Payment',
        amount: -200,
        currency: 'NAD',
        status: 'settled',
        referenceId: null,
        createdAt: null,
        settledAt: null,
      },
    ];

    const summary = buildFolioVatSummary(lines, 'NAD', registeredInclusive);
    expect(summary).not.toBeNull();
    expect(summary!.taxableGross).toBe(1150);
    expect(summary!.vatAmount).toBe(150);
  });
});
