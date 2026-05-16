/**
 * HotelEtunaLogo
 *
 * Purpose: Wordmark-first brand lockup — geometric mark + "Hotel Etuna" + optional tagline.
 * Location: /components/brand/HotelEtunaLogo.tsx
 *
 * Palette: mark/headings use terracotta-900; tagline uses nude-700 (nude/khaki system).
 */

import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { HotelEtunaMarkIcon } from '@/components/brand/HotelEtunaMarkIcon';

export type HotelEtunaLogoSize = 'sm' | 'md' | 'lg';

const sizeMap: Record<
  HotelEtunaLogoSize,
  { mark: number; title: string; tagline: string }
> = {
  sm: { mark: 28, title: 'text-base', tagline: 'text-[10px]' },
  md: { mark: 36, title: 'text-xl', tagline: 'text-xs' },
  lg: { mark: 48, title: 'text-2xl', tagline: 'text-sm' },
};

export interface HotelEtunaLogoProps {
  size?: HotelEtunaLogoSize;
  showTagline?: boolean;
  href?: string;
  className?: string;
  /** Invert mark for dark backgrounds */
  onDark?: boolean;
}

export function HotelEtunaLogo({
  size = 'md',
  showTagline = false,
  href = '/',
  className,
  onDark = false,
}: HotelEtunaLogoProps) {
  const dims = sizeMap[size];
  const markColor = onDark ? 'text-nude-50' : 'text-terracotta-900';
  const titleColor = onDark ? 'text-nude-50' : 'text-terracotta-900';
  const taglineColor = onDark ? 'text-nude-200' : 'text-nude-700';

  const content = (
    <span
      className={cn('inline-flex items-center gap-2.5 group', className)}
      aria-label="Hotel Etuna"
    >
      <HotelEtunaMarkIcon
        size={dims.mark}
        className={cn('transition-transform duration-200 group-hover:scale-105', markColor)}
      />
      <span className="flex flex-col leading-tight text-left">
        <span className={cn('font-display font-bold tracking-tight', dims.title, titleColor)}>
          Hotel Etuna
        </span>
        {showTagline && (
          <span className={cn('font-medium italic', dims.tagline, taglineColor)}>
            He takes care of us
          </span>
        )}
      </span>
    </span>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-khaki-600 focus-visible:ring-offset-2 rounded-lg">
      {content}
    </Link>
  );
}
