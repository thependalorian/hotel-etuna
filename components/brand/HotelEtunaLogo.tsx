/**
 * HotelEtunaLogo
 *
 * Purpose: Official Hotel Etuna branding — full lockup image or compact mark + wordmark.
 * Location: /components/brand/HotelEtunaLogo.tsx
 *
 * Lockup (showTagline): public/brand/hotel-etuna-logo.png — mark + HOTEL ETUNA + script tagline.
 * Compact: mark PNG + serif wordmark for nav, sidebar, and dark footers.
 */

import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { brand } from '@/lib/copy/brand';
import { HotelEtunaMarkIcon } from '@/components/brand/HotelEtunaMarkIcon';

export type HotelEtunaLogoSize = 'sm' | 'md' | 'lg';

const compactSizeMap: Record<
  HotelEtunaLogoSize,
  { mark: number; title: string }
> = {
  sm: { mark: 28, title: 'text-sm' },
  md: { mark: 36, title: 'text-lg' },
  lg: { mark: 44, title: 'text-xl' },
};

const lockupWidthMap: Record<HotelEtunaLogoSize, number> = {
  sm: 160,
  md: 220,
  lg: 280,
};

export interface HotelEtunaLogoProps {
  size?: HotelEtunaLogoSize;
  /** Renders the full official lockup (mark + HOTEL ETUNA + script tagline). */
  showTagline?: boolean;
  href?: string;
  className?: string;
  /** Light wordmark on dark backgrounds (compact mode only). */
  onDark?: boolean;
}

export function HotelEtunaLogo({
  size = 'md',
  showTagline = false,
  href = '/',
  className,
  onDark = false,
}: HotelEtunaLogoProps) {
  const linkClass =
    'inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-khaki-600 focus-visible:ring-offset-2 rounded-lg';

  if (showTagline) {
    const width = lockupWidthMap[size];
    const lockup = (
      <Image
        src={brand.assets.logoLockup}
        alt={`${brand.name} — ${brand.logoTagline}`}
        width={1600}
        height={1600}
        sizes={`(max-width: 640px) ${lockupWidthMap.sm}px, (max-width: 1024px) ${lockupWidthMap.md}px, ${lockupWidthMap.lg}px`}
        className={cn('h-auto w-auto max-w-full', className)}
        style={{ width, height: 'auto' }}
        priority
      />
    );

    if (!href) {
      return lockup;
    }

    return (
      <Link href={href} className={linkClass} aria-label={brand.name}>
        {lockup}
      </Link>
    );
  }

  const dims = compactSizeMap[size];
  const titleColor = onDark ? 'text-nude-50' : 'text-terracotta-900';

  const content = (
    <span
      className={cn('inline-flex items-center gap-2.5 group', className)}
      aria-label={brand.name}
    >
      <HotelEtunaMarkIcon
        size={dims.mark}
        className="transition-transform duration-200 group-hover:scale-105"
      />
      <span
        className={cn(
          'font-display font-bold uppercase tracking-[0.12em] leading-none',
          dims.title,
          titleColor
        )}
      >
        {brand.name}
      </span>
    </span>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} className={linkClass}>
      {content}
    </Link>
  );
}
