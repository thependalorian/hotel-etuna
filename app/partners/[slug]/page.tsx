/**
 * Partner Property Detail Page
 * 
 * Purpose: Display individual partner property details (no Sofia AI widget, simple contact form)
 * Location: app/partners/[slug]/page.tsx
 */

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { 
  MapPin, 
  Star, 
  Phone, 
  Mail, 
  Wifi,
  Coffee,
  Car,
  Home,
  Calendar,
  Check
} from 'lucide-react';

// This would come from your database in production
const partners = {
  jayla: {
    name: 'Jayla Accommodation',
    tagline: 'Your home away from home',
    description: 'Nestled in a quiet neighborhood of Windhoek, Jayla Accommodation offers a warm, family-friendly atmosphere with personalized service. Our 10 well-appointed rooms provide comfort and convenience for both business and leisure travelers.',
    fullDescription: `Jayla Accommodation has been welcoming guests since 2015, building a reputation for exceptional hospitality and attention to detail. Each room is individually decorated with local art and modern amenities, creating a unique blend of Namibian charm and contemporary comfort.

Our property features a beautiful garden area perfect for relaxation, secure parking, and a communal lounge where guests can socialize or work. We pride ourselves on our home-cooked breakfast featuring both traditional and continental options.`,
    location: {
      address: '45 Garden Street, Windhoek, Namibia',
      city: 'Windhoek',
      coordinates: { lat: -22.5609, lng: 17.0658 },
    },
    contact: {
      phone: '+264 61 234 567',
      email: 'info@jaylaaccommodation.com',
      whatsapp: '+264 81 234 5678',
    },
    images: [
      '/images/hospitality/partner_jayla.jpeg',
      '/images/hospitality/room_standard.jpeg',
      '/images/hospitality/restaurant_dining.jpeg',
    ],
    rating: 8.5,
    reviewCount: 127,
    roomCount: 10,
    priceFrom: 800,
    amenities: [
      { icon: Wifi, label: 'Free WiFi' },
      { icon: Coffee, label: 'Breakfast Included' },
      { icon: Car, label: 'Free Parking' },
      { icon: Home, label: 'Garden Area' },
    ],
    rooms: [
      {
        name: 'Standard Room',
        price: 800,
        features: ['Queen Bed', 'En-suite Bathroom', 'WiFi', 'TV'],
      },
      {
        name: 'Deluxe Room',
        price: 1200,
        features: ['King Bed', 'Mini Fridge', 'Workspace', 'Garden View'],
      },
    ],
  },
  aquarius: {
    name: 'Aquarius Windhoek',
    tagline: 'Modern apartments for extended stays',
    description: 'Aquarius Windhoek offers 20 modern, self-catering apartments perfect for families and extended stays. Each unit features a fully equipped kitchenette, spacious living areas, and access to excellent facilities including a pool and laundry.',
    fullDescription: `Located in central Windhoek, Aquarius Windhoek provides the perfect balance of hotel services and home comforts. Our apartments are ideal for business travelers on extended assignments, families exploring Namibia, or anyone seeking the flexibility of self-catering accommodation.

Each apartment is equipped with modern appliances, comfortable furnishings, and thoughtful touches that make you feel at home. Weekly rates are available, and our friendly staff are always on hand to assist with local recommendations and bookings.`,
    location: {
      address: '12 Independence Avenue, Windhoek, Namibia',
      city: 'Windhoek',
      coordinates: { lat: -22.5700, lng: 17.0836 },
    },
    contact: {
      phone: '+264 61 345 678',
      email: 'reservations@aquariuswhk.com',
      whatsapp: '+264 81 345 6789',
    },
    images: [
      '/images/hospitality/partner_aquarius.jpeg',
      '/images/hospitality/room_luxury.jpeg',
      '/images/hospitality/room_family.jpeg',
    ],
    rating: 8.8,
    reviewCount: 243,
    roomCount: 20,
    priceFrom: 1200,
    amenities: [
      { icon: Wifi, label: 'High-Speed WiFi' },
      { icon: Coffee, label: 'Kitchenette' },
      { icon: Car, label: 'Secure Parking' },
      { icon: Home, label: 'Pool Access' },
    ],
    rooms: [
      {
        name: 'Studio Apartment',
        price: 1200,
        features: ['Queen Bed', 'Kitchenette', 'Living Area', 'Balcony'],
      },
      {
        name: '2-Bedroom Apartment',
        price: 2200,
        features: ['2 Bedrooms', 'Full Kitchen', 'Dining Area', 'Laundry'],
      },
    ],
  },
};

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const partner = partners[params.slug as keyof typeof partners];
  
  if (!partner) {
    return {
      title: 'Partner Not Found',
    };
  }

  return {
    title: `${partner.name} - Hotel Etuna Partners`,
    description: partner.description,
  };
}

