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
import { getReferralPartners } from '@/lib/data/partners';
import PublicHero from '@/components/shared/PublicHero';
import Footer from '@/components/shared/Footer';
import NavigationHeader from '@/components/sections/landing/NavigationHeader';
import { publicCopy } from '@/lib/copy/public';

export const metadata: Metadata = {
  title: publicCopy.partners.meta.title,
  description: publicCopy.partners.meta.description,
};

export default async function PartnersPage() {
  const session = await getServerSession(authOptions);
  const isAuthenticated = Boolean(session?.user);
  
  // Use data access layer
  const partners = await getReferralPartners();

  return (
    <div className="min-h-screen bg-surface-background">
      <NavigationHeader />

      <main>
        <PublicHero
          title={publicCopy.partners.hero.title}
          subtitle={publicCopy.partners.hero.subtitle}
          backgroundImage="/icons/icon.svg"
          breadcrumbLabel="Partners"
        />

        {/* Partners Grid */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            {partners.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-xl text-ink-600">No partner properties available at this time.</p>
                <Button asChild variant="primary" size="lg" className="mt-6">
                  <Link href="/">Return to Hotel Etuna</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
                {partners.map((partner) => {
                  const hasImages = partner.images && partner.images.length > 0;
                  const primaryImage = hasImages ? partner.images[0] : '/icons/icon.svg';
                  
                  return (
                    <div
                      key={partner.id}
                      className="bg-white rounded-etuna-card overflow-hidden transition-all duration-300"
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
                              <Star className="w-4 h-4 fill-ci-accent-ochre text-ci-primary" />
                              <span className="font-semibold text-ci-secondary-chocolate">{partner.starRating}</span>
                            </>
                          )}
                        </div>
                        <div className="absolute bottom-4 left-4">
                          <div className="bg-ci-primary/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2">
                            <BadgeCheck className="w-4 h-4 text-white" />
                            <span className="text-white text-sm font-medium">Verified Partner</span>
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-6">
                        <h2 className="font-display text-3xl font-bold text-ci-secondary-chocolate mb-3">
                          {partner.name}
                        </h2>
                        
                        <div className="flex items-center gap-2 text-sm text-ink-600 mb-4">
                          <MapPin className="w-4 h-4 text-ci-primary" />
                          {partner.location.city}, {partner.location.country}
                        </div>

                        <p className="text-ink-700 mb-6 leading-relaxed line-clamp-3">
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
                                <div key={idx} className="flex items-center gap-2 text-sm text-ink-600">
                                  <div className="w-1.5 h-1.5 rounded-full bg-ci-accent-sage" />
                                  {amenity}
                                </div>
                              ))}
                              {partner.amenities.length > 4 && (
                                <div className="text-sm text-ink-500">
                                  +{partner.amenities.length - 4} more
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Property Type */}
                        <div className="mb-6 pb-6 border-b border-nude-200">
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-ci-secondary-tan/20 rounded-full">
                            <span className="text-sm font-medium text-ci-accent-terracotta capitalize">
                              {partner.type.replace('_', ' ')}
                            </span>
                          </div>
                        </div>

                        {/* CTA */}
                        <Button asChild size="lg" className="w-full">
                          <Link href={isAuthenticated ? `/partners/${partner.slug}` : `/login?redirect=/partners/${partner.slug}`}>
                            <Home className="w-5 h-5" />
                            {isAuthenticated
                              ? publicCopy.ctas.viewPropertyDetails
                              : publicCopy.gated.viewPartnerRatesAndBook}
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
            <h2 className="font-display text-3xl md:text-4xl text-ci-secondary-chocolate mb-4">
              Looking for Hotel Etuna?
            </h2>
            <p className="text-lg text-ink-700 mb-8 max-w-2xl mx-auto">
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
