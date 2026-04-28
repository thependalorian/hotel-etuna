/**
 * Rooms Listing Page
 * 
 * Purpose: Display all Hotel Etuna room types with filtering and booking options
 * Location: app/rooms/page.tsx
 */

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Check, Users, Wifi, Coffee, Wind } from 'lucide-react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { getHubRooms } from '@/lib/data/rooms';
import PublicHero from '@/components/shared/PublicHero';
import Footer from '@/components/shared/Footer';
import NavigationHeader from '@/components/sections/landing/NavigationHeader';

export const metadata: Metadata = {
  title: 'Rooms & Suites',
  description: 'Explore our 5 distinct room types at Hotel Etuna. From comfortable Standard Rooms to luxurious Premier Rooms with private balconies.',
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
          subtitle="Five distinct room types designed for every traveler."
          breadcrumbLabel="Rooms"
        />

        {/* All Rooms Include */}
        <section className="py-12 bg-nude-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="font-display text-2xl font-bold text-terracotta-900 mb-6 text-center">
                All Rooms Include
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { icon: Wind, label: 'Air Conditioning' },
                  { icon: Wifi, label: 'Free WiFi' },
                  { icon: Coffee, label: 'Daily Housekeeping' },
                  { icon: Users, label: 'Mosquito Nets' },
                ].map((item) => (
                  <div key={item.label} className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-sage/20 rounded-full flex items-center justify-center mb-2">
                      <item.icon className="w-6 h-6 text-sage" />
                    </div>
                    <span className="text-sm text-terracotta-800 font-medium">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Rooms Grid */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="space-y-12 max-w-6xl mx-auto">
              {roomRows.map((room, idx) => (
                <div
                  key={room.id}
                  className={`grid md:grid-cols-2 gap-8 items-center ${
                    idx % 2 === 1 ? 'md:grid-flow-dense' : ''
                  }`}
                >
                  {/* Image */}
                  <div className={`${idx % 2 === 1 ? 'md:col-start-2' : ''}`}>
                    <div className="aspect-4/3 relative rounded-2xl overflow-hidden shadow-card">
                      <Image
                        src={room.images?.[0] ?? '/images/hospitality/hero_hotel_lobby.jpeg'}
                        alt={room.roomType}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div className={`${idx % 2 === 1 ? 'md:col-start-1 md:row-start-1' : ''}`}>
                    <h2 className="font-display text-3xl md:text-4xl font-bold text-terracotta-900 mb-3">
                      {room.roomType}
                    </h2>
                    
                    <div className="flex items-center gap-6 text-sm text-terracotta-800 mb-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-khaki-600" />
                        Up to {room.maxOccupancy ?? 2} guests
                      </div>
                    </div>

                    <p className="text-terracotta-800 mb-6 leading-relaxed">
                      Comfortable and well-appointed accommodation with authentic Namibian hospitality.
                    </p>

                    <div className="grid grid-cols-2 gap-2 mb-6">
                      {(room.amenities ?? []).map((amenity) => (
                        <div key={amenity} className="flex items-center gap-2 text-sm text-terracotta-800">
                          <Check className="w-4 h-4 text-sage shrink-0" />
                          {amenity}
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-4">
                      <div>
                        {isAuthenticated ? (() => {
                          const amount = room.priceFrom;
                          const currency = room.currency;
                          if (amount === null || Number.isNaN(Number(amount))) {
                            return <div className="text-2xl font-display font-bold text-khaki-600">Price on request</div>;
                          }
                          return (
                        <div className="text-3xl font-display font-bold text-khaki-600">
                              {currency} {Number(amount).toLocaleString()}
                        </div>
                          );
                        })() : <div className="text-2xl font-display font-bold text-khaki-600">Sign in to view rates</div>}
                        <div className="text-sm text-terracotta-800">per night</div>
                      </div>
                      <Button asChild size="lg">
                        <Link href={isAuthenticated ? `/rooms/${room.slug}` : `/login?redirect=/rooms/${room.slug}`}>
                          {isAuthenticated ? 'View Details' : 'Sign In to View Prices & Book'}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-linear-to-br from-terracotta-800 to-terracotta-900 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Ready to Book Your Stay?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Experience authentic Namibian hospitality at Hotel Etuna
            </p>
            <Button asChild size="xl" className="bg-white text-terracotta-900 hover:bg-nude-100">
              <Link href="/#booking">Check Availability</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
