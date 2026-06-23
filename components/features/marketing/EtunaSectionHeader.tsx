/**
 * EtunaSectionHeader — section title with optional "See all" link.
 * Location: components/features/marketing/EtunaSectionHeader.tsx
 */

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

type EtunaSectionHeaderProps = {
  title: string;
  href?: string;
  linkLabel?: string;
  className?: string;
};

export function EtunaSectionHeader({
  title,
  href,
  linkLabel = 'See all',
  className,
}: EtunaSectionHeaderProps) {
  return (
    <div className={cn('etuna-section-header', className)}>
      <h2 className="etuna-section-header-title">{title}</h2>
      {href ? (
        <Link href={href} className="etuna-section-header-link inline-flex items-center gap-0.5">
          {linkLabel}
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      ) : null}
    </div>
  );
}
