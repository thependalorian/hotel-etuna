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
import { MapPin, Star, Phone, Mail, Home } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Partner Accommodations',
  description: 'Explore trusted partner properties in the Windhoek area, curated by Hotel Etuna.',
};

export default function PartnersPage() {
  const partners = [
    {
      name: 'Jayla Accommodation',
      slug: 'jayla',
      image: '/images/hospitality/partner_jayla.jpeg',
      description: 'A cozy guesthouse offering 8-10 comfortable rooms, perfect for travelers seeking a homey atmosphere with personalized service.',
      location: 'Windhoek, Namibia',
      rating: 8.5,
      roomCount: 10,
      features: ['Free WiFi', 'Breakfast Included', 'Parking', 'Garden'],
      priceFrom: 'NAD 800',
    },
    {
      name: 'Aquarius Windhoek',
      slug: 'aquarius',
      image: '/images/hospitality/partner_aquarius.jpeg',
      description: 'Modern apartment rentals with 15-20 units, ideal for extended stays and families needing self-catering facilities.',
      location: 'Windhoek, Namibia',
      rating: 8.8,
      roomCount: 20,
      features: ['Kitchenette', 'Weekly Rates', 'Laundry', 'Pool Access'],
      priceFrom: 'NAD 1,200',
    },
  ];

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
              Partner Accommodations
            </h1>
            <p className="text-xl md:text-2xl mb-4 max-w-3xl mx-auto opacity-95">
              Trusted lodging partners in the Windhoek area
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {partners.map((partner) => (
                <div
                  key={partner.slug}
                  className="bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300"
                >
                  {/* Image */}
                  <div className="aspect-[16/9] relative bg-nude-200">
                    <Image
                      src={partner.image}
                      alt={partner.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5">
                      <Star className="w-4 h-4 fill-khaki-600 text-khaki-600" />
                      <span className="font-semibold text-terracotta-900">{partner.rating}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h2 className="font-display text-3xl font-bold text-terracotta-900 mb-3">
                      {partner.name}
                    </h2>
                    
                    <div className="flex items-center gap-2 text-sm text-terracotta-800 mb-4">
                      <MapPin className="w-4 h-4 text-khaki-600" />
                      {partner.location}
                    </div>

                    <p className="text-terracotta-800 mb-6 leading-relaxed">
                      {partner.description}
                    </p>

                    {/* Features */}
                    <div className="grid grid-cols-2 gap-2 mb-6">
                      {partner.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-2 text-sm text-terracotta-800">
                          <div className="w-1.5 h-1.5 rounded-full bg-sage" />
                          {feature}
                        </div>
                      ))}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6 mb-6 pb-6 border-b border-nude-200">
                      <div>
                        <div className="text-2xl font-display font-bold text-khaki-600">{partner.roomCount}</div>
                        <div className="text-xs text-terracotta-800">Rooms</div>
                      </div>
                      <div>
                        <div className="text-2xl font-display font-bold text-khaki-600">{partner.priceFrom}</div>
                        <div className="text-xs text-terracotta-800">From / night</div>
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
              ))}
            </div>
          </div>
        </section>

        {/* Why Book Through Hotel Etuna */}
        <section className="py-16 bg-nude-50">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-terracotta-900 mb-6">
                Why Book Through Hotel Etuna?
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl p-6">
                  <div className="w-12 h-12 bg-sage/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="w-6 h-6 text-sage" />
                  </div>
                  <h3 className="font-semibold text-terracotta-900 mb-2">Vetted Quality</h3>
                  <p className="text-sm text-terracotta-800">
                    All partners meet our hospitality standards
                  </p>
                </div>
                <div className="bg-white rounded-xl p-6">
                  <div className="w-12 h-12 bg-sage/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Phone className="w-6 h-6 text-sage" />
                  </div>
                  <h3 className="font-semibold text-terracotta-900 mb-2">Local Support</h3>
                  <p className="text-sm text-terracotta-800">
                    Backed by Hotel Etuna's customer service
                  </p>
                </div>
                <div className="bg-white rounded-xl p-6">
                  <div className="w-12 h-12 bg-sage/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-6 h-6 text-sage" />
                  </div>
                  <h3 className="font-semibold text-terracotta-900 mb-2">Prime Locations</h3>
                  <p className="text-sm text-terracotta-800">
                    Strategic positioning throughout the region
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Back to Hotel Etuna */}
        <section className="py-16 bg-gradient-to-br from-terracotta-800 to-terracotta-900 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Looking for Hotel Etuna?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Experience our flagship property with full amenities, restaurant, pool, and AI concierge service
            </p>
            <Button asChild size="xl" className="bg-white text-terracotta-900 hover:bg-nude-100">
              <Link href="/">
                <Home className="w-5 h-5" />
                Visit Hotel Etuna
              </Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
