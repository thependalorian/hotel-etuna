/**
 * EtunaCarouselRow — horizontal scroll container for listing cards.
 * Location: components/features/marketing/EtunaCarouselRow.tsx
 */

import { cn } from '@/lib/utils/cn';
import type { ReactNode } from 'react';

type EtunaCarouselRowProps = {
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
};

export function EtunaCarouselRow({
  children,
  className,
  ariaLabel = 'Carousel',
}: EtunaCarouselRowProps) {
  return (
    <div className={cn('etuna-carousel-row', className)} role="list" aria-label={ariaLabel}>
      {children}
    </div>
  );
}
