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
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-br from-khaki-600 to-terracotta-800 text-white">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-display text-4xl md:text-6xl font-bold mb-6">
              Referral Partners – Windhoek Lodging
            </h1>
            <p className="text-xl md:text-2xl mb-4 max-w-3xl mx-auto opacity-95">
              Trusted accommodation partners across Windhoek
            </p>
            <p className="text-white/80 max-w-2xl mx-auto">
              Can't find availability at Hotel Etuna? Explore our carefully selected partner properties 
              offering quality accommodation throughout the region.
            </p>
          </div>
        </section>

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
                      <div className="aspect-[16/9] relative bg-nude-200">
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
                          <Link href={`/partners/${partner.slug}`}>
                            <Home className="w-5 h-5" />
                            View Property Details
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

      {/* Footer */}
      <footer className="bg-terracotta-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-display text-xl font-bold mb-4">Hotel Etuna</h3>
              <p className="text-white/80 text-sm">
                "He Takes Care of Us"<br />
                Ongwediva, Namibia
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/" className="text-white/80 hover:text-white transition-colors">Home</Link></li>
                <li><Link href="/rooms" className="text-white/80 hover:text-white transition-colors">Rooms</Link></li>
                <li><Link href="/about" className="text-white/80 hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="text-white/80 hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/legal/privacy" className="text-white/80 hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/legal/terms" className="text-white/80 hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/20 text-center text-sm text-white/60">
            © {new Date().getFullYear()} Hotel Etuna. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
