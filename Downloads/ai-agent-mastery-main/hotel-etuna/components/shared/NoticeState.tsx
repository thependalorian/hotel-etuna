/**
 * NoticeState — inline info / warning / success alerts (DaisyUI)
 *
 * Purpose: Standardized non-error notices: compliance hints, recoverable warnings, success callouts.
 * Location: components/shared/NoticeState.tsx
 */

import React from 'react';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type NoticeVariant = 'info' | 'warning' | 'success';

const variantClass: Record<NoticeVariant, string> = {
  info: 'alert-info',
  warning: 'alert-warning',
  success: 'alert-success',
};

const defaultIcon: Record<NoticeVariant, React.ReactNode> = {
  info: <Info className="h-5 w-5 shrink-0" aria-hidden />,
  warning: <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden />,
  success: <CheckCircle className="h-5 w-5 shrink-0" aria-hidden />,
};

export interface NoticeStateProps {
  variant: NoticeVariant;
  title?: string;
  message: string;
  onDismiss?: () => void;
  className?: string;
  icon?: React.ReactNode;
  /** Use alert + assertive live region for urgent warnings */
  priority?: 'normal' | 'assertive';
}

export function NoticeState({
  variant,
  title,
  message,
  onDismiss,
  className,
  icon,
  priority = 'normal',
}: NoticeStateProps) {
  return (
    <div
      className={cn('alert items-start text-sm', variantClass[variant], className)}
      role={variant === 'warning' && priority === 'assertive' ? 'alert' : 'status'}
      aria-live={priority === 'assertive' ? 'assertive' : 'polite'}
    >
      {icon ?? defaultIcon[variant]}
      <div className="min-w-0 flex-1">
        {title ? <p className="mb-0.5 font-semibold leading-tight">{title}</p> : null}
        <p className={cn('leading-snug', title ? 'text-sm opacity-90' : 'font-medium')}>{message}</p>
      </div>
      {onDismiss ? (
        <button
          type="button"
          className="btn btn-ghost btn-xs shrink-0"
          onClick={onDismiss}
          aria-label="Dismiss notice"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}

export default NoticeState;
