/**
 * Room Detail Page
 * 
 * Purpose: Detailed view of individual room types with booking CTA
 * Location: app/rooms/[slug]/page.tsx
 */

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Check, Users, Calendar } from 'lucide-react';

const roomsData = {
  standard: {
    name: 'Standard Room',
    priceFrom: 1200,
    capacity: 2,
    size: '25m²',
    description: 'Our Standard Rooms offer comfortable and well-appointed accommodation perfect for solo travelers or couples. Each room is thoughtfully designed with modern amenities while maintaining authentic Namibian character.',
    fullDescription: 'Experience comfort and convenience in our Standard Rooms. These cozy spaces feature a plush queen bed with premium linens, individually controlled air conditioning, and complete mosquito protection. The en-suite bathroom includes a walk-in shower with hot water. Stay connected with complimentary high-speed WiFi and unwind with satellite TV.',
    amenities: ['Queen Bed', 'Air Conditioning', 'Free WiFi', 'Mosquito Net', 'En-suite Bathroom', 'Flat-screen TV', 'Work Desk', 'Mini Safe', 'Hair Dryer', 'Daily Housekeeping'],
    images: [
      '/images/hospitality/room_standard.jpeg',
      '/images/hospitality/room_luxury.jpeg',
      '/images/hospitality/hero_hotel_lobby.jpeg',
    ],
  },
  luxury: {
    name: 'Luxury Room',
    priceFrom: 1800,
    capacity: 2,
    size: '32m²',
    description: 'Enhanced comfort awaits in our Luxury Rooms, featuring premium amenities and elegant furnishings for discerning guests.',
    fullDescription: 'Indulge in our Luxury Rooms, where sophistication meets comfort. The king-size bed ensures restful nights, while the spacious layout includes a dedicated work area perfect for business travelers. The marble bathroom features both a shower and bathtub. Enjoy your private balcony with views of our gardens.',
    amenities: ['King Bed', 'Air Conditioning', 'Mini Bar', 'Bathtub & Shower', 'Work Desk', 'Private Balcony', 'Coffee Machine', 'Premium Toiletries', 'Bathrobe & Slippers', 'Room Service'],
    images: [
      '/images/hospitality/room_luxury.jpeg',
      '/images/hospitality/room_executive.jpeg',
      '/images/hospitality/restaurant_dining.jpeg',
    ],
  },
  family: {
    name: 'Family Suite',
    priceFrom: 2500,
    capacity: 4,
    size: '48m²',
    description: 'Spacious suite ideal for families, featuring separate bedrooms and a comfortable living area for quality time together.',
    fullDescription: 'Our Family Suite provides the perfect home away from home for families. With two separate bedrooms (one with a king bed, one with twin beds), everyone has their space. The living room offers a comfortable seating area with TV, while the kitchenette allows for light meal preparation. Two full bathrooms ensure convenience for all family members.',
    amenities: ['2 Bedrooms', 'Living Room', 'Kitchenette', '2 Bathrooms', 'Free WiFi', '2 TVs', 'Dining Table', 'Microwave & Fridge', 'Family Games', 'Connecting Doors'],
    images: [
      '/images/hospitality/room_family.jpeg',
      '/images/hospitality/room_standard.jpeg',
      '/images/hospitality/hero_hotel_lobby.jpeg',
    ],
  },
  executive: {
    name: 'Executive Suite',
    priceFrom: 3000,
    capacity: 2,
    size: '42m²',
    description: 'Perfect for business travelers, featuring dedicated workspace, lounge area, and all the amenities needed for productive stays.',
    fullDescription: 'Designed for the modern business traveler, our Executive Suite combines work and relaxation seamlessly. The spacious work area includes a large desk, ergonomic chair, and multiple power outlets. After work, unwind in the separate lounge area or on your private balcony. High-speed WiFi and a coffee machine keep you productive.',
    amenities: ['King Bed', 'Executive Work Desk', 'Lounge Area', 'Private Balcony', 'Coffee Machine', 'Safe Box', 'Iron & Board', 'Premium WiFi', 'Printer Access', 'Late Checkout'],
    images: [
      '/images/hospitality/room_executive.jpeg',
      '/images/hospitality/room_premier.jpeg',
      '/images/hospitality/restaurant_dining.jpeg',
    ],
  },
  premier: {
    name: 'Premier Suite',
    priceFrom: 3800,
    capacity: 2,
    size: '65m²',
    description: 'Our most luxurious offering with private pool, butler service, and exclusive amenities for an unforgettable stay.',
    fullDescription: 'Experience the pinnacle of luxury in our Premier Suite. This expansive suite features a master bedroom with king bed, a separate living and dining area, and your own private plunge pool on the terrace. Enjoy personalized butler service, premium minibar, and spa-quality bathroom with rain shower and deep soaking tub. Perfect for special occasions or those seeking the ultimate in comfort.',
    amenities: ['Master Bedroom', 'Private Plunge Pool', 'Butler Service', 'Spa Bathroom', 'Dining Area', 'Premium Minibar', 'Nespresso Machine', 'Premium Sound System', 'Luxury Toiletries', 'Champagne on Arrival'],
    images: [
      '/images/hospitality/room_premier.jpeg',
      '/images/hospitality/room_luxury.jpeg',
      '/images/hospitality/hero_hotel_lobby.jpeg',
    ],
  },
};

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const room = roomsData[params.slug as keyof typeof roomsData];
  
  if (!room) {
    return { title: 'Room Not Found' };
  }

  return {
    title: `${room.name} - Hotel Etuna`,
    description: room.description,
  };
}

