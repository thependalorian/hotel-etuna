/**
 * Public table digital menu — the target of a restaurant table QR code.
 * Location: app/t/[qr]/page.tsx
 *
 * A guest scans the QR printed on their table and lands here: a focused, mobile-first
 * digital menu identifying their table, with the image-rich public menu and a clear
 * "call to order" affordance (public ordering requires staff auth, so we route guests
 * to a phone call / their server rather than a half-built checkout).
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { Phone, Clock, UtensilsCrossed } from 'lucide-react';
import { notFound } from 'next/navigation';

import { HotelEtunaLogo } from '@/components/brand/HotelEtunaLogo';
import { MenuDisplay } from '@/components/dining/MenuDisplay';
import Footer from '@/components/shared/Footer';
import { TableService } from '@/lib/services/restaurant/TableService';
import { getCompleteMenuForProperty } from '@/lib/data/dining';
import { serializePublicMenu } from '@/lib/dining/serialize-public-menu';
import { getCachedPopularMenuItemIds } from '@/lib/services/menu/MenuPopularityService';
import { resolvePublicHubProperty } from '@/lib/utils/public-property';
import { restaurantHoursSummary } from '@/lib/dining/restaurant-hours';
import { ETUNA_PROPERTY_IMAGES } from '@/lib/rooms/property-images';
import { brand } from '@/lib/copy/brand';

export const metadata: Metadata = {
  title: 'Menu · Hotel Etuna Restaurant',
  description: 'Browse the Hotel Etuna restaurant menu from your table.',
  robots: { index: false, follow: false },
};

const ORDER_TEL = '+264652311177';

const tableService = new TableService();

export default async function TableMenuPage({ params }: { params: Promise<{ qr: string }> }) {
  const { qr } = await params;

  const table = await tableService.getTableByQrCode(qr).catch(() => null);
  if (!table || !table.propertyId) {
    notFound();
  }

  const { hubTenant } = await resolvePublicHubProperty();
  const { restaurant, categories, itemsByCategory } = await getCompleteMenuForProperty(
    table.propertyId,
  );

  const featuredMenuItemIds = await getCachedPopularMenuItemIds(
    hubTenant.id,
    table.propertyId,
    restaurant?.id ?? undefined,
  );

  const publicMenu = serializePublicMenu(categories, itemsByCategory, { featuredMenuItemIds });
  const menuData = {
    ...publicMenu,
    featuredMenuItemIds,
    restaurantName: restaurant?.name || 'Etuna Restaurant',
  };

  const tableLabel = table.tableName
    ? `Table ${table.tableNumber} · ${table.tableName}`
    : `Table ${table.tableNumber}`;

  return (
    <div className="min-h-screen bg-surface-background">
      {/* Slim branded bar — focused for a guest scanning at the table */}
      <header className="sticky top-0 z-30 border-b border-nude-200 bg-surface-elevated/95 backdrop-blur supports-[backdrop-filter]:bg-surface-elevated/80">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <HotelEtunaLogo size="sm" variant="compact" href="/" />
          <span className="inline-flex items-center gap-1.5 rounded-etuna-pill bg-ci-cream px-3 py-1 text-xs font-semibold text-ci-primary">
            <UtensilsCrossed className="h-3.5 w-3.5" aria-hidden />
            Digital menu
          </span>
        </div>
      </header>

      <main className="pb-28">
        {/* Table identity hero with scrim over a food image */}
        <section className="relative h-52 overflow-hidden md:h-64">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${ETUNA_PROPERTY_IMAGES.outdoorDining}')` }}
          />
          <div className="etuna-card-scrim absolute inset-0" />
          <div className="etuna-on-image relative z-10 flex h-full flex-col justify-end px-4 pb-6 container mx-auto">
            <p className="text-sm font-medium opacity-90">{menuData.restaurantName}</p>
            <h1 className="font-display text-3xl font-bold md:text-4xl">{tableLabel}</h1>
            {table.location ? (
              <p className="mt-1 text-sm opacity-90">{table.location}</p>
            ) : null}
          </div>
        </section>

        {/* Welcome + how to order */}
        <section className="container mx-auto px-4 py-6">
          <div className="rounded-etuna-card border border-nude-200 bg-surface-elevated p-5">
            <p className="text-ink-700">
              Welcome to {brand.name}. Browse the full menu below — prices are in Namibian Dollars
              (N$). When you&apos;re ready, call us or let your server know your table number.
            </p>
            <div className="mt-4 flex flex-col gap-2 text-sm text-ink-600">
              <span className="inline-flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0 text-ci-accent-sage" aria-hidden />
                {restaurantHoursSummary}
              </span>
            </div>
          </div>
        </section>

        {/* The image-rich public menu */}
        <section className="container mx-auto px-4 pb-8">
          {menuData.categories.length > 0 ? (
            <MenuDisplay menu={menuData} />
          ) : (
            <div className="rounded-etuna-card border border-nude-200 bg-surface-elevated p-8 text-center">
              <p className="text-ink-700">
                Our menu is being updated. Please ask your server for today&apos;s offering.
              </p>
              <Link
                href="/dining"
                className="mt-4 inline-block rounded-full px-6 py-2 text-sm font-semibold text-ci-primary hover:underline"
              >
                View dining page
              </Link>
            </div>
          )}
        </section>
      </main>

      {/* Sticky "call to order" bar — best-practice dine-in affordance on mobile */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-nude-200 bg-surface-elevated/95 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink-900">{tableLabel}</p>
            <p className="truncate text-xs text-ink-600">Ready to order?</p>
          </div>
          <a
            href={`tel:${ORDER_TEL}`}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-ci-primary px-6 py-2.5 text-sm font-semibold text-ci-cream shadow-etuna-control transition-colors hover:bg-ci-secondary-chocolate"
          >
            <Phone className="h-4 w-4" aria-hidden />
            Call to order
          </a>
        </div>
      </div>

      <Footer />
    </div>
  );
}
