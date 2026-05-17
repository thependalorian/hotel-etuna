/**
 * Compact menu line for a book spread — thumbnail grid or list row; opens detail on tap.
 * Location: components/dining/MenuBookItemTile.tsx
 */

'use client';

import Image from 'next/image';
import { UtensilsCrossed } from 'lucide-react';
import { formatMenuPrice, type PublicMenuItem } from '@/lib/dining/menu-display';
import {
  getMenuItemImageFromDb,
  MENU_ITEM_IMAGE_SIZES_TILE,
} from '@/lib/dining/menu-item-images';
import type { MenuBookLayout } from '@/lib/dining/menu-book-pagination';

type MenuBookItemTileProps = {
  item: PublicMenuItem;
  layout: MenuBookLayout;
  showThumbnail?: boolean;
  onSelect: (item: PublicMenuItem) => void;
};

export default function MenuBookItemTile({
  item,
  layout,
  showThumbnail = true,
  onSelect,
}: MenuBookItemTileProps) {
  const imageUrl = showThumbnail ? getMenuItemImageFromDb(item) : null;

  if (layout === 'list') {
    return (
      <button
        type="button"
        onClick={() => onSelect(item)}
        className="flex w-full flex-col gap-0.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-khaki-600/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-khaki-600 sm:flex-row sm:items-baseline sm:gap-2"
      >
        <span className="min-w-0 flex-1 text-sm font-semibold leading-snug text-terracotta-900">
          {item.name}
          {item.isFeatured ? (
            <span className="ml-1.5 badge badge-xs border-0 bg-khaki-600/15 text-khaki-800">
              Popular
            </span>
          ) : null}
        </span>
        {item.description ? (
          <span className="line-clamp-1 text-xs text-terracotta-600 sm:order-3 sm:basis-full">
            {item.description}
          </span>
        ) : null}
        <span
          className="mb-0.5 hidden min-w-4 flex-1 border-b border-dotted border-terracotta-300/50 sm:block"
          aria-hidden
        />
        <span className="shrink-0 font-display text-sm font-bold tabular-nums text-khaki-700 sm:ml-auto">
          {formatMenuPrice(item.price, item.currency)}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className="group flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-nude-200/80 bg-white text-left shadow-sm transition-all hover:border-khaki-400/60 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-khaki-600"
    >
      {showThumbnail ? (
        <div className="relative h-20 w-full shrink-0 bg-nude-100 sm:h-[4.75rem]">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt=""
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes={MENU_ITEM_IMAGE_SIZES_TILE}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <UtensilsCrossed className="h-5 w-5 text-terracotta-300" aria-hidden />
            </div>
          )}
          {item.isFeatured ? (
            <span className="badge absolute left-1 top-1 badge-xs border-0 bg-khaki-600 text-white">
              Popular
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col gap-0.5 p-1.5 sm:p-2">
        <h4 className="line-clamp-2 text-xs font-bold leading-tight text-terracotta-900 sm:text-sm">
          {item.name}
        </h4>
        {item.description ? (
          <p className="line-clamp-2 text-xs leading-snug text-terracotta-600">
            {item.description}
          </p>
        ) : null}
        {item.dietaryTags.length > 0 ? (
          <p className="line-clamp-1 text-[10px] font-medium uppercase tracking-wide text-khaki-700 sm:text-xs">
            {item.dietaryTags.slice(0, 2).join(' · ')}
          </p>
        ) : null}
        <p className="mt-auto pt-0.5 font-display text-xs font-bold tabular-nums text-khaki-700 sm:text-sm">
          {formatMenuPrice(item.price, item.currency)}
        </p>
      </div>
    </button>
  );
}
