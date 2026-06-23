/**
 * HotelEtunaLogo
 *
 * Purpose: Official Hotel Etuna branding — CI logo variants per docs/brand/Hotel-Etuna-CI-Guide-Extract.pdf
 * Location: /components/brand/HotelEtunaLogo.tsx
 */

import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { brand } from '@/lib/copy/brand';
import { HotelEtunaMarkIcon } from '@/components/brand/HotelEtunaMarkIcon';

export type HotelEtunaLogoSize = 'sm' | 'md' | 'lg';

export type LogoVariant =
  | 'primary'
  | 'horizontal'
  | 'horizontal-compact'
  | 'stacked'
  | 'stacked-compact'
  | 'wordmark'
  | 'monogram'
  | 'compact';

const compactSizeMap: Record<
  HotelEtunaLogoSize,
  { mark: number; title: string }
> = {
  sm: { mark: 28, title: 'text-sm' },
  md: { mark: 36, title: 'text-lg' },
  lg: { mark: 44, title: 'text-xl' },
};

const imageVariantMap: Record<
  Exclude<LogoVariant, 'monogram' | 'compact'>,
  { src: string; width: Record<HotelEtunaLogoSize, number> }
> = {
  primary: {
    src: brand.assets.logoPrimary,
    width: { sm: 160, md: 220, lg: 280 },
  },
  horizontal: {
    src: brand.assets.logoHorizontal,
    width: { sm: 180, md: 260, lg: 320 },
  },
  'horizontal-compact': {
    src: brand.assets.logoHorizontalCompact,
    width: { sm: 160, md: 220, lg: 280 },
  },
  stacked: {
    src: brand.assets.logoStacked,
    width: { sm: 140, md: 200, lg: 260 },
  },
  'stacked-compact': {
    src: brand.assets.logoStackedCompact,
    width: { sm: 120, md: 180, lg: 220 },
  },
  wordmark: {
    src: brand.assets.logoWordmark,
    width: { sm: 150, md: 210, lg: 270 },
  },
};

export interface HotelEtunaLogoProps {
  size?: HotelEtunaLogoSize;
  /** CI logo variant — defaults to horizontal-compact for nav-friendly layouts. */
  variant?: LogoVariant;
  /** @deprecated Use variant="primary" */
  showTagline?: boolean;
  href?: string;
  className?: string;
  /** Light wordmark on dark backgrounds (monogram + text compact mode only). */
  onDark?: boolean;
}

export function HotelEtunaLogo({
  size = 'md',
  variant: variantProp,
  showTagline = false,
  href = '/',
  className,
  onDark = false,
}: HotelEtunaLogoProps) {
  const variant: LogoVariant =
    variantProp ?? (showTagline ? 'primary' : 'horizontal-compact');

  const linkClass =
    'inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ci-primary focus-visible:ring-offset-2 rounded-etuna-input';

  if (variant === 'monogram' || variant === 'compact') {
    const dims = compactSizeMap[size];
    const titleColor =
      variant === 'compact'
        ? onDark
          ? 'text-ci-cream'
          : 'text-ci-primary'
        : undefined;

    const mark = (
      <span
        className={cn(
          'inline-flex items-center gap-2.5 group',
          variant === 'compact' && className
        )}
        aria-label={brand.name}
      >
        <HotelEtunaMarkIcon
          size={dims.mark}
          className="shrink-0 transition-transform duration-200 group-hover:scale-105"
        />
        {variant === 'compact' ? (
          <span
            className={cn(
              'font-display font-bold uppercase tracking-[0.12em] leading-none',
              dims.title,
              titleColor
            )}
          >
            {brand.name}
          </span>
        ) : null}
      </span>
    );

    if (!href) {
      return mark;
    }

    return (
      <Link href={href} className={linkClass} aria-label={brand.name}>
        {mark}
      </Link>
    );
  }

  const config = imageVariantMap[variant];
  const width = config.width[size];

  const image = (
    <Image
      src={config.src}
      alt={`${brand.name}${variant === 'primary' || variant === 'wordmark' ? ` — ${brand.logoTagline}` : ''}`}
      width={1600}
      height={600}
      sizes={`(max-width: 640px) ${config.width.sm}px, (max-width: 1024px) ${config.width.md}px, ${config.width.lg}px`}
      className={cn('h-auto w-auto max-w-full', className)}
      style={{ width, height: 'auto' }}
      priority={variant === 'primary'}
    />
  );

  if (!href) {
    return image;
  }

  return (
    <Link href={href} className={linkClass} aria-label={brand.name}>
      {image}
    </Link>
  );
}
