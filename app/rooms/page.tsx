/**
 * Rooms listing — filmstrip gallery and photo-tour entry points.
 * Location: app/rooms/page.tsx
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { getHubRooms } from '@/lib/data/rooms';
import PublicHero from '@/components/shared/PublicHero';
import Footer from '@/components/shared/Footer';
import NavigationHeader from '@/components/sections/landing/NavigationHeader';
import { Button } from '@/components/ui/Button';
import PublicRoomsBrowseBanner from '@/components/PublicRoomsBrowseBanner';
import RoomsIncludedStrip from '@/components/RoomsIncludedStrip';
import RoomsFilmstrip from '@/components/RoomsFilmstrip';

export const metadata: Metadata = {
  title: 'Rooms & Suites',
  description:
    'Explore five room types at Hotel Etuna with photo tours — from Standard to Premier with lounge and twin bedrooms.',
};

export default async function RoomsPage() {
  const session = await getServerSession(authOptions);
  const isAuthenticated = Boolean(session?.user);
  const roomRows = await getHubRooms();

  return (
    <div className="min-h-screen bg-surface-background">
      <NavigationHeader />

      <main>
        <PublicHero
          title="Rooms & Suites"
          subtitle="Walk through each room in a photo tour before you book."
          breadcrumbLabel="Rooms"
        />

        <PublicRoomsBrowseBanner isAuthenticated={isAuthenticated} />
        <RoomsIncludedStrip />
        <RoomsFilmstrip rooms={roomRows} isAuthenticated={isAuthenticated} />

        <section className="py-16 bg-linear-to-br from-terracotta-800 to-terracotta-900 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Ready to book your stay?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Experience authentic Namibian hospitality at Hotel Etuna
            </p>
            <Button asChild size="xl" className="bg-white text-terracotta-900 hover:bg-nude-100">
              <Link href={isAuthenticated ? '/#booking' : '/login?redirect=/#booking'}>
                Check availability
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
