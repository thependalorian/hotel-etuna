/**
 * Public Introducers Directory Page
 * 
 * Purpose: Public-facing directory of introducer partners (opt-in only)
 * Location: /app/introducers-directory/page.tsx
 * 
 * Features:
 * - Display active introducers who opted into public directory
 * - Show bio, website, booking stats
 * - Book button with pre-filled introducer code
 * - No authentication required
 * 
 * Following System Design Principles:
 * - Part 9: daisyUI components
 * - Part 6: Public read access
 * 
 * @module IntroducersDirectoryPage
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { ExternalLink, TrendingUp } from 'lucide-react';
import PublicHero from '@/components/shared/PublicHero';
import Footer from '@/components/shared/Footer';
import NavigationHeader from '@/components/sections/landing/NavigationHeader';
import { Button } from '@/components/ui/Button';
import { db, introducers } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

export const metadata: Metadata = {
  title: 'Trusted Travel Partners | Hotel Etuna',
  description: 'Discover our trusted network of travel agents and tour operators who can help you book your stay at Hotel Etuna.',
};

async function getPublicIntroducers() {
  const publicIntroducers = await db
    .select({
      id: introducers.id,
      name: introducers.name,
      code: introducers.code,
      bio: introducers.bio,
      website: introducers.website,
      logo_url: introducers.logoUrl,
      total_bookings: introducers.totalBookings,
    })
    .from(introducers)
    .where(
      and(
        eq(introducers.isActive, true),
        eq(introducers.showInPublicDirectory, true)
      )
    )
    .orderBy(introducers.name);

  return publicIntroducers;
}

export default async function IntroducersDirectoryPage() {
  const partners = await getPublicIntroducers();

  return (
    <div className="min-h-screen bg-surface-background">
      <NavigationHeader />

      <main>
        <PublicHero
          title="Trusted Travel Partners"
          subtitle="Book through our verified network of travel agents and tour operators"
          backgroundImage="/icons/icon.svg"
          breadcrumbLabel="Travel Partners"
        />

        <section className="py-16">
          <div className="container mx-auto px-4">
            {partners.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-xl text-nude-600">No travel partners are currently listed.</p>
                <Button asChild variant="primary" size="lg" className="mt-6">
                  <Link href="/">Book Direct at Hotel Etuna</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                {partners.map((partner) => (
                  <div
                    key={partner.id}
                    className="bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 p-6"
                  >
                    {partner.logo_url && (
                      <div className="mb-4">
                        <img
                          src={partner.logo_url}
                          alt={`${partner.name} logo`}
                          className="h-16 object-contain"
                        />
                      </div>
                    )}
                    
                    <h3 className="font-display text-2xl font-bold text-terracotta-900 mb-2">
                      {partner.name}
                    </h3>
                    
                    <div className="mb-4">
                      <div className="badge badge-neutral font-mono">{partner.code}</div>
                    </div>

                    {partner.bio && (
                      <p className="text-terracotta-800 mb-4 leading-relaxed line-clamp-3">
                        {partner.bio}
                      </p>
                    )}

                    {partner.total_bookings > 0 && (
                      <div className="flex items-center gap-2 text-sm text-terracotta-700 mb-4">
                        <TrendingUp className="w-4 h-4 text-khaki-600" />
                        <span>{partner.total_bookings} successful bookings</span>
                      </div>
                    )}

                    <div className="flex gap-2 mt-6">
                      <Button 
                        asChild 
                        variant="primary" 
                        size="md" 
                        className="flex-1"
                      >
                        <Link href={`/guest/book?introducer=${partner.code}`}>
                          Book with {partner.name}
                        </Link>
                      </Button>
                      
                      {partner.website && (
                        <Button
                          asChild
                          variant="outline"
                          size="md"
                        >
                          <a 
                            href={partner.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="py-16 bg-nude-50">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-display text-3xl md:text-4xl text-terracotta-900 mb-4">
              Are you a travel professional?
            </h2>
            <p className="text-lg text-terracotta-800 mb-8 max-w-2xl mx-auto">
              Join our referral partner program and earn commission on every booking you refer to Hotel Etuna.
            </p>
            <Button asChild variant="primary" size="lg">
              <Link href="/contact">Contact Us to Join</Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
