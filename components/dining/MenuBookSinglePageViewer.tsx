/**
 * Mobile menu viewer — one full-width page at a time with Previous / Next controls.
 * Location: components/dining/MenuBookSinglePageViewer.tsx
 */

'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { MenuBookPage } from '@/lib/dining/menu-book-pagination';

export type MenuBookFlatPage = {
  id: string;
  content: ReactNode;
};

type MenuBookSinglePageViewerProps = {
  pages: MenuBookFlatPage[];
  bookKey?: string;
  getPageLabel?: (pageIndex: number, totalPages: number) => string;
};

/** Unfold book sheets into sequential single pages (front, then back, per sheet). */
export function flattenMenuBookPages(pages: MenuBookPage[]): MenuBookFlatPage[] {
  const flat: MenuBookFlatPage[] = [];
  for (const page of pages) {
    flat.push({ id: `${page.id}-front`, content: page.front });
    flat.push({ id: `${page.id}-back`, content: page.back });
  }
  return flat;
}

export default function MenuBookSinglePageViewer({
  pages,
  bookKey,
  getPageLabel,
}: MenuBookSinglePageViewerProps) {
  const [pageIndex, setPageIndex] = useState(0);
  const total = pages.length;
  const atStart = pageIndex <= 0;
  const atEnd = pageIndex >= total - 1;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setPageIndex(0);
  }, [bookKey]);

  const goPrev = useCallback(() => {
    setPageIndex((i) => Math.max(0, i - 1));
  }, []);

  const goNext = useCallback(() => {
    setPageIndex((i) => Math.min(total - 1, i + 1));
  }, [total]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev]);

  if (total === 0) return null;

  const pageLabel =
    getPageLabel?.(pageIndex, total) ?? `Page ${pageIndex + 1} of ${total}`;

  return (
    <div className="mx-auto w-full select-none">
      <div role="region" aria-label="Digital menu" aria-live="polite">
        <div
          className={cn(
            'relative flex h-[min(88dvh,780px)] min-h-[min(520px,88dvh)] w-full overflow-hidden rounded-lg',
            'bg-linear-to-br from-[#fefefe] to-[#f9f6f0]',
            'shadow-[0_4px_24px_rgba(45,35,28,0.28)]',
          )}
        >
          <div className="flex h-full w-full min-h-0 flex-col overflow-hidden p-2">
            {pages[pageIndex]?.content}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2">
        <button
          type="button"
          className="btn btn-sm min-h-11 min-w-[44px] flex-1 gap-1 border-terracotta-300 bg-terracotta-800 text-white hover:bg-terracotta-900 sm:flex-none sm:px-4"
          disabled={atStart}
          onClick={goPrev}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
          <span>Previous</span>
        </button>
        <span className="min-w-0 flex-[1.2] px-1 text-center font-display text-xs leading-snug text-terracotta-800 sm:text-sm">
          {pageLabel}
        </span>
        <button
          type="button"
          className="btn btn-sm min-h-11 min-w-[44px] flex-1 gap-1 border-terracotta-300 bg-khaki-600 text-white hover:bg-khaki-700 sm:flex-none sm:px-4"
          disabled={atEnd}
          onClick={goNext}
          aria-label="Next page"
        >
          <span>Next</span>
          <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
        </button>
      </div>
    </div>
  );
}
