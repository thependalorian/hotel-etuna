/**
 * EmptyState Component - Design System v1.0.0
 * 
 * Purpose: Standardized empty state UI across the application
 * Location: /components/shared/EmptyState.tsx
 * 
 * Features:
 * - Centered flex column layout
 * - Lucide icon support (48px, nude-300)
 * - Display font for title
 * - Optional primary action button
 * - Consistent spacing with py-12
 */

import React from 'react';
import { cn } from '@/lib/utils/cn';
import Link from 'next/link';
import { Inbox } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface EmptyStateProps {
  /** Lucide component, or a pre-rendered icon element (merged with DS sizing). */
  icon?: React.ComponentType<{ className?: string }> | React.ReactElement<{ className?: string }>;
  title: string;
  description: string;
  /** Optional density; maps to vertical padding only (icons stay DS-sized). */
  size?: "sm" | "md" | "lg";
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

const sizePadding: Record<NonNullable<EmptyStateProps["size"]>, string> = {
  sm: "py-8",
  md: "py-12",
  lg: "py-16",
};

function renderEmptyIcon(
  icon: EmptyStateProps["icon"]
): React.ReactNode {
  if (icon == null) {
    return <Inbox className="w-12 h-12 text-nude-300" aria-hidden />;
  }
  if (React.isValidElement(icon)) {
    return React.cloneElement(icon, {
      className: cn("w-12 h-12 text-nude-300", icon.props.className),
      "aria-hidden": true,
    } as { className?: string; "aria-hidden"?: boolean });
  }
  const Cmp = icon;
  return <Cmp className="w-12 h-12 text-nude-300" aria-hidden />;
}

function EmptyState({
  icon,
  title,
  description,
  size = "md",
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        sizePadding[size],
        className
      )}
    >
      {/* Icon */}
      <div className="mb-4">{renderEmptyIcon(icon)}</div>

      {/* Title */}
      <h3 className="font-display text-xl font-semibold text-nude-800 mb-2">
        {title}
      </h3>

      {/* Description */}
      <p className="text-nude-600 text-base max-w-md mb-6">
        {description}
      </p>

      {/* Action Button */}
      {action && (
        <div>
          {action.href ? (
            <Button asChild size="sm">
              <Link href={action.href}>{action.label}</Link>
            </Button>
          ) : action.onClick ? (
            <Button type="button" size="sm" onClick={action.onClick}>
              {action.label}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default EmptyState;
