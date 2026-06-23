/**
 * EtunaFilterPill — category chip for browse filters (rounded-etuna-input, not pill CTA).
 * Location: components/features/marketing/EtunaFilterPill.tsx
 */

import { cn } from '@/lib/utils/cn';

type EtunaFilterPillProps = {
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
};

export function EtunaFilterPill({ label, active, onClick, className }: EtunaFilterPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        active ? 'etuna-filter-pill-active' : 'etuna-filter-pill',
        'min-h-touch-mobile shrink-0',
        className,
      )}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}

type EtunaFilterPillRowProps = {
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
};

export function EtunaFilterPillRow({
  options,
  value,
  onChange,
  className,
}: EtunaFilterPillRowProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)} role="tablist">
      {options.map((opt) => (
        <EtunaFilterPill
          key={opt.id}
          label={opt.label}
          active={value === opt.id}
          onClick={() => onChange(opt.id)}
        />
      ))}
    </div>
  );
}
