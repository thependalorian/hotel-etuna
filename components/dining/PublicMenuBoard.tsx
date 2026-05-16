/**
 * Interactive public menu — view-only book; ordering requires sign-in.
 * Location: components/dining/PublicMenuBoard.tsx
 */

'use client';

import Link from 'next/link';
import { Info, Sparkles } from 'lucide-react';
import PublicMenuFeaturedCard from '@/components/dining/PublicMenuFeaturedCard';
import MenuBookFullMenu from '@/components/dining/MenuBookFullMenu';
import { publicCopy } from '@/lib/copy/public';
import { type PublicMenuPayload } from '@/lib/dining/menu-display';

type PublicMenuBoardProps = {
  menu: PublicMenuPayload;
  isAuthenticated?: boolean;
};

export default function PublicMenuBoard({ menu, isAuthenticated = false }: PublicMenuBoardProps) {
  if (menu.categories.length === 0) {
    return (
      <p className="rounded-2xl bg-white p-8 text-center text-terracotta-800 shadow-card">
        Our menu is being updated. Please check back shortly or contact reception.
      </p>
    );
  }

  return (
    <div className="space-y-10">
      {!isAuthenticated ? (
        <div
          role="status"
          className="alert border-khaki-200/80 bg-khaki-50/90 text-terracotta-900 shadow-sm"
        >
          <Info className="h-5 w-5 shrink-0 text-khaki-700" aria-hidden />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <span className="text-sm">{publicCopy.gated.menuBrowseOnly}</span>
            <Link
              href="/login?redirect=/dining"
              className="btn btn-sm btn-primary min-h-10 shrink-0 border-0 bg-khaki-600 text-white hover:bg-khaki-700"
            >
              {publicCopy.gated.orderOnline}
            </Link>
          </div>
        </div>
      ) : null}

      {menu.featured.length > 0 ? (
        <section aria-label="Featured dishes">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-khaki-600" aria-hidden />
            <h3 className="font-display text-2xl font-bold text-terracotta-900">Guest favourites</h3>
            <span className="text-sm text-terracotta-600">— from order analytics (last 90 days)</span>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin">
            {menu.featured.map((item) => (
              <PublicMenuFeaturedCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      ) : null}

      <MenuBookFullMenu menu={menu} />
    </div>
  );
}
