/**
 * Partner Property Detail Page
 * 
 * Purpose: Display individual partner property details (no Sofia AI widget, contact form only)
 * Location: app/partners/[slug]/page.tsx
 */

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { Button } from '@/components/ui/Button';
import { PartnerAvailabilityWidget } from '@/components/partners/PartnerAvailabilityWidget';
import { 
  MapPin, 
  Star, 
  Phone, 
  Mail, 
  Wifi,
  Calendar,
  Check,
  BadgeCheck
} from 'lucide-react';
import { authOptions } from '@/lib/auth/config';
import PublicHero from '@/components/shared/PublicHero';
import Footer from '@/components/shared/Footer';
import NavigationHeader from '@/components/sections/landing/NavigationHeader';

interface PartnerProperty {
  property: {
    id: string;
    name: string;
    slug: string;
    description: string;
    address: {
      street: string;
      city: string;
      state: string;
      country: string;
      coordinates: { lat: number; lng: number } | null;
    };
    contact: {
      phone: string;
      email: string;
      website: string | null;
    };
    checkInTime: string;
    checkOutTime: string;
    currency: string;
    images: string[];
    amenities: string[];
    type: string;
    tenantId: string;
    tenantName: string;
  };
  rooms: Array<{
    id: string;
    name: string;
    description: string;
    type: string;
    capacity: number;
    pricePerNight: number;
    currency: string;
    images: string[];
    amenities: string[];
    available: boolean;
    quantityAvailable: number;
  }>;
}

