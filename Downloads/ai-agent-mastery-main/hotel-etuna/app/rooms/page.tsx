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

export const metadata: Metadata = {
  title: 'Rooms & Suites',
  description: 'Explore our 5 distinct room types at Hotel Etuna. From comfortable Standard Rooms to luxurious Premier Rooms with private balconies.',
};

const rooms = [
  {
    name: 'Standard Room',
    slug: 'standard-room',
    image: '/images/hospitality/room_standard.jpeg',
    priceFrom: 1200,
    capacity: 2,
    size: '25m²',
    description: 'Comfortable and well-appointed rooms perfect for solo travelers or couples.',
    amenities: ['WiFi', 'Air Conditioning', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk'],
  },
  {
    name: 'Luxury Room',
    slug: 'luxury-room',
    image: '/images/hospitality/room_luxury.jpeg',
    priceFrom: 1800,
    capacity: 2,
    size: '32m²',
    description: 'Enhanced comfort with premium amenities and elegant furnishings.',
    amenities: ['WiFi', 'Air Conditioning', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Sitting Area', 'Bathrobe'],
  },
  {
    name: 'Family Room',
    slug: 'family-room',
    image: '/images/hospitality/room_family.jpeg',
    priceFrom: 2500,
    capacity: 4,
    size: '48m²',
    description: 'Spacious room ideal for families with extra bedding and garden access.',
    amenities: ['WiFi', 'Air Conditioning', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Extra Bedding', 'Garden Access'],
  },
  {
    name: 'Executive Suite',
    slug: 'executive-suite',
    image: '/images/hospitality/room_executive.jpeg',
    priceFrom: 3000,
    capacity: 2,
    size: '42m²',
    description: 'Perfect for business travelers with dedicated workspace and lounge access.',
    amenities: ['WiFi', 'Air Conditioning', 'Work Desk', 'VIP Toiletries', 'Lounge Access', 'Mosquito Net'],
  },
  {
    name: 'Premier Room',
    slug: 'premier-room',
    image: '/images/hospitality/room_premier.jpeg',
    priceFrom: 3800,
    capacity: 2,
    size: '65m²',
    description: 'Our most luxurious offering with private balcony and two bathrooms.',
    amenities: ['WiFi', 'Air Conditioning', 'TV', 'Minibar', 'Coffee/Tea', 'Private Balcony', 'Lounge', '2 Bathrooms', 'Bathrobe'],
  },
];

export default function RoomsPage() {
  return (
    <div className="min-h-screen bg-surface-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-nude-200">
        <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-khaki-600 rounded-full flex items-center justify-center text-white font-display font-bold">
              HE
            </div>
            <div className="flex flex-col">
              <span className="font-display text-lg font-bold text-terracotta-900">Hotel Etuna</span>
              <span className="text-xs text-terracotta-800">Ongwediva, Namibia</span>
            </div>
          </Link>
          
          <Button asChild size="sm">
            <Link href="/">Back to Home</Link>
          </Button>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="py-16 bg-gradient-to-br from-khaki-600 to-terracotta-800 text-white">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-display text-4xl md:text-6xl font-bold mb-6">
              Rooms & Suites
            </h1>
            <p className="text-xl md:text-2xl mb-4 max-w-3xl mx-auto opacity-95">
              Five distinct room types designed for every traveler
            </p>
            <p className="text-white/80 max-w-2xl mx-auto">
              All rooms feature air conditioning, mosquito nets, WiFi, and authentic Namibian touches
            </p>
          </div>
        </section>

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
              {rooms.map((room, idx) => (
                <div
                  key={room.slug}
                  className={`grid md:grid-cols-2 gap-8 items-center ${
                    idx % 2 === 1 ? 'md:grid-flow-dense' : ''
                  }`}
                >
                  {/* Image */}
                  <div className={`${idx % 2 === 1 ? 'md:col-start-2' : ''}`}>
                    <div className="aspect-[4/3] relative rounded-2xl overflow-hidden shadow-card">
                      <Image
                        src={room.image}
                        alt={room.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div className={`${idx % 2 === 1 ? 'md:col-start-1 md:row-start-1' : ''}`}>
                    <h2 className="font-display text-3xl md:text-4xl font-bold text-terracotta-900 mb-3">
                      {room.name}
                    </h2>
                    
                    <div className="flex items-center gap-6 text-sm text-terracotta-800 mb-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-khaki-600" />
                        Up to {room.capacity} guests
                      </div>
                      <div>{room.size}</div>
                    </div>

                    <p className="text-terracotta-800 mb-6 leading-relaxed">
                      {room.description}
                    </p>

                    <div className="grid grid-cols-2 gap-2 mb-6">
                      {room.amenities.map((amenity) => (
                        <div key={amenity} className="flex items-center gap-2 text-sm text-terracotta-800">
                          <Check className="w-4 h-4 text-sage flex-shrink-0" />
                          {amenity}
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-4">
                      <div>
                        <div className="text-3xl font-display font-bold text-khaki-600">
                          NAD {room.priceFrom.toLocaleString()}
                        </div>
                        <div className="text-sm text-terracotta-800">per night</div>
                      </div>
                      <Button asChild size="lg">
                        <Link href={`/rooms/${room.slug}`}>View Details</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-br from-terracotta-800 to-terracotta-900 text-white">
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
    </div>
  );
}
