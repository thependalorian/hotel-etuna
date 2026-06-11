/**
 * Namibia document tax helpers — VAT + NTB levy.
 * Location: tests/unit/namibia-document-tax.test.ts
 */

import { describe, it, expect } from 'vitest';
import {
  calculateAccommodationTax,
  calculateFnbTax,
  sumDocumentLineTaxes,
  getHotelEtunaPropertyTaxProfile,
} from '@/lib/platform/namibia-tax';

describe('namibia document tax', () => {
  const profile = {
    ...getHotelEtunaPropertyTaxProfile(),
    vatRegistered: true,
    pricesVatInclusive: true,
    standardVatRatePercent: 15,
  };

  it('splits inclusive room charge into VAT and NTB levy', () => {
    const tax = calculateAccommodationTax(1150, profile);
    expect(tax.taxableBase).toBeGreaterThan(0);
    expect(tax.vat15).toBeGreaterThan(0);
    expect(tax.ntbLevy2).toBeGreaterThan(0);
    expect(tax.totalInclusive).toBeCloseTo(tax.taxableBase + tax.vat15 + tax.ntbLevy2, 2);
  });

  it('applies VAT only on F&B lines', () => {
    const fnb = calculateFnbTax(230, profile);
    expect(fnb.vat15).toBeGreaterThan(0);
    expect(fnb.total).toBeCloseTo(230, 2);
  });

  it('sums mixed folio lines with NTB on room only', () => {
    const total = sumDocumentLineTaxes(
      [
        { chargeType: 'room', amount: 1000 },
        { chargeType: 'fnb', amount: 200 },
      ],
      profile
    );
    expect(total.ntbLevy2).toBeGreaterThan(0);
    expect(total.vat15).toBeGreaterThan(0);
  });
});