async function getPartnerProperty(slug: string): Promise<PartnerProperty | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/partners/${slug}`, {
      cache: 'no-store', // Always fetch fresh data for partner pages
    });

    if (!res.ok) {
      return null;
    }

    return res.json();
  } catch (error) {
    console.error('Error fetching partner property:', error);
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPartnerProperty(slug);
  
  if (!data) {
    return {
      title: 'Partner Not Found | Hotel Etuna',
    };
  }

  return {
    title: `${data.property.name} - Hotel Etuna Referral Partner`,
    description: data.property.description,
  };
}

export default async function PartnerPropertyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await getServerSession(authOptions);
  const isAuthenticated = Boolean(session?.user);
  const { slug } = await params;
  const data = await getPartnerProperty(slug);

  if (!data) {
    notFound();
  }

  const { property, rooms } = data;
  const hasImages = property.images && property.images.length > 0;
  const primaryImage = hasImages ? property.images[0] : '/images/hospitality/hero_hotel_lobby.jpeg';

  return (
    <div className="min-h-screen bg-white">
      <NavigationHeader />
      <PublicHero
        title={property.name}
        subtitle={`${property.address.city}, ${property.address.country} · ${property.type.replace('_', ' ')}`}
        backgroundImage={primaryImage}
        breadcrumbLabel="Partner Details"
      />

      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Description */}
            <section className="mb-12">
              <h2 className="font-display text-3xl text-terracotta-800 mb-4">
                About This Property
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                {property.description}
              </p>
            </section>

            {/* Amenities */}
            {property.amenities && property.amenities.length > 0 && (
              <section className="mb-12">
                <h2 className="font-display text-3xl text-terracotta-800 mb-6">
                  Amenities
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {property.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-khaki-600 shrink-0" />
                      <span className="text-gray-700">{amenity}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Available Rooms */}
            <section className="mb-12">
              <h2 className="font-display text-3xl text-terracotta-800 mb-6">
                Available Rooms
              </h2>
              {rooms.length === 0 ? (
                <p className="text-gray-600">No rooms currently available. Please contact the property directly.</p>
              ) : (
                <div className="space-y-6">
                  {rooms.map((room) => (
                    <div
                      key={room.id}
                      className="border border-gray-200 rounded-xl p-6 hover:border-khaki-600 transition-colors"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-display text-xl text-terracotta-800 mb-2">
                            {room.type}
                          </h3>
                          <p className="text-gray-600 mb-3">{room.description}</p>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {room.amenities.map((amenity, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 bg-khaki-sand/20 text-terracotta-800 rounded-full text-sm"
                              >
                                {amenity}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>Max {room.capacity} guests</span>
                            {room.available ? (
                              <span className="text-green-600 font-medium">Available</span>
                            ) : (
                              <span className="text-red-600 font-medium">Fully Booked</span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="text-right">
                            <div className="text-3xl font-bold text-terracotta-800">
                              {isAuthenticated ? `${property.currency} ${room.pricePerNight}` : 'Sign in to view rates'}
                            </div>
                            <div className="text-sm text-gray-600">per night</div>
                          </div>
                          <Button asChild variant="primary" size="md">
                            <Link href={isAuthenticated ? `/partners/${slug}` : `/login?redirect=/partners/${slug}`}>
                              {isAuthenticated ? 'Check Availability' : 'Sign In to View Partner Rates & Book'}
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {isAuthenticated ? (
              <PartnerAvailabilityWidget propertyId={property.id} />
            ) : (
              <div className="rounded-xl border border-khaki-600/30 bg-khaki-600/10 p-6 text-center">
                <p className="text-terracotta-900 font-semibold mb-3">Sign in to view partner rates and book</p>
                <Button asChild>
                  <Link href={`/login?redirect=/partners/${slug}`}>Sign In</Link>
                </Button>
              </div>
            )}

            {/* Contact Form */}
            <section className="bg-nude-50 rounded-xl p-8">
              <h2 className="font-display text-2xl text-terracotta-800 mb-6">
                Contact Property
              </h2>
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-khaki-600 focus:border-transparent"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-khaki-600 focus:border-transparent"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-khaki-600 focus:border-transparent"
                    placeholder="I'm interested in booking..."
                  ></textarea>
                </div>
                <Button variant="primary" size="lg" className="w-full">
                  Send Inquiry
                </Button>
              </form>
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Quick Info Card */}
            <div className="sticky top-24 bg-white border border-gray-200 rounded-xl p-6 shadow-lg">
              <h3 className="font-display text-xl text-terracotta-800 mb-6">
                Property Information
              </h3>

              {/* Check-in/Check-out */}
              <div className="space-y-4 mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-khaki-600 mt-1" />
                  <div>
                    <div className="text-sm text-gray-600">Check-in</div>
                    <div className="font-medium text-gray-900">{property.checkInTime}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-khaki-600 mt-1" />
                  <div>
                    <div className="text-sm text-gray-600">Check-out</div>
                    <div className="font-medium text-gray-900">{property.checkOutTime}</div>
                  </div>
                </div>
              </div>

              {/* Contact Details */}
              <div className="space-y-4 mb-6">
                <h4 className="font-semibold text-gray-900">Direct Contact</h4>
                <div className="space-y-3">
                  {property.contact.phone && (
                    <a
                      href={`tel:${property.contact.phone}`}
                      className="flex items-center gap-2 text-khaki-600 hover:text-khaki-700"
                    >
                      <Phone className="w-4 h-4" />
                      <span className="text-sm">{property.contact.phone}</span>
                    </a>
                  )}
                  {property.contact.email && (
                    <a
                      href={`mailto:${property.contact.email}`}
                      className="flex items-center gap-2 text-khaki-600 hover:text-khaki-700"
                    >
                      <Mail className="w-4 h-4" />
                      <span className="text-sm">{property.contact.email}</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">Location</h4>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-khaki-600 mt-1 shrink-0" />
                  <address className="text-sm text-gray-700 not-italic">
                    {property.address.street}<br />
                    {property.address.city}, {property.address.state}<br />
                    {property.address.country}
                  </address>
                </div>
              </div>

              {/* Partner Badge */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <BadgeCheck className="w-5 h-5 text-khaki-600" />
                  <span>Verified Hotel Etuna Partner</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Back to Partners */}
      <div className="bg-nude-50 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Link href="/partners">
            <Button variant="outline" size="lg">
              ← View All Referral Partners
            </Button>
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
