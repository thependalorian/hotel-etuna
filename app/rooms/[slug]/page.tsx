/**
 * Room detail — photo tour, highlights, and booking card.
 * Location: app/rooms/[slug]/page.tsx
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { Check, Users } from 'lucide-react';
import { authOptions } from '@/lib/auth/config';
import { getRoomBySlug } from '@/lib/data/rooms';
import { getPublicRoomDisplay } from '@/lib/rooms/room-display';
import { LandingBookingWidget } from '@/components/sections/landing/LandingBookingWidget';
import { resolvePublicHubProperty } from '@/lib/utils/public-property';
import PublicHero from '@/components/shared/PublicHero';
import Footer from '@/components/shared/Footer';
import NavigationHeader from '@/components/sections/landing/NavigationHeader';
import RoomPhotoTour from '@/components/RoomPhotoTour';
import RoomBookingCard from '@/components/RoomBookingCard';

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const room = await getRoomBySlug(params.slug);
  if (!room) return { title: 'Room Not Found' };
  const display = getPublicRoomDisplay(room);
  return {
    title: `${room.roomType} - Hotel Etuna`,
    description: display.summary,
  };
}

export default async function RoomDetailPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  const isAuthenticated = Boolean(session?.user);
  const room = await getRoomBySlug(params.slug);
  if (!room) notFound();

  const display = getPublicRoomDisplay(room);
  const { property } = await resolvePublicHubProperty();
  const amenityList = [
    ...new Set([...(room.amenities ?? []), ...display.highlights]),
  ];

  return (
    <div className="min-h-screen bg-surface-background">
      <NavigationHeader />
      <PublicHero
        title={room.roomType}
        subtitle={display.summary}
        breadcrumbLabel="Room details"
      />

      <main className="py-8">
        <div className="container mx-auto px-4">
          <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
            <div className="md:col-span-2 space-y-8">
              <RoomPhotoTour roomName={room.roomType} stops={display.tourStops} />

              <div>
                <div className="mb-4 flex flex-wrap items-center gap-4 text-sm text-terracotta-800">
                  <span className="inline-flex items-center gap-2">
                    <Users className="h-4 w-4 text-khaki-600" aria-hidden />
                    Up to {display.displayOccupancy} guests
                  </span>
                  <span className="badge badge-sm border-0 bg-khaki-600/10 text-khaki-800">
                    {display.tourStops.length} photo stops
                  </span>
                </div>

                <div className="mb-6 border-l-4 border-rustic pl-4">
                  <p className="leading-relaxed text-terracotta-800">{display.summary}</p>
                </div>

                <h2 className="mb-4 font-display text-2xl font-bold text-terracotta-900">
                  Highlights & amenities
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {amenityList.map((amenity) => (
                    <div key={amenity} className="flex items-center gap-2 text-terracotta-800">
                      <Check className="h-4 w-4 shrink-0 text-sage" aria-hidden />
                      {amenity}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-card">
                <h2 className="mb-4 font-display text-2xl font-bold text-terracotta-900">
                  Check availability
                </h2>
                {isAuthenticated ? (
                  <LandingBookingWidget propertyId={property.id} />
                ) : (
                  <p className="text-sm text-terracotta-800">
                    <Link href={`/login?redirect=/rooms/${params.slug}`} className="link link-primary">
                      Sign in
                    </Link>{' '}
                    to check live availability and rates for your dates.
                  </p>
                )}
              </div>
            </div>

            <div>
              <RoomBookingCard
                room={room}
                display={display}
                slug={params.slug}
                isAuthenticated={isAuthenticated}
              />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
