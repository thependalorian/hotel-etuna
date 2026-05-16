/**
 * One book page face showing multiple menu items (grid or list by category).
 * Location: components/dining/MenuBookItemsFace.tsx
 */

'use client';

import { useState } from 'react';
import MenuBookContinueFace from '@/components/dining/MenuBookContinueFace';
import MenuBookItemTile from '@/components/dining/MenuBookItemTile';
import MenuBookItemDetailDialog from '@/components/dining/MenuBookItemDetailDialog';
import {
  categoryUsesMenuThumbnails,
  type MenuBookLayout,
} from '@/lib/dining/menu-book-pagination';
import type { PublicMenuCategory, PublicMenuItem } from '@/lib/dining/menu-display';
import { cn } from '@/lib/utils/cn';

type MenuBookItemsFaceProps = {
  category: PublicMenuCategory;
  items: PublicMenuItem[];
  layout: MenuBookLayout;
  pageNumber: number;
  totalPages: number;
  sideLabel?: string;
};

export default function MenuBookItemsFace({
  category,
  items,
  layout,
  pageNumber,
  totalPages,
  sideLabel,
}: MenuBookItemsFaceProps) {
  const [selected, setSelected] = useState<PublicMenuItem | null>(null);
  const showThumbnail = categoryUsesMenuThumbnails(category.name);

  if (items.length === 0) {
    return <MenuBookContinueFace />;
  }

  return (
    <>
      <div className="flex h-full w-full min-h-0 flex-col overflow-hidden p-3 md:p-4">
        <header className="mb-2 shrink-0 border-b border-terracotta-200/40 pb-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-khaki-700">
            {category.name}
            {sideLabel ? ` · ${sideLabel}` : ''}
          </p>
          <p className="text-xs text-terracotta-600">
            Page {pageNumber} of {totalPages}
            <span className="mx-1">·</span>
            {items.length} {items.length === 1 ? 'item' : 'items'} on this page
          </p>
        </header>

        <div
          className={cn(
            'min-h-0 flex-1 overflow-y-auto pr-1',
            layout === 'grid'
              ? 'grid grid-cols-2 grid-rows-2 gap-2 md:gap-2.5'
              : 'flex flex-col gap-0.5',
          )}
        >
          {items.map((item) => (
            <MenuBookItemTile
              key={item.id}
              item={item}
              layout={layout}
              showThumbnail={showThumbnail}
              onSelect={setSelected}
            />
          ))}
        </div>

        <p className="mt-2 shrink-0 text-center text-[10px] text-terracotta-500">
          Tap any dish for full details
        </p>
      </div>

      <MenuBookItemDetailDialog
        item={selected}
        showThumbnail={showThumbnail}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
