/**
 * NotFoundState — embedded “resource not found” / empty selection UI
 *
 * Purpose: Same visual language as EmptyState, tuned for missing records or invalid selection.
 * Location: components/shared/NotFoundState.tsx
 */

import React from 'react';
import { FileQuestion } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import EmptyState from '@/components/shared/EmptyState';

export interface NotFoundStateProps {
  title?: string;
  description: string;
  homeHref?: string;
  homeLabel?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const iconSize: Record<NonNullable<NotFoundStateProps['size']>, string> = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
};

export function NotFoundState({
  title = 'Not found',
  description,
  homeHref,
  homeLabel = 'Go back',
  className,
  size = 'md',
}: NotFoundStateProps) {
  const s = size ?? 'md';
  return (
    <EmptyState
      className={className}
      size={s}
      icon={<FileQuestion className={cn(iconSize[s], 'text-base-content/60')} aria-hidden />}
      title={title}
      description={description}
      action={homeHref ? { label: homeLabel, href: homeHref } : undefined}
    />
  );
}

export default NotFoundState;
