/**
 * EtunaFeaturedBadge — trust overlay on listing photography.
 * Location: components/features/marketing/EtunaFeaturedBadge.tsx
 */

import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils/cn';

type EtunaFeaturedBadgeProps = {
  label?: string;
  className?: string;
};

export function EtunaFeaturedBadge({
  label = 'Featured stay',
  className,
}: EtunaFeaturedBadgeProps) {
  return (
    <Badge variant="featured" size="sm" className={cn('etuna-featured-badge', className)}>
      {label}
    </Badge>
  );
}
