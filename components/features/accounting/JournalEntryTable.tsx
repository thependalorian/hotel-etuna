/**
 * JournalEntryTable
 *
 * Purpose: Display hospitality journal lines with CSV export (OSS W4).
 * Location: /components/features/accounting/JournalEntryTable.tsx
 */

'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { JournalLine } from '@/lib/domain/accounting/types';

type JournalEntryTableProps = {
  lines: JournalLine[];
  currency?: string;
  loading?: boolean;
  periodLabel?: string;
};

function formatCsvCell(value: string | number): string {
  const s = String(value);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function buildJournalCsv(lines: JournalLine[], currency: string): string {
  const header = [
    'Date',
    'Account Code',
    'Account Name',
    'Debit',
    'Credit',
    'Memo',
    'Source Type',
    'Source ID',
    'Currency',
  ];
  const rows = lines.map((line) =>
    [
      line.date.slice(0, 10),
      line.accountCode,
      line.accountName,
      line.debit.toFixed(2),
      line.credit.toFixed(2),
      line.memo,
      line.sourceType,
      line.sourceId,
      line.currency || currency,
    ]
      .map(formatCsvCell)
      .join(',')
  );
  return [header.join(','), ...rows].join('\n');
}

export function JournalEntryTable({
  lines,
  currency = 'NAD',
  loading = false,
  periodLabel,
}: JournalEntryTableProps) {
  const totals = useMemo(() => {
    let debit = 0;
    let credit = 0;
    for (const line of lines) {
      debit += line.debit;
      credit += line.credit;
    }
    return { debit, credit };
  }, [lines]);

  const handleExport = () => {
    const csv = buildJournalCsv(lines, currency);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `journal-lines-${periodLabel ?? 'period'}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Card className="p-8 text-center text-ink-600">Loading journal lines…</Card>
    );
  }

  if (lines.length === 0) {
    return (
      <Card className="p-8 text-center text-ink-600">
        No journal lines for this period.
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink-900">Journal entries</h2>
          <p className="text-sm text-ink-600">
            {lines.length} lines{periodLabel ? ` · ${periodLabel}` : ''}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          Export CSV
        </Button>
      </div>

      <div className="overflow-x-auto table-scroll">
        <table className="table table-sm table-zebra w-full text-sm">
          <thead>
            <tr>
              <th>Date</th>
              <th>Code</th>
              <th>Account</th>
              <th className="text-right">Debit</th>
              <th className="text-right">Credit</th>
              <th>Memo</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, idx) => (
              <tr key={`${line.sourceId}-${line.accountCode}-${idx}`}>
                <td className="whitespace-nowrap">{line.date.slice(0, 10)}</td>
                <td className="font-mono">{line.accountCode}</td>
                <td>{line.accountName}</td>
                <td className="text-right font-mono">
                  {line.debit > 0 ? line.debit.toFixed(2) : '—'}
                </td>
                <td className="text-right font-mono">
                  {line.credit > 0 ? line.credit.toFixed(2) : '—'}
                </td>
                <td className="max-w-xs truncate" title={line.memo}>
                  {line.memo}
                </td>
                <td className="text-xs text-ink-600">{line.sourceType}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-semibold">
              <td colSpan={3}>Totals</td>
              <td className="text-right font-mono">{totals.debit.toFixed(2)}</td>
              <td className="text-right font-mono">{totals.credit.toFixed(2)}</td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  );
}
