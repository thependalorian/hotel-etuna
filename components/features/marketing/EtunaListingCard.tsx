/**
 * EtunaListingCard — photography-first browse tile for rooms and partners.
 * Location: components/features/marketing/EtunaListingCard.tsx
 */

import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { EtunaFeaturedBadge } from './EtunaFeaturedBadge';

export type EtunaListingCardProps = {
  href: string;
  imageSrc: string;
  imageAlt: string;
  title: string;
  meta?: string;
  price?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  featuredLabel?: string | null;
  className?: string;
  imageSizes?: string;
  children?: ReactNode;
};

export function EtunaListingCard({
  href,
  imageSrc,
  imageAlt,
  title,
  meta,
  price,
  rating,
  reviewCount,
  featuredLabel,
  className,
  imageSizes = '(max-width: 768px) 88vw, 20vw',
  children,
}: EtunaListingCardProps) {
  return (
    <article className={cn('etuna-listing-card w-[min(88vw,320px)] shrink-0 snap-center md:w-full', className)}>
      <Link href={href} className="group block">
        <div className="relative aspect-square overflow-hidden rounded-etuna-card bg-nude-200">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            className="object-cover transition duration-300 group-hover:scale-[1.02]"
            sizes={imageSizes}
          />
          {featuredLabel ? <EtunaFeaturedBadge label={featuredLabel} /> : null}
        </div>
        <div className="etuna-listing-card-body">
          <h3 className="etuna-listing-card-title line-clamp-1">{title}</h3>
          {meta ? <p className="etuna-listing-card-meta line-clamp-1">{meta}</p> : null}
          {price ? <p className="etuna-listing-card-price">{price}</p> : null}
          {rating != null && rating > 0 ? (
            <p className="flex items-center gap-1 text-body text-ink-900">
              <Star className="h-3 w-3 fill-nude-900 text-ink-900" aria-hidden />
              <span className="font-semibold">{rating.toFixed(1)}</span>
              {reviewCount != null ? (
                <span className="text-ink-600">({reviewCount})</span>
              ) : null}
            </p>
          ) : null}
          {children}
        </div>
      </Link>
    </article>
  );
}
