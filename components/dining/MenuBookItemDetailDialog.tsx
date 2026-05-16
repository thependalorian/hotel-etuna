/**
 * Full dish detail modal when a tile on a book spread is tapped.
 * Location: components/dining/MenuBookItemDetailDialog.tsx
 */

'use client';

import Image from 'next/image';
import { X, UtensilsCrossed } from 'lucide-react';
import { formatMenuPrice, type PublicMenuItem } from '@/lib/dining/menu-display';
import {
  getMenuItemImageFromDb,
  MENU_ITEM_IMAGE_SIZES_DETAIL,
} from '@/lib/dining/menu-item-images';

type MenuBookItemDetailDialogProps = {
  item: PublicMenuItem | null;
  showThumbnail?: boolean;
  onClose: () => void;
};

export default function MenuBookItemDetailDialog({
  item,
  showThumbnail = true,
  onClose,
}: MenuBookItemDetailDialogProps) {
  if (!item) return null;

  const imageUrl = showThumbnail ? getMenuItemImageFromDb(item) : null;

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-h-[90vh] max-w-lg overflow-y-auto p-0">
        {showThumbnail ? (
          <div className="relative h-48 w-full bg-nude-100">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={item.name}
                fill
                className="object-cover"
                sizes={MENU_ITEM_IMAGE_SIZES_DETAIL}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <UtensilsCrossed className="h-10 w-10 text-terracotta-300" aria-hidden />
              </div>
            )}
            <div className="absolute inset-0 bg-linear-to-t from-terracotta-950/70 to-transparent" />
            <button
              type="button"
              className="btn btn-circle btn-sm absolute right-3 top-3 border-0 bg-white/90"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-end p-3">
            <button
              type="button"
              className="btn btn-circle btn-sm border border-nude-200 bg-white"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        )}
        <div className={showThumbnail ? 'p-6' : 'px-6 pb-6 pt-0'}>
          <div className="flex flex-wrap gap-1.5">
            {item.isFeatured ? (
              <span className="badge badge-sm border-0 bg-khaki-600 text-white">Guest favourite</span>
            ) : null}
            {item.requiresAdvanceOrder ? (
              <span className="badge badge-sm border-0 bg-terracotta-800 text-white">Advance order</span>
            ) : null}
          </div>
          <h3 className="mt-2 font-display text-2xl font-bold text-terracotta-900">{item.name}</h3>
          <p className="font-display text-2xl font-bold tabular-nums text-khaki-700">
            {formatMenuPrice(item.price, item.currency)}
          </p>
          {item.description ? (
            <p className="mt-4 text-sm leading-relaxed text-terracotta-800">{item.description}</p>
          ) : (
            <p className="mt-4 text-sm italic text-terracotta-600">
              Ask our team for today&apos;s preparation.
            </p>
          )}
          {item.dietaryTags.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {item.dietaryTags.map((tag) => (
                <span
                  key={tag}
                  className="badge badge-sm badge-outline border-khaki-300 text-terracotta-800"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="button" onClick={onClose}>
          close
        </button>
      </form>
    </dialog>
  );
}
