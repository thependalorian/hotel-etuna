/**
 * FolioPartialAmountField — optional partial payment amount for desk/guest folio settlement.
 * Location: components/features/folio/FolioPartialAmountField.tsx
 */

import { formatFolioAmount } from '@/lib/utils/money';

type FolioPartialAmountFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  balanceDue: number;
  currency: string;
  id?: string;
};

export function FolioPartialAmountField({
  label,
  value,
  onChange,
  balanceDue,
  currency,
  id = 'folio-partial-amount',
}: FolioPartialAmountFieldProps) {
  return (
    <label className="form-control w-full" htmlFor={id}>
      <span className="label-text text-sm">{label}</span>
      <input
        id={id}
        type="number"
        step="0.01"
        className="input input-bordered w-full"
        placeholder={formatFolioAmount(currency, balanceDue)}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