export default function RoomDetailPage({ params }: Props) {
  const room = roomsData[params.slug as keyof typeof roomsData];

  if (!room) {
    notFound();
  }

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
            </div>
          </Link>
          
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href="/rooms">All Rooms</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/#booking">Book Now</Link>
            </Button>
          </div>
        </nav>
      </header>

      <main>
        {/* Image Gallery */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="aspect-[4/3] relative rounded-2xl overflow-hidden">
                  <Image src={room.images[0]} alt={room.name} fill className="object-cover" />
                </div>
                <div className="grid grid-rows-2 gap-4">
                  {room.images.slice(1, 3).map((img, idx) => (
                    <div key={idx} className="aspect-[4/3] relative rounded-2xl overflow-hidden">
                      <Image src={img} alt={`${room.name} - View ${idx + 2}`} fill className="object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Room Details */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <h1 className="font-display text-4xl md:text-5xl font-bold text-terracotta-900 mb-4">
                  {room.name}
                </h1>
                
                <div className="flex items-center gap-6 text-terracotta-800 mb-6">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-khaki-600" />
                    Up to {room.capacity} guests
                  </div>
                  <div>{room.size}</div>
                </div>

                <p className="text-lg text-terracotta-800 mb-6 leading-relaxed">
                  {room.description}
                </p>

                <p className="text-terracotta-800 mb-8 leading-relaxed">
                  {room.fullDescription}
                </p>

                <h2 className="font-display text-2xl font-bold text-terracotta-900 mb-4">
                  Room Amenities
                </h2>
                <div className="grid grid-cols-2 gap-3 mb-8">
                  {room.amenities.map((amenity) => (
                    <div key={amenity} className="flex items-center gap-2 text-terracotta-800">
                      <Check className="w-5 h-5 text-sage flex-shrink-0" />
                      {amenity}
                    </div>
                  ))}
                </div>
              </div>

              {/* Booking Card */}
              <div>
                <div className="bg-white rounded-2xl p-6 shadow-card sticky top-24">
                  <div className="mb-6">
                    <div className="text-4xl font-display font-bold text-khaki-600 mb-1">
                      NAD {room.priceFrom.toLocaleString()}
                    </div>
                    <div className="text-terracotta-800">per night</div>
                  </div>

                  <Button asChild size="lg" className="w-full mb-4">
                    <Link href="/#booking">
                      <Calendar className="w-5 h-5" />
                      Book This Room
                    </Link>
                  </Button>

                  <div className="text-xs text-center text-terracotta-800">
                    Best rate guaranteed when booking direct
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
