/**
 * StatsCard — small at-a-glance metric tile for the guest dashboard.
 *
 * Location: components/features/guest/StatsCard.tsx
 */

import type { LucideIcon } from 'lucide-react';

export interface StatsCardProps {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
}

/**
 * Render a labelled metric tile (CI cream / chocolate brand surface).
 *
 * @param props - Label, formatted value, optional hint line and icon.
 */
export function StatsCard({ label, value, hint, icon: Icon }: StatsCardProps) {
  return (
    <div className="rounded-etuna-card border border-nude-200 bg-white p-5">
      <div className="flex items-center gap-2 text-sm font-medium text-ink-600">
        {Icon ? <Icon className="h-4 w-4 text-ci-primary" aria-hidden /> : null}
        {label}
      </div>
      <div className="mt-2 font-display text-2xl font-bold text-ci-secondary-chocolate sm:text-3xl">
        {value}
      </div>
      {hint ? <p className="mt-1 text-xs text-ink-500">{hint}</p> : null}
    </div>
  );
}
