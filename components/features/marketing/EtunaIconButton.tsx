/**
 * EtunaIconButton — circular control for carousels and icon actions.
 * Location: components/features/marketing/EtunaIconButton.tsx
 */

import { cn } from '@/lib/utils/cn';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type EtunaIconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  disabled?: boolean;
};

export function EtunaIconButton({
  children,
  className,
  disabled,
  type = 'button',
  ...props
}: EtunaIconButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        disabled ? 'etuna-icon-btn-disabled' : 'etuna-icon-btn',
        'min-h-touch-mobile min-w-touch-mobile',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
