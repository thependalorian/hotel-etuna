/**
 * FolioBalanceStat — single balance/KPI tile for staff and guest folio views.
 * Location: components/features/folio/FolioBalanceStat.tsx
 */

type FolioBalanceStatProps = {
  label: string;
  value: string;
  valueClassName?: string;
};

export function FolioBalanceStat({ label, value, valueClassName = 'text-xl font-bold text-ink-900' }: FolioBalanceStatProps) {
  return (
    <div className="rounded-etuna-input bg-nude-50 border border-nude-200 p-3 sm:p-4">
      <p className="text-xs text-ink-600 uppercase">{label}</p>
      <p className={valueClassName}>{value}</p>
    </div>
  );
}
