/**
 * Full-menu book — all categories in one page-turn flow.
 * Location: components/dining/MenuBookFullMenu.tsx
 */

'use client';

import { useMemo } from 'react';
import MenuPageTurner, { type MenuBookPage } from '@/components/dining/MenuPageTurner';
import MenuBookFullMenuCoverFace from '@/components/dining/MenuBookFullMenuCoverFace';
import MenuBookItemsFace from '@/components/dining/MenuBookItemsFace';
import MenuBookContinueFace from '@/components/dining/MenuBookContinueFace';
import {
  collectFullMenuFaceChunks,
  pairBookSides,
  type MenuBookFaceChunk,
} from '@/lib/dining/menu-book-pagination';
import type { PublicMenuPayload } from '@/lib/dining/menu-display';

type MenuBookFullMenuProps = {
  menu: PublicMenuPayload;
};

function renderContentFace(chunk: MenuBookFaceChunk | null, pageNumber: number, totalPages: number) {
  if (!chunk?.items.length) {
    return <MenuBookContinueFace />;
  }
  return (
    <MenuBookItemsFace
      category={chunk.category}
      items={chunk.items}
      layout={chunk.layout}
      pageNumber={pageNumber}
      totalPages={totalPages}
    />
  );
}

function buildFullMenuPages(menu: PublicMenuPayload): { pages: MenuBookPage[]; totalContentPages: number } {
  const faceChunks = collectFullMenuFaceChunks(menu.categories);
  const totalContentPages = Math.max(faceChunks.length, 1);
  const sheets = pairBookSides(faceChunks);

  const pages: MenuBookPage[] = [
    {
      id: 'full-menu-cover',
      front: <MenuBookFullMenuCoverFace menu={menu} variant="front" />,
      back: <MenuBookFullMenuCoverFace menu={menu} variant="back" />,
    },
    ...sheets.map((sheet, sheetIndex) => ({
      id: `full-menu-sheet-${sheetIndex}`,
      front: renderContentFace(sheet.front, sheetIndex * 2 + 1, totalContentPages),
      back: renderContentFace(sheet.back, sheetIndex * 2 + 2, totalContentPages),
    })),
  ];

  return { pages, totalContentPages };
}

export default function MenuBookFullMenu({ menu }: MenuBookFullMenuProps) {
  const { pages, totalContentPages } = useMemo(() => buildFullMenuPages(menu), [menu]);

  if (menu.itemCount === 0) {
    return (
      <p className="text-center text-terracotta-700">Our menu is being updated. Please check back shortly.</p>
    );
  }

  return (
    <MenuPageTurner
      bookKey={`full-menu-${menu.itemCount}`}
      pages={pages}
      initialSpread={0}
      getSpreadLabel={(spreadIndex, totalSpreads) => {
        if (spreadIndex === 0) return 'Cover · Full menu';
        const contentIndex = spreadIndex - 1;
        if (contentIndex < totalContentPages) {
          return `Full menu · page ${contentIndex + 1} of ${totalContentPages}`;
        }
        return `Full menu · ${spreadIndex + 1} / ${totalSpreads}`;
      }}
    />
  );
}
