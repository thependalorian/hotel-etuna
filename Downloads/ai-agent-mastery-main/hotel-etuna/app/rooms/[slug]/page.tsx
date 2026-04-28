import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { Button } from '@/components/ui/Button';
import { Calendar, Check, Users } from 'lucide-react';
import { authOptions } from '@/lib/auth/config';
import { getRoomBySlug } from '@/lib/data/rooms';
import { LandingBookingWidget } from '@/components/sections/landing/LandingBookingWidget';
import { resolvePublicHubProperty } from '@/lib/utils/public-property';
import PublicHero from '@/components/shared/PublicHero';
import Footer from '@/components/shared/Footer';

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const room = await getRoomBySlug(params.slug);
  if (!room) return { title: 'Room Not Found' };
  return {
    title: `${room.roomType} - Hotel Etuna`,
    description: `Explore ${room.roomType} at Hotel Etuna.`,
  };
}

export default async function RoomDetailPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  const isAuthenticated = Boolean(session?.user);
  const room = await getRoomBySlug(params.slug);
  if (!room) notFound();

  const { property } = await resolvePublicHubProperty();

  return (
    <div className="min-h-screen bg-surface-background">
      <PublicHero title={room.roomType} subtitle="Comfort, warmth, and authentic Namibian hospitality." breadcrumbLabel="Room Details" />

      <main className="py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="aspect-4/3 relative rounded-2xl overflow-hidden">
                  <Image src={room.images[0] ?? '/images/hospitality/hero_hotel_lobby.jpeg'} alt={room.roomType} fill className="object-cover" />
                </div>
                <div className="grid grid-rows-2 gap-4">
                  {(room.images.slice(1, 3).length ? room.images.slice(1, 3) : [room.images[0] ?? '/images/hospitality/hero_hotel_lobby.jpeg', '/images/hospitality/restaurant_dining.jpeg']).map((image, idx) => (
                    <div key={`${image}-${idx}`} className="aspect-4/3 relative rounded-2xl overflow-hidden">
                      <Image src={image} alt={`${room.roomType} ${idx + 2}`} fill className="object-cover" />
                    </div>
                  ))}
                </div>
              </div>

              <h2 className="font-display text-3xl font-bold text-terracotta-900 mb-4">{room.roomType}</h2>
              <div className="flex items-center gap-2 text-terracotta-800 mb-6">
                <Users className="w-4 h-4 text-khaki-600" />
                Up to {room.maxOccupancy} guests
              </div>

              <div className="border-l-4 border-rustic pl-4 mb-6">
                <p className="text-terracotta-800">
                  Spacious room with curated amenities and a peaceful setting for business or leisure stays.
                </p>
              </div>

              <h3 className="font-display text-2xl font-bold text-terracotta-900 mb-4">Room Amenities</h3>
              <div className="grid grid-cols-2 gap-3 mb-8">
                {room.amenities.map((amenity) => (
                  <div key={amenity} className="flex items-center gap-2 text-terracotta-800">
                    <Check className="w-4 h-4 text-sage shrink-0" />
                    {amenity}
                  </div>
                ))}
              </div>

              <div className="rounded-2xl bg-white shadow-card p-6">
                <h3 className="font-display text-2xl font-bold text-terracotta-900 mb-4">Check Availability</h3>
                <LandingBookingWidget propertyId={property.id} />
              </div>
            </div>

            <div>
              <div className="bg-white rounded-2xl p-6 shadow-card sticky top-24">
                <div className="mb-6">
                  <div className="text-4xl font-display font-bold text-khaki-600 mb-1">
                    {isAuthenticated
                      ? room.priceAmount !== null
                        ? `${room.currency} ${room.priceAmount.toLocaleString()}`
                        : 'Price on request'
                      : 'Sign in to view rates'}
                  </div>
                  <div className="text-terracotta-800">per night</div>
                </div>

                {isAuthenticated ? (
                  <Button asChild size="lg" className="w-full mb-3 hover:bg-rustic">
                    <Link href="/#booking">
                      <Calendar className="w-5 h-5" />
                      Complete Booking
                    </Link>
                  </Button>
                ) : (
                  <div className="rounded-lg border border-khaki-600/30 bg-khaki-50 p-4">
                    <p className="text-sm text-terracotta-900 mb-3">
                      Great news! This room is available for your dates. Sign in or create an account to see rates and confirm booking.
                    </p>
                    <div className="flex gap-2">
                      <Button asChild size="sm" className="flex-1">
                        <Link href={`/login?redirect=/rooms/${params.slug}`}>Sign In</Link>
                      </Button>
                      <Button asChild size="sm" variant="outline" className="flex-1">
                        <Link href={`/register?redirect=/rooms/${params.slug}`}>Sign Up</Link>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
