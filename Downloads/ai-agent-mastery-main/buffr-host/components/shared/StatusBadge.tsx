/**
 * StatusBadge Component - Design System v1.0.0
 * 
 * Purpose: Reusable status badge with semantic colors
 * Location: /components/shared/StatusBadge.tsx
 * 
 * Features:
 * - Variants: success, warning, error, info, neutral
 * - Semantic color system integration
 * - Size: text-xs px-2.5 py-0.5
 * - Border radius: rounded-full
 * - Font weight: font-semibold
 * - Optional colored dot indicator
 */

import { cn } from '@/lib/utils/cn';

type StatusVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface StatusBadgeProps {
  status?: string | null;
  variant?: StatusVariant;
  showDot?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const statusToVariant: Record<string, StatusVariant> = {
  active: 'success',
  available: 'success',
  completed: 'success',
  published: 'success',
  approved: 'success',
  resolved: 'success',
  served: 'success',
  checked_in: 'success',
  confirmed: 'success',
  processing: 'info',
  checked_out: 'info',
  ready: 'info',
  in_review: 'info',
  investigating: 'info',
  pending: 'warning',
  draft: 'warning',
  preparing: 'warning',
  scheduled: 'warning',
  needs_info: 'warning',
  awaiting_customer: 'warning',
  inactive: 'neutral',
  closed: 'neutral',
  cancelled: 'neutral',
  suspended: 'error',
  failed: 'error',
  rejected: 'error',
  no_show: 'error',
};

const variantStyles: Record<StatusVariant, { bg: string; text: string; dot: string }> = {
  success: {
    bg: 'bg-semantic-success-light',
    text: 'text-semantic-success-dark',
    dot: 'bg-semantic-success',
  },
  warning: {
    bg: 'bg-semantic-warning-light',
    text: 'text-semantic-warning-dark',
    dot: 'bg-semantic-warning',
  },
  error: {
    bg: 'bg-semantic-error-light',
    text: 'text-semantic-error-dark',
    dot: 'bg-semantic-error',
  },
  info: {
    bg: 'bg-semantic-info-light',
    text: 'text-semantic-info-dark',
    dot: 'bg-semantic-info',
  },
  neutral: {
    bg: 'bg-nude-100',
    text: 'text-nude-800',
    dot: 'bg-nude-400',
  },
};

const sizeStyles: Record<NonNullable<StatusBadgeProps["size"]>, string> = {
  sm: "gap-1 px-2 py-0.5 text-xs",
  md: "gap-1.5 px-2.5 py-0.5 text-xs",
  lg: "gap-2 px-3 py-1 text-sm",
};

export function StatusBadge({
  status,
  variant,
  showDot = false,
  size = "md",
  className,
}: StatusBadgeProps) {
  const normalizedStatus = status?.trim().toLowerCase() || 'unknown';
  const badgeVariant = variant || statusToVariant[normalizedStatus] || 'neutral';
  const styles = variantStyles[badgeVariant];

  return (
    <span 
      className={cn(
        'inline-flex items-center rounded-full font-semibold',
        sizeStyles[size],
        styles.bg,
        styles.text,
        className
      )}
    >
      {showDot && (
        <span className={cn('w-2 h-2 rounded-full', styles.dot)} />
      )}
      <span className="capitalize">
        {normalizedStatus.replace(/_/g, ' ')}
      </span>
    </span>
  );
}
