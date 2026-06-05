/**
 * Hospitality accounting types (Libby: journal entries, trial balance, financial statements).
 * Location: lib/domain/accounting/types.ts
 *
 * Namibia: NAD, NamRA VAT, Close Corporation equity (members' interest / retained earnings).
 */

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

export type NormalBalance = 'debit' | 'credit';

export interface ChartAccount {
  code: string;
  name: string;
  type: AccountType;
  normalBalance: NormalBalance;
  /** NamRA / management reporting group */
  statementLine: 'balance_sheet' | 'income_statement';
}

export type JournalSourceType =
  | 'booking_charge'
  | 'guest_payment'
  | 'platform_fee_accrual'
  | 'platform_invoice';

export interface JournalLine {
  date: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  memo: string;
  sourceType: JournalSourceType;
  sourceId: string;
  currency: string;
}

export interface TrialBalanceRow {
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  debitTotal: number;
  creditTotal: number;
  /** Signed balance in normal-balance direction (positive = natural balance) */
  balance: number;
}

export interface IncomeStatementReport {
  currency: string;
  roomRevenueExVat: number;
  conferenceRevenueExVat: number;
  campsiteRevenueExVat: number;
  fnbRevenueExVat: number;
  otherRevenueExVat: number;
  totalRevenueExVat: number;
  vatOutput: number;
  totalRevenueInclVat: number;
  platformFeesExVat: number;
  vatInputOnPlatform: number;
  totalExpensesInclVat: number;
  netIncomeBeforeTax: number;
  /** Illustrative provision @ Namibia non-mining corporate rate — not a tax return */
  estimatedIncomeTaxProvision: number;
  netIncomeAfterTax: number;
}

export interface OperatingCashFlowSummary {
  /** Cash collected from guests (completed payments) — Ch.6 cash-from-operations lens */
  cashCollectedFromGuests: number;
  /** Platform fees accrued in period (expense recognition; cash may lag invoice) */
  platformFeesAccrued: number;
  /** Simplified: collections minus platform fees */
  netCashFromOperations: number;
}

export interface HospitalityAccountingPeriodReport {
  period: { from: string; to: string };
  currency: string;
  entity: {
    legalName: string;
    ccNumber: string;
    vatNumber: string | null;
    incomeTaxReference: string | null;
  };
  basis: 'accrual_settled_charges';
  journalLineCount: number;
  trialBalance: TrialBalanceRow[];
  incomeStatement: IncomeStatementReport;
  operatingCashFlow: OperatingCashFlowSummary;
  journalLines: JournalLine[];
  /** P&L / balance sheet field labels (MBA synonym mapping) */
  reportLabels?: Record<string, string>;
  disclaimer: string;
}
