/**
 * FolioLinesTable — shared charge lines table (staff desk vs guest hub columns).
 * Location: components/features/folio/FolioLinesTable.tsx
 */

import { formatFolioAmount } from '@/lib/utils/money';
import type { FolioLineItem } from '@/lib/types/folio';
import { formatDate } from '@/lib/formatters';

export type FolioVoidTarget = {
  id: string;
  description: string;
  amount: number;
  currency: string;
};

type FolioLinesTableProps = {
  lines: FolioLineItem[];
  variant: 'staff' | 'guest';
  canVoidCharges?: boolean;
  onVoidCharge?: (target: FolioVoidTarget) => void;
};

export function FolioLinesTable({
  lines,
  variant,
  canVoidCharges = false,
  onVoidCharge,
}: FolioLinesTableProps) {
  if (lines.length === 0) return null;

  if (variant === 'staff') {
    return (
      <>
        <div className="hidden sm:block mb-4">
          <div className="overflow-x-auto lg:overflow-x-visible">
            <table className="table table-zebra table-pin-rows w-full text-sm">
              <thead>
                <tr>
                  <th className="bg-nude-100 text-ink-700 font-semibold">Description</th>
                  <th className="bg-nude-100 text-ink-700 font-semibold">Type</th>
                  <th className="bg-nude-100 text-ink-700 font-semibold text-right">Amount</th>
                  {canVoidCharges && (
                    <th className="bg-nude-100 text-ink-700 font-semibold text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => (
                  <tr key={line.id}>
                    <td className="font-medium">{line.description}</td>
                    <td className="text-ink-600 capitalize">{line.chargeType}</td>
                    <td className="text-right font-mono font-semibold">
                      {formatFolioAmount(line.currency, line.amount)}
                    </td>
                    {canVoidCharges && (
                      <td className="text-right">
                        {line.status === 'open' && line.chargeType !== 'payment' && onVoidCharge && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs rounded-full text-error"
                            onClick={() =>
                              onVoidCharge({
                                id: line.id,
                                description: line.description,
                                amount: line.amount,
                                currency: line.currency,
                              })
                            }
                          >
                            Void
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="sm:hidden space-y-2 mb-4 max-h-80 overflow-y-auto">
          {lines.map((line) => (
            <div
              key={line.id}
              className="rounded-etuna-input border border-nude-200 bg-nude-50 p-3 space-y-1"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-ink-900 flex-1">{line.description}</p>
                <p className="font-mono font-bold text-ink-900 shrink-0">
                  {formatFolioAmount(line.currency, line.amount)}
                </p>
              </div>
              <p className="text-xs text-ink-600 capitalize">{line.chargeType}</p>
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <div className="overflow-x-auto table-scroll">
      <table className="table w-full text-sm">
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th className="text-right">Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.id}>
              <td>{line.createdAt ? formatDate(line.createdAt) : 'N/A'}</td>
              <td>
                {line.description}{' '}
                <span className="text-ink-500">({line.chargeType})</span>
              </td>
              <td className="text-right font-mono">{formatFolioAmount(line.currency, line.amount)}</td>
              <td>
                <span
                  className={`badge badge-sm ${line.status === 'settled' ? 'badge-success' : 'badge-warning'}`}
                >
                  {line.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
