/**
 * Chart of accounts — Namibian hospitality close corporation (Hotel Etuna).
 * Location: lib/domain/accounting/namibia-hospitality-coa.ts
 *
 * Aligned with Libby financial statement categories; amounts post from PMS folio + payments.
 */

import type { ChartAccount } from '@/lib/domain/accounting/types';

export const NAMIBIA_HOSPITALITY_COA: ChartAccount[] = [
  { code: '1010', name: 'Bank — guest collections (Nedbank)', type: 'asset', normalBalance: 'debit', statementLine: 'balance_sheet' },
  { code: '1020', name: 'Card clearing — Adumo', type: 'asset', normalBalance: 'debit', statementLine: 'balance_sheet' },
  { code: '1000', name: 'Cash on hand', type: 'asset', normalBalance: 'debit', statementLine: 'balance_sheet' },
  { code: '1100', name: 'Accounts receivable — guests', type: 'asset', normalBalance: 'debit', statementLine: 'balance_sheet' },
  { code: '2100', name: 'VAT output payable (NamRA)', type: 'liability', normalBalance: 'credit', statementLine: 'balance_sheet' },
  { code: '2110', name: 'VAT input recoverable (Buffr invoices)', type: 'asset', normalBalance: 'debit', statementLine: 'balance_sheet' },
  { code: '2200', name: 'Guest deposits / unearned revenue', type: 'liability', normalBalance: 'credit', statementLine: 'balance_sheet' },
  { code: '2300', name: 'Accounts payable — Buffr platform', type: 'liability', normalBalance: 'credit', statementLine: 'balance_sheet' },
  { code: '3100', name: "Members' interest — retained earnings", type: 'equity', normalBalance: 'credit', statementLine: 'balance_sheet' },
  { code: '4000', name: 'Room revenue', type: 'revenue', normalBalance: 'credit', statementLine: 'income_statement' },
  { code: '4100', name: 'Food & beverage revenue', type: 'revenue', normalBalance: 'credit', statementLine: 'income_statement' },
  { code: '4200', name: 'Other operating revenue', type: 'revenue', normalBalance: 'credit', statementLine: 'income_statement' },
  { code: '5100', name: 'Platform & card processing fees (Buffr)', type: 'expense', normalBalance: 'debit', statementLine: 'income_statement' },
  { code: '5200', name: 'Other operating expenses', type: 'expense', normalBalance: 'debit', statementLine: 'income_statement' },
];

const COA_BY_CODE = new Map(NAMIBIA_HOSPITALITY_COA.map((a) => [a.code, a]));

export function getChartAccount(code: string): ChartAccount | undefined {
  return COA_BY_CODE.get(code);
}

export function revenueAccountForChargeType(chargeType: string): string {
  switch (chargeType) {
    case 'room':
      return '4000';
    case 'fnb':
      return '4100';
    default:
      return '4200';
  }
}

export function cashAccountForPayment(gateway: string | null, methodHint?: string): string {
  const g = (gateway ?? '').toLowerCase();
  const m = (methodHint ?? '').toLowerCase();
  if (m === 'cash' || g === 'cash') return '1000';
  if (g.includes('adumo') || g.includes('card')) return '1020';
  return '1010';
}