export default function PartnerDetailPage({ params }: Props) {
  const partner = partners[params.slug as keyof typeof partners];

  if (!partner) {
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
              <span className="text-xs text-terracotta-800">Partner Network</span>
            </div>
          </Link>
          
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href="/partners">All Partners</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/">Hotel Etuna</Link>
            </Button>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero Section with Gallery */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm text-terracotta-800 mb-6">
                <Link href="/" className="hover:text-khaki-600">Home</Link>
                <span>/</span>
                <Link href="/partners" className="hover:text-khaki-600">Partners</Link>
                <span>/</span>
                <span className="text-terracotta-900 font-medium">{partner.name}</span>
              </div>

              {/* Title & Rating */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div>
                  <h1 className="font-display text-4xl md:text-5xl font-bold text-terracotta-900 mb-2">
                    {partner.name}
                  </h1>
                  <p className="text-xl text-khaki-600 font-signature">{partner.tagline}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="bg-sage/20 px-4 py-2 rounded-full flex items-center gap-2">
                    <Star className="w-5 h-5 fill-sage text-sage" />
                    <span className="font-bold text-lg text-terracotta-900">{partner.rating}</span>
                    <span className="text-sm text-terracotta-800">({partner.reviewCount} reviews)</span>
                  </div>
                </div>
              </div>

              {/* Image Gallery */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="md:col-span-2 aspect-[16/9] relative rounded-2xl overflow-hidden">
                  <Image
                    src={partner.images[0]}
                    alt={partner.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="grid grid-rows-2 gap-4">
                  {partner.images.slice(1, 3).map((img, idx) => (
                    <div key={idx} className="aspect-[16/9] relative rounded-2xl overflow-hidden">
                      <Image
                        src={img}
                        alt={`${partner.name} - View ${idx + 2}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
              {/* Left Column - Details */}
              <div className="md:col-span-2 space-y-8">
                {/* About */}
                <div className="bg-white rounded-2xl p-8 shadow-card">
                  <h2 className="font-display text-3xl font-bold text-terracotta-900 mb-4">
                    About This Property
                  </h2>
                  <p className="text-terracotta-800 mb-4 leading-relaxed">
                    {partner.description}
                  </p>
                  <p className="text-terracotta-800 leading-relaxed whitespace-pre-line">
                    {partner.fullDescription}
                  </p>
                </div>

                {/* Amenities */}
                <div className="bg-white rounded-2xl p-8 shadow-card">
                  <h2 className="font-display text-3xl font-bold text-terracotta-900 mb-6">
                    Amenities & Facilities
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    {partner.amenities.map((amenity, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-terracotta-800">
                        <div className="w-10 h-10 bg-sage/20 rounded-full flex items-center justify-center">
                          <amenity.icon className="w-5 h-5 text-sage" />
                        </div>
                        <span className="font-medium">{amenity.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Room Types */}
                <div className="bg-white rounded-2xl p-8 shadow-card">
                  <h2 className="font-display text-3xl font-bold text-terracotta-900 mb-6">
                    Available Rooms
                  </h2>
                  <div className="space-y-4">
                    {partner.rooms.map((room, idx) => (
                      <div key={idx} className="border border-nude-200 rounded-xl p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-display text-xl font-bold text-terracotta-900 mb-2">
                              {room.name}
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                              {room.features.map((feature) => (
                                <div key={feature} className="flex items-center gap-2 text-sm text-terracotta-800">
                                  <Check className="w-4 h-4 text-sage" />
                                  {feature}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-display font-bold text-khaki-600">
                              NAD {room.price.toLocaleString()}
                            </div>
                            <div className="text-sm text-terracotta-800">per night</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column - Booking/Contact Card */}
              <div>
                <div className="bg-white rounded-2xl p-6 shadow-card sticky top-24">
                  <div className="mb-6">
                    <div className="text-3xl font-display font-bold text-khaki-600 mb-1">
                      From NAD {partner.priceFrom.toLocaleString()}
                    </div>
                    <div className="text-sm text-terracotta-800">per night</div>
                  </div>

                  {/* Contact Form (No Sofia AI) */}
                  <div className="space-y-4 mb-6">
                    <h3 className="font-semibold text-terracotta-900 text-lg">Contact Property</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-terracotta-900 mb-2">
                        Check-in Date
                      </label>
                      <input
                        type="date"
                        className="w-full px-4 py-3 rounded-lg border border-nude-300 focus:ring-2 focus:ring-khaki-600 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-terracotta-900 mb-2">
                        Check-out Date
                      </label>
                      <input
                        type="date"
                        className="w-full px-4 py-3 rounded-lg border border-nude-300 focus:ring-2 focus:ring-khaki-600 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-terracotta-900 mb-2">
                        Guests
                      </label>
                      <select className="w-full px-4 py-3 rounded-lg border border-nude-300 focus:ring-2 focus:ring-khaki-600 focus:border-transparent">
                        <option>1 Guest</option>
                        <option>2 Guests</option>
                        <option>3 Guests</option>
                        <option>4+ Guests</option>
                      </select>
                    </div>

                    <Button size="lg" className="w-full">
                      <Calendar className="w-5 h-5" />
                      Request Availability
                    </Button>
                  </div>

                  {/* Direct Contact Info */}
                  <div className="border-t border-nude-200 pt-6 space-y-4">
                    <h3 className="font-semibold text-terracotta-900">Or Contact Directly</h3>
                    
                    <a 
                      href={`tel:${partner.contact.phone}`}
                      className="flex items-center gap-3 text-terracotta-800 hover:text-khaki-600 transition-colors"
                    >
                      <Phone className="w-5 h-5" />
                      <span>{partner.contact.phone}</span>
                    </a>

                    <a 
                      href={`mailto:${partner.contact.email}`}
                      className="flex items-center gap-3 text-terracotta-800 hover:text-khaki-600 transition-colors"
                    >
                      <Mail className="w-5 h-5" />
                      <span className="text-sm">{partner.contact.email}</span>
                    </a>

                    <div className="flex items-start gap-3 text-terracotta-800">
                      <MapPin className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm">{partner.location.address}</span>
                    </div>
                  </div>

                  {/* Partner Badge */}
                  <div className="border-t border-nude-200 pt-6 mt-6">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 bg-khaki-600 rounded-full flex items-center justify-center text-white font-display font-bold text-xs">
                        HE
                      </div>
                      <div>
                        <div className="font-semibold text-terracotta-900">Hotel Etuna Partner</div>
                        <div className="text-xs text-terracotta-800">Verified & Trusted</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Location Map Placeholder */}
        <section className="py-12 bg-nude-50">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="font-display text-3xl font-bold text-terracotta-900 mb-6">
                Location
              </h2>
              <div className="bg-nude-200 rounded-2xl h-[400px] flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-terracotta-800 mx-auto mb-3" />
                  <p className="text-terracotta-800 font-medium">{partner.location.address}</p>
                  <p className="text-sm text-terracotta-800 mt-2">Map integration coming soon</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
