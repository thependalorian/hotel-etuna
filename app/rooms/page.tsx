/**
 * Rooms listing — filmstrip gallery and photo-tour entry points.
 * Location: app/rooms/page.tsx
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { getHubRoomTypeCatalog } from '@/lib/data/room-type-catalog';
import PublicHero from '@/components/shared/PublicHero';
import Footer from '@/components/shared/Footer';
import NavigationHeader from '@/components/sections/landing/NavigationHeader';
import { Button } from '@/components/ui/Button';
import PublicRoomsBrowseBanner from '@/components/features/rooms/PublicRoomsBrowseBanner';
import PublicRoomsSignedInBanner from '@/components/features/rooms/PublicRoomsSignedInBanner';
import { publicCopy } from '@/lib/copy/public';
import RoomsIncludedStrip from '@/components/features/rooms/RoomsIncludedStrip';
import RoomsFilmstrip from '@/components/features/rooms/RoomsFilmstrip';
import { RoomsBookRedirect } from '@/components/features/rooms/RoomsBookRedirect';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Rooms & Suites',
  description:
    'Explore five room types at Hotel Etuna with photo tours — from Standard to Premier with lounge and twin bedrooms.',
};

export default async function RoomsPage() {
  const session = await getServerSession(authOptions);
  const isAuthenticated = Boolean(session?.user);
  const roomRows = await getHubRoomTypeCatalog();
  const firstTourSlug = roomRows[0]?.slug ?? 'standard-room-type-a';

  return (
    <div className="min-h-screen bg-surface-background">
      <NavigationHeader />
      <Suspense fallback={null}>
        <RoomsBookRedirect />
      </Suspense>

      <main>
        <PublicHero
          title="Rooms & Suites"
          subtitle="Walk through each room in a photo tour before you book."
          breadcrumbLabel="Rooms"
        />

        <PublicRoomsBrowseBanner isAuthenticated={isAuthenticated} />
        <RoomsIncludedStrip />
        <RoomsFilmstrip rooms={roomRows} isAuthenticated={isAuthenticated} />

        <section className="py-12 sm:py-16 bg-linear-to-br from-terracotta-800 to-terracotta-900 text-white">
          <div className="container mx-auto px-4 sm:px-6 text-center">
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              Ready to book your stay?
            </h2>
            <p className="text-base sm:text-xl text-white/90 mb-8 max-w-2xl mx-auto px-2">
              Experience authentic Namibian hospitality at Hotel Etuna
            </p>
            <Button asChild size="xl" className="bg-white text-terracotta-900 hover:bg-nude-100">
              <Link
                href={
                  isAuthenticated
                    ? `/rooms/${firstTourSlug}#booking`
                    : '/login?redirect=/rooms'
                }
              >
                {isAuthenticated
                  ? publicCopy.ctas.completeYourBooking
                  : publicCopy.gated.viewPricesAndBook}
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
