/**
 * HotelEtunaMarkIcon
 *
 * Purpose: Official burgundy "he" monogram mark (square) for nav, sidebar, and favicons.
 * Location: /components/brand/HotelEtunaMarkIcon.tsx
 *
 * Asset: public/brand/hotel-etuna-mark.png (cropped from approved logo lockup).
 */

import Image from 'next/image';
import { cn } from '@/lib/utils/cn';
import { brand } from '@/lib/copy/brand';

interface HotelEtunaMarkIconProps {
  className?: string;
  size?: number;
}

export function HotelEtunaMarkIcon({ className, size = 36 }: HotelEtunaMarkIconProps) {
  return (
    <Image
      src={brand.assets.logoMark}
      alt=""
      width={size}
      height={size}
      className={cn('shrink-0 object-contain', className)}
      aria-hidden
      priority={size >= 40}
    />
  );
}
