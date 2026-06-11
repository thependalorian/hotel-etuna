/**
 * Namibia payroll statutory calculations — PAYE FY2025/26 and SSC cap.
 */

import { describe, expect, it } from 'vitest';
import {
  computeAnnualPaye,
  computeMonthlyPaye,
  computeSsc,
  NAMIBIA_PAYROLL_EMPLOYER_REF,
  PAYE_BRACKETS_FY2025_26,
  SSC_EMPLOYEE_RATE,
  SSC_MONTHLY_WAGE_CAP_NAD,
} from '@/lib/platform/namibia-payroll';
import { HOTEL_ETUNA_DOCUMENTED_EMPLOYEE_TAX_REFERENCE } from '@/lib/platform/namibia-tax';

describe('PAYE_BRACKETS_FY2025_26', () => {
  it('defines seven progressive brackets ending at 37%', () => {
    expect(PAYE_BRACKETS_FY2025_26).toHaveLength(7);
    expect(PAYE_BRACKETS_FY2025_26[0].marginalRate).toBe(0);
    expect(PAYE_BRACKETS_FY2025_26[6].marginalRate).toBe(0.37);
    expect(PAYE_BRACKETS_FY2025_26[6].baseTax).toBe(429_000);
  });
});

describe('computeAnnualPaye', () => {
  it('returns zero at and below N$100,000 annual taxable', () => {
    expect(computeAnnualPaye(0)).toBe(0);
    expect(computeAnnualPaye(50_000)).toBe(0);
    expect(computeAnnualPaye(100_000)).toBe(0);
  });

  it('applies 18% on first bracket excess at N$100,001', () => {
    expect(computeAnnualPaye(100_001)).toBe(0.18);
    expect(computeAnnualPaye(120_000)).toBe(3_600);
  });

  it('applies N$9,000 + 25% in second marginal bracket', () => {
    expect(computeAnnualPaye(150_000)).toBe(9_000);
    expect(computeAnnualPaye(200_000)).toBe(21_500);
  });

  it('applies top bracket N$429,000 + 37% above N$1,550,000', () => {
    expect(computeAnnualPaye(1_550_000)).toBe(429_000);
    expect(computeAnnualPaye(1_600_000)).toBe(447_500);
  });
});

describe('computeMonthlyPaye', () => {
  it('divides annual PAYE by twelve', () => {
    expect(computeMonthlyPaye(120_000)).toBe(300);
    expect(computeMonthlyPaye(100_000)).toBe(0);
  });

  it('handles high earners monthly withholding', () => {
    const monthly = computeMonthlyPaye(1_600_000);
    expect(monthly).toBeCloseTo(447_500 / 12, 2);
  });
});

describe('computeSsc', () => {
  it('charges 0.9% employee and employer below cap', () => {
    const ssc = computeSsc(5_000);
    expect(ssc.assessableWage).toBe(5_000);
    expect(ssc.employeeContribution).toBe(45);
    expect(ssc.employerContribution).toBe(45);
    expect(ssc.totalContribution).toBe(90);
  });

  it('caps assessable wage at N$11,000', () => {
    const atCap = computeSsc(SSC_MONTHLY_WAGE_CAP_NAD);
    expect(atCap.assessableWage).toBe(11_000);
    expect(atCap.employeeContribution).toBe(99);
    expect(atCap.employerContribution).toBe(99);
  });

  it('does not increase SSC above cap for higher basic wage', () => {
    const aboveCap = computeSsc(25_000);
    const atCap = computeSsc(SSC_MONTHLY_WAGE_CAP_NAD);
    expect(aboveCap.assessableWage).toBe(SSC_MONTHLY_WAGE_CAP_NAD);
    expect(aboveCap.employeeContribution).toBe(atCap.employeeContribution);
    expect(aboveCap.employerContribution).toBe(atCap.employerContribution);
    expect(aboveCap.employeeContribution).toBe(
      Math.round(SSC_MONTHLY_WAGE_CAP_NAD * SSC_EMPLOYEE_RATE * 100) / 100
    );
  });

  it('returns zeros for non-positive wage', () => {
    const ssc = computeSsc(0);
    expect(ssc.employeeContribution).toBe(0);
    expect(ssc.employerContribution).toBe(0);
  });

  it('uses 0.9% rate constant', () => {
    expect(SSC_EMPLOYEE_RATE).toBe(0.009);
  });
});

describe('NAMIBIA_PAYROLL_EMPLOYER_REF', () => {
  it('matches Hotel Etuna NamRA employee tax reference', () => {
    expect(NAMIBIA_PAYROLL_EMPLOYER_REF).toBe(HOTEL_ETUNA_DOCUMENTED_EMPLOYEE_TAX_REFERENCE);
    expect(NAMIBIA_PAYROLL_EMPLOYER_REF).toBe('05517026-014');
  });
});
