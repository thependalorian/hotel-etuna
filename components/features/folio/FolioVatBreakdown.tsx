/**
 * FolioVatBreakdown
 *
 * Purpose: Show Hotel Etuna (property) VAT split on guest/staff folios for NamRA-aligned receipts.
 * Location: /components/features/folio/FolioVatBreakdown.tsx
 */

import type { FolioVatSummary } from '@/lib/types/folio';
import { formatFolioAmount } from '@/lib/utils/money';

interface FolioVatBreakdownProps {
  vat: FolioVatSummary;
  className?: string;
}

export function FolioVatBreakdown({ vat, className = '' }: FolioVatBreakdownProps) {
  if (!vat.vatRegistered || vat.vatAmount <= 0) return null;

  const inclusiveNote =
    vat.pricingMode === 'inclusive'
      ? 'Prices include VAT where shown.'
      : 'VAT added to taxable supplies.';

  return (
    <div
      className={`rounded-lg border border-nude-200 bg-nude-50/80 p-4 text-sm ${className}`}
      role="region"
      aria-label="VAT breakdown"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-nude-600 mb-2">
        VAT ({vat.supplierLegalName})
      </p>
      <p className="text-xs text-nude-600 mb-2 space-y-0.5">
        {vat.supplierCcNumber && <span className="block">CC {vat.supplierCcNumber}</span>}
        {vat.supplierVatNumber && <span className="block">VAT no. {vat.supplierVatNumber}</span>}
      </p>
      <dl className="space-y-1">
        <div className="flex justify-between gap-4">
          <dt className="text-nude-600">Taxable supplies (open)</dt>
          <dd className="font-mono text-nude-900">
            {formatFolioAmount(vat.currency, vat.taxableGross)}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-nude-600">Amount ex VAT</dt>
          <dd className="font-mono text-nude-900">
            {formatFolioAmount(vat.currency, vat.amountExVat)}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-nude-600">VAT @ {vat.vatRatePercent}%</dt>
          <dd className="font-mono text-nude-900">
            {formatFolioAmount(vat.currency, vat.vatAmount)}
          </dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-nude-200 pt-2 font-semibold">
          <dt className="text-nude-800">Total incl. VAT</dt>
          <dd className="font-mono text-nude-900">
            {formatFolioAmount(vat.currency, vat.totalInclVat)}
          </dd>
        </div>
      </dl>
      <p className="text-xs text-nude-500 mt-2">{inclusiveNote}</p>
    </div>
  );
}
