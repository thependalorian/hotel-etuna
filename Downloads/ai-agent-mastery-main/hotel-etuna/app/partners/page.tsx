/**
 * Partners Directory Page
 * 
 * Purpose: List all referral partner properties with links to detail pages
 * Location: app/partners/page.tsx
 */

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { MapPin, Star, Home, BadgeCheck } from 'lucide-react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import PublicHero from '@/components/shared/PublicHero';
import Footer from '@/components/shared/Footer';

export const metadata: Metadata = {
  title: 'Partner Accommodations - Windhoek Lodging | Hotel Etuna',
  description: 'Explore trusted partner properties in the Windhoek area, curated by Hotel Etuna.',
};

interface Partner {
  id: string;
  name: string;
  slug: string;
  description: string;
  location: {
    city: string;
    state: string;
    country: string;
  };
  starRating: number;
  images: string[];
  amenities: string[];
  type: string;
  roomCount: number;
  tenantId: string;
  tenantName: string;
}

async function getPartners(): Promise<Partner[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/partners`, {
      cache: 'no-store', // Always fetch fresh data
    });

    if (!res.ok) {
      console.error('Failed to fetch partners:', res.status);
      return [];
    }

    const data = await res.json();
    return data.partners || [];
  } catch (error) {
    console.error('Error fetching partners:', error);
    return [];
  }
}

export default async function PartnersPage() {
  const session = await getServerSession(authOptions);
  const isAuthenticated = Boolean(session?.user);
  const partners = await getPartners();

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
          
          <Button asChild size="sm">
            <Link href="/">Back to Hotel Etuna</Link>
          </Button>
        </nav>
      </header>

      <main>
        <PublicHero
          title="Referral Partners - Windhoek Lodging"
          subtitle="Trusted accommodation partners across Windhoek."
          backgroundImage="/images/hospitality/partner_jayla.jpeg"
          breadcrumbLabel="Partners"
        />

        {/* Partners Grid */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            {partners.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-xl text-gray-600">No partner properties available at this time.</p>
                <Button asChild variant="primary" size="lg" className="mt-6">
                  <Link href="/">Return to Hotel Etuna</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
                {partners.map((partner) => {
                  const hasImages = partner.images && partner.images.length > 0;
                  const primaryImage = hasImages ? partner.images[0] : '/images/hospitality/hero_hotel_lobby.jpeg';
                  
                  return (
                    <div
                      key={partner.id}
                      className="bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300"
                    >
                      {/* Image */}
                      <div className="aspect-video relative bg-nude-200">
                        <Image
                          src={primaryImage}
                          alt={partner.name}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5">
                          {partner.starRating > 0 && (
                            <>
                              <Star className="w-4 h-4 fill-khaki-600 text-khaki-600" />
                              <span className="font-semibold text-terracotta-900">{partner.starRating}</span>
                            </>
                          )}
                        </div>
                        <div className="absolute bottom-4 left-4">
                          <div className="bg-khaki-600/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2">
                            <BadgeCheck className="w-4 h-4 text-white" />
                            <span className="text-white text-sm font-medium">Verified Partner</span>
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-6">
                        <h2 className="font-display text-3xl font-bold text-terracotta-900 mb-3">
                          {partner.name}
                        </h2>
                        
                        <div className="flex items-center gap-2 text-sm text-terracotta-800 mb-4">
                          <MapPin className="w-4 h-4 text-khaki-600" />
                          {partner.location.city}, {partner.location.country}
                        </div>

                        <p className="text-terracotta-800 mb-6 leading-relaxed line-clamp-3">
                          {partner.description}
                        </p>
                        <p className="text-sm text-rustic font-semibold mb-4">
                          {partner.roomCount} room{partner.roomCount === 1 ? '' : 's'} available
                        </p>

                        {/* Amenities */}
                        {partner.amenities && partner.amenities.length > 0 && (
                          <div className="mb-6">
                            <div className="flex flex-wrap gap-2">
                              {partner.amenities.slice(0, 4).map((amenity, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm text-terracotta-800">
                                  <div className="w-1.5 h-1.5 rounded-full bg-sage" />
                                  {amenity}
                                </div>
                              ))}
                              {partner.amenities.length > 4 && (
                                <div className="text-sm text-gray-500">
                                  +{partner.amenities.length - 4} more
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Property Type */}
                        <div className="mb-6 pb-6 border-b border-nude-200">
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-khaki-sand/20 rounded-full">
                            <span className="text-sm font-medium text-terracotta-800 capitalize">
                              {partner.type.replace('_', ' ')}
                            </span>
                          </div>
                        </div>

                        {/* CTA */}
                        <Button asChild size="lg" className="w-full">
                          <Link href={isAuthenticated ? `/partners/${partner.slug}` : `/login?redirect=/partners/${partner.slug}`}>
                            <Home className="w-5 h-5" />
                            {isAuthenticated ? 'View Property Details' : 'Sign In to View Partner Rates & Book'}
                          </Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-nude-50">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-display text-3xl md:text-4xl text-terracotta-900 mb-4">
              Looking for Hotel Etuna?
            </h2>
            <p className="text-lg text-terracotta-800 mb-8 max-w-2xl mx-auto">
              Experience our full-service hotel in the heart of Ongwediva with Sofia AI concierge, 
              restaurant, pool, and 5 room types.
            </p>
            <Button asChild variant="primary" size="lg">
              <Link href="/">Book at Hotel Etuna</Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
