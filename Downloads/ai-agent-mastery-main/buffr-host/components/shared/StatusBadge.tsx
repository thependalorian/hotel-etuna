/**
 * StatusBadge Component
 * Purpose: Reusable DaisyUI status badge for admin, CMS, property, and workflow lists.
 * Location: /components/shared/StatusBadge.tsx
 */

import { cn } from '@/lib/utils/cn';

const statusClasses: Record<string, string> = {
  active: 'badge-success',
  available: 'badge-success',
  completed: 'badge-success',
  published: 'badge-success',
  approved: 'badge-success',
  resolved: 'badge-success',
  served: 'badge-success',
  checked_in: 'badge-success',
  processing: 'badge-info',
  checked_out: 'badge-info',
  ready: 'badge-info',
  in_review: 'badge-info',
  investigating: 'badge-info',
  pending: 'badge-warning',
  draft: 'badge-warning',
  confirmed: 'badge-warning',
  preparing: 'badge-warning',
  scheduled: 'badge-warning',
  needs_info: 'badge-warning',
  awaiting_customer: 'badge-warning',
  inactive: 'badge-ghost',
  closed: 'badge-ghost',
  cancelled: 'badge-ghost',
  suspended: 'badge-error',
  failed: 'badge-error',
  rejected: 'badge-error',
  no_show: 'badge-error',
};

type StatusBadgeProps = {
  status?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
};

export function StatusBadge({ status, size = 'sm', className }: StatusBadgeProps) {
  const normalizedStatus = status?.trim().toLowerCase() || 'unknown';
  const sizeClass = size === 'md' ? '' : `badge-${size}`;

  return (
    <span className={cn('badge capitalize', sizeClass, statusClasses[normalizedStatus] ?? 'badge-neutral', className)}>
      {normalizedStatus.replace(/_/g, ' ')}
    </span>
  );
}
