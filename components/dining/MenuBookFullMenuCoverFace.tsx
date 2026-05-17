/**
 * Full-menu book cover spread — restaurant intro and category index.
 * Location: components/dining/MenuBookFullMenuCoverFace.tsx
 */

'use client';

import Image from 'next/image';
import { BookOpen } from 'lucide-react';
import type { PublicMenuPayload } from '@/lib/dining/menu-display';

type MenuBookFullMenuCoverFaceProps = {
  menu: PublicMenuPayload;
  variant: 'front' | 'back';
};

export default function MenuBookFullMenuCoverFace({ menu, variant }: MenuBookFullMenuCoverFaceProps) {
  if (variant === 'front') {
    return (
      <div className="relative flex h-full w-full flex-col items-center justify-end p-8 text-center">
        <Image
          src="/images/hospitality/restaurant_dining.jpeg"
          alt=""
          fill
          className="object-cover"
          sizes="450px"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-t from-terracotta-950/92 via-terracotta-950/50 to-terracotta-900/20" />
        <div className="relative z-10 text-white">
          <BookOpen className="mx-auto mb-4 h-10 w-10 text-khaki-300" aria-hidden />
          <p className="text-sm font-semibold uppercase tracking-widest text-white/80">Etuna Restaurant</p>
          <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">Full menu</h2>
          <p className="mt-3 text-sm text-white/90">
            {menu.itemCount} dishes · use Next to browse the full menu
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full min-h-0 flex-col p-6 md:p-8">
      <p className="text-xs font-semibold uppercase tracking-wider text-khaki-700">What&apos;s inside</p>
      <h2 className="mt-2 font-display text-2xl font-bold text-terracotta-900">All sections</h2>
      <ul className="mt-4 min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1 text-sm text-terracotta-800">
        {menu.categories.map((category) => (
          <li key={category.id} className="flex items-baseline justify-between gap-3 border-b border-terracotta-100/80 py-1.5">
            <span className="font-medium text-terracotta-900">{category.name}</span>
            <span className="shrink-0 tabular-nums text-terracotta-600">{category.items.length}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 shrink-0 text-xs text-terracotta-500">
        Use Previous and Next to browse. Tap any dish for full details.
      </p>
    </div>
  );
}
