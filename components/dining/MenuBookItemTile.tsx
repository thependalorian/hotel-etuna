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
        className="flex w-full items-baseline gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-khaki-600/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-khaki-600"
      >
        <span className="min-w-0 flex-1 text-sm font-semibold leading-snug text-terracotta-900">
          {item.name}
          {item.isFeatured ? (
            <span className="ml-1.5 badge badge-xs border-0 bg-khaki-600/15 text-khaki-800">
              Popular
            </span>
          ) : null}
        </span>
        <span
          className="mb-0.5 hidden min-w-4 flex-1 border-b border-dotted border-terracotta-300/50 sm:block"
          aria-hidden
        />
        <span className="shrink-0 font-display text-sm font-bold tabular-nums text-khaki-700">
          {formatMenuPrice(item.price, item.currency)}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className="group flex flex-col overflow-hidden rounded-lg border border-nude-200/80 bg-white text-left shadow-sm transition-all hover:border-khaki-400/60 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-khaki-600"
    >
      <div className="relative aspect-[4/3] w-full bg-nude-100">
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
            <UtensilsCrossed className="h-6 w-6 text-terracotta-300" aria-hidden />
          </div>
        )}
        {item.isFeatured ? (
          <span className="badge absolute left-1.5 top-1.5 badge-xs border-0 bg-khaki-600 text-white">
            Popular
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-2">
        <h4 className="line-clamp-2 text-xs font-bold leading-tight text-terracotta-900">{item.name}</h4>
        <p className="mt-1 font-display text-sm font-bold tabular-nums text-khaki-700">
          {formatMenuPrice(item.price, item.currency)}
        </p>
      </div>
    </button>
  );
}
