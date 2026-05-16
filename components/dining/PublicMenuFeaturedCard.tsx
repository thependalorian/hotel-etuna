/**
 * Featured dish flip card — analytics-driven guest favourites.
 * Location: components/dining/PublicMenuFeaturedCard.tsx
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { UtensilsCrossed } from 'lucide-react';
import { formatMenuPrice, type PublicMenuItem } from '@/lib/dining/menu-display';
import {
  getMenuItemImageFromDb,
  MENU_ITEM_IMAGE_SIZES_TILE,
} from '@/lib/dining/menu-item-images';
import { cn } from '@/lib/utils/cn';

type PublicMenuFeaturedCardProps = {
  item: PublicMenuItem;
};

export default function PublicMenuFeaturedCard({ item }: PublicMenuFeaturedCardProps) {
  const [flipped, setFlipped] = useState(false);
  const imageUrl = getMenuItemImageFromDb(item);

  return (
    <div className="group h-72 w-64 shrink-0 snap-start [perspective:1000px]">
      <button
        type="button"
        onClick={() => setFlipped((v) => !v)}
        className="relative h-full w-full rounded-2xl bg-transparent p-0 text-left shadow-card transition-shadow hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-khaki-600"
        aria-expanded={flipped}
      >
        <div
          className={cn(
            'relative h-full w-full transition-transform duration-700 [transform-style:preserve-3d]',
            flipped ? '[transform:rotateY(180deg)]' : 'md:group-hover:[transform:rotateY(180deg)]',
          )}
        >
          <div className="absolute inset-0 overflow-hidden rounded-2xl [backface-visibility:hidden]">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={item.name}
                fill
                className="object-cover"
                sizes={MENU_ITEM_IMAGE_SIZES_TILE}
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-nude-100">
                <UtensilsCrossed className="h-8 w-8 text-terracotta-400" aria-hidden />
              </div>
            )}
            <div className="absolute inset-0 bg-linear-to-t from-terracotta-950/80 via-transparent to-transparent" />
            <span className="badge absolute left-3 top-3 border-0 bg-khaki-600 text-white">
              Guest favourite
            </span>
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
              <h3 className="font-display text-base font-bold">{item.name}</h3>
              <p className="font-display text-lg font-bold text-khaki-200">
                {formatMenuPrice(item.price, item.currency)}
              </p>
            </div>
          </div>
          <div className="absolute inset-0 rounded-2xl bg-white p-4 [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <span className="badge badge-sm border-0 bg-khaki-600/15 text-khaki-800">Top ordered</span>
            <h3 className="mt-2 font-display text-base font-bold text-terracotta-900">{item.name}</h3>
            <p className="mt-2 line-clamp-5 text-xs text-terracotta-700">{item.description}</p>
            <p className="mt-3 font-display text-lg font-bold text-khaki-700">
              {formatMenuPrice(item.price, item.currency)}
            </p>
          </div>
        </div>
      </button>
    </div>
  );
}
