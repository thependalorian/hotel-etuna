/**
 * Namibia payroll statutory calculations — PAYE FY2025/26 and Social Security (SSC).
 * Location: lib/platform/namibia-payroll.ts
 *
 * Sources: NamRA income tax tables (years ending 2018/19+); PwC Tax Summaries FY2025/26;
 * SSC 0.9% employee + 0.9% employer on monthly basic wage capped at N$11,000.
 * Not tax advice — confirm with counsel before production filings.
 */

import { HOTEL_ETUNA_DOCUMENTED_EMPLOYEE_TAX_REFERENCE } from '@/lib/platform/namibia-tax';
import { roundMoney } from '@/lib/utils/money';

/** NamRA employee tax (PAYE) employer reference for Hotel Etuna. */
export const NAMIBIA_PAYROLL_EMPLOYER_REF = HOTEL_ETUNA_DOCUMENTED_EMPLOYEE_TAX_REFERENCE;

/** FY2025/26 tax year label (1 Mar 2025 – 28 Feb 2026). */
export const PAYE_FY_LABEL = 'FY2025/26';

/** Monthly basic wage ceiling for SSC contributions (NAD). */
export const SSC_MONTHLY_WAGE_CAP_NAD = 11_000;

/** Employee SSC rate on assessable basic wage. */
export const SSC_EMPLOYEE_RATE = 0.009;

/** Employer SSC rate on assessable basic wage. */
export const SSC_EMPLOYER_RATE = 0.009;

export type PayeBracket = {
  /** Inclusive lower bound (NAD annual taxable income). */
  from: number;
  /** Inclusive upper bound; null = no upper limit. */
  to: number | null;
  /** Fixed tax on income up to `from`. */
  baseTax: number;
  /** Marginal rate on amount exceeding `from`. */
  marginalRate: number;
};

/**
 * Namibia individual PAYE brackets — FY2025/26 (unchanged from 2024/25 per budget).
 * Annual taxable income → progressive tax; monthly PAYE = annual / 12.
 */
export const PAYE_BRACKETS_FY2025_26: readonly PayeBracket[] = [
  { from: 0, to: 100_000, baseTax: 0, marginalRate: 0 },
  { from: 100_000, to: 150_000, baseTax: 0, marginalRate: 0.18 },
  { from: 150_000, to: 350_000, baseTax: 9_000, marginalRate: 0.25 },
  { from: 350_000, to: 550_000, baseTax: 59_000, marginalRate: 0.28 },
  { from: 550_000, to: 850_000, baseTax: 115_000, marginalRate: 0.3 },
  { from: 850_000, to: 1_550_000, baseTax: 205_000, marginalRate: 0.32 },
  { from: 1_550_000, to: null, baseTax: 429_000, marginalRate: 0.37 },
] as const;

/**
 * Compute annual PAYE from annual taxable income using FY2025/26 brackets.
 * @param annualTaxable - Annual taxable remuneration (NAD).
 */
export function computeAnnualPaye(annualTaxable: number): number {
  if (!Number.isFinite(annualTaxable) || annualTaxable <= 0) {
    return 0;
  }

  const income = annualTaxable;
  for (let i = PAYE_BRACKETS_FY2025_26.length - 1; i >= 0; i -= 1) {
    const bracket = PAYE_BRACKETS_FY2025_26[i];
    if (income > bracket.from) {
      const excess = income - bracket.from;
      return roundMoney(bracket.baseTax + excess * bracket.marginalRate);
    }
  }

  return 0;
}

/**
 * Monthly PAYE withheld from salary (annual taxable / 12 via bracket table).
 * @param annualTaxable - Projected annual taxable income (NAD).
 */
export function computeMonthlyPaye(annualTaxable: number): number {
  return roundMoney(computeAnnualPaye(annualTaxable) / 12);
}

export type SscBreakdown = {
  basicWage: number;
  assessableWage: number;
  employeeContribution: number;
  employerContribution: number;
  totalContribution: number;
};

/**
 * Social Security contributions — 0.9% employee + 0.9% employer on capped basic wage.
 * @param basicWage - Monthly basic wage (NAD).
 */
export function computeSsc(basicWage: number): SscBreakdown {
  if (!Number.isFinite(basicWage) || basicWage <= 0) {
    return {
      basicWage: 0,
      assessableWage: 0,
      employeeContribution: 0,
      employerContribution: 0,
      totalContribution: 0,
    };
  }

  const assessableWage = Math.min(basicWage, SSC_MONTHLY_WAGE_CAP_NAD);
  const employeeContribution = roundMoney(assessableWage * SSC_EMPLOYEE_RATE);
  const employerContribution = roundMoney(assessableWage * SSC_EMPLOYER_RATE);

  return {
    basicWage: roundMoney(basicWage),
    assessableWage: roundMoney(assessableWage),
    employeeContribution,
    employerContribution,
    totalContribution: roundMoney(employeeContribution + employerContribution),
  };
}
