/**
 * Accounting terminology — MBA synonym groups mapped to platform report fields.
 * Location: lib/domain/accounting/accounting-terminology.ts
 *
 * Sources: synonymous_terms_in_accounting.md; Libby Financial Accounting (10th ed.);
 * RWJJ Ch.3 (pro-forma / EFN); Ch.6 (project cash flows, OCF).
 */

/** Synonym groups (any term in a group is interchangeable in plain language). */
export const ACCOUNTING_SYNONYM_GROUPS = [
  ['Balance Sheet', 'Statement of Financial Position', 'Statement of Assets, Liabilities and Shareholder Equity'],
  ['Income Statement', 'Statement of Operations', 'Profit and Loss Statement', 'P&L', 'Statement of Revenue and Expenses'],
  ['Revenue', 'Sales', 'Sales Revenue'],
  ['Cost of Goods Sold', 'COGS', 'Cost of Sales'],
  ['Gross Profit', 'Gross Margin'],
  ['Operating Income', 'Income from Operations'],
  ['Net Earnings', 'Net Income', 'Profit', 'Surplus'],
  ['Recognize Revenue', 'Record Revenue', 'Earn Revenue'],
  ['Recognize Expense', 'Record Expense', 'Incur Expense'],
  ['Interest Income', 'Interest Revenue'],
  ['Dividend Income', 'Dividend Revenue'],
  ["Members' interest", 'Retained Earnings', 'Cumulative net earnings less distributions'],
] as const;

/** How Hotel Etuna Namibia reports map to standard financial statement lines. */
export const HOSPITALITY_REPORT_FIELD_LABELS = {
  trialBalance: 'Trial Balance',
  incomeStatement: 'Income Statement (P&L)',
  operatingCashFlow: 'Operating Cash Flow Summary',
  journalLines: 'General Journal',
  roomRevenueExVat: 'Room Revenue (Sales)',
  fnbRevenueExVat: 'Food & Beverage Revenue (Sales)',
  vatOutput: 'VAT Output Payable (NamRA liability)',
  vatInputOnPlatform: 'VAT Input Recoverable (Buffr invoices)',
  platformFeesExVat: 'Platform & Processing Fees (Operating expense)',
  netIncomeBeforeTax: 'Net Income / Net Earnings (before tax)',
  estimatedIncomeTaxProvision: 'Income Tax Provision (illustrative)',
  cashCollectedFromGuests: 'Cash collected from guests (Ch.6 cash lens)',
  netCashFromOperations: 'Net cash from operations (simplified)',
} as const;

/** RWJJ Ch.3 — planning concepts relevant to hospitality growth (reference only). */
export const FINANCIAL_PLANNING_CONCEPTS = {
  proFormaIncomeStatement: 'Forecast P&L from sales growth assumptions',
  proFormaBalanceSheet: 'Forecast assets, liabilities, and equity',
  externalFinancingNeeded: 'EFN — plug when projected assets exceed liabilities + equity',
  sustainableGrowthRate: 'Max growth without new equity at constant D/E',
} as const;

/** RWJJ Ch.6 — incremental project / hospitality cash flow building blocks. */
export const PROJECT_CASH_FLOW_CONCEPTS = {
  operatingCashFlow: 'Net income + non-cash charges (e.g. depreciation)',
  capitalExpenditure: 'CAPEX — asset purchases (not in P1 PMS export)',
  changeInNetWorkingCapital: 'ΔNWC — guest deposits, AR, inventory',
  sunkCost: 'Exclude from incremental analysis',
  opportunityCost: 'Include when property resources have alternative use',
  afterTaxSalvage: 'Include on disposal of fixed assets',
} as const;

export function resolveAccountingSynonym(term: string): string {
  const normalized = term.trim().toLowerCase();
  for (const group of ACCOUNTING_SYNONYM_GROUPS) {
    if (group.some((g) => g.toLowerCase() === normalized)) {
      return group[0];
    }
  }
  return term;
}
