/**
 * FolioBalanceStat — single balance/KPI tile for staff and guest folio views.
 * Location: components/features/folio/FolioBalanceStat.tsx
 */

type FolioBalanceStatProps = {
  label: string;
  value: string;
  valueClassName?: string;
};

export function FolioBalanceStat({ label, value, valueClassName = 'text-xl font-bold text-nude-900' }: FolioBalanceStatProps) {
  return (
    <div className="rounded-lg bg-nude-50 border border-nude-200 p-3 sm:p-4">
      <p className="text-xs text-nude-600 uppercase">{label}</p>
      <p className={valueClassName}>{value}</p>
    </div>
  );
}
