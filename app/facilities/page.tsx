/**
 * Facilities hub — conference hall and campsite (not guest rooms).
 * Location: app/facilities/page.tsx
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { Building2, Tent } from 'lucide-react';
import NavigationHeader from '@/components/sections/landing/NavigationHeader';
import PublicHero from '@/components/shared/PublicHero';
import Footer from '@/components/shared/Footer';
import { Button } from '@/components/ui/Button';
import { HOTEL_ETUNA_FACILITY_RATES } from '@/lib/constants/hotel-etuna-room-types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Facilities',
  description:
    'Book the Hotel Etuna conference hall or whole-site campsite — separate from our guest room categories.',
};

const facilities = [
  {
    href: '/facilities/conference',
    title: 'Conference Hall',
    description: `Professional meetings and events · N$${HOTEL_ETUNA_FACILITY_RATES.conferenceSession} per session · 08:00–17:00`,
    icon: Building2,
  },
  {
    href: '/facilities/campsite',
    title: 'Campsite',
    description: `Whole-site hire from N$${HOTEL_ETUNA_FACILITY_RATES.campsiteSiteMinimum} · N$${HOTEL_ETUNA_FACILITY_RATES.campsiteNamibianPp} / N$${HOTEL_ETUNA_FACILITY_RATES.campsiteNonNamibianPp} per person`,
    icon: Tent,
  },
] as const;

export default function FacilitiesPage() {
  return (
    <div className="min-h-screen bg-surface-background">
      <NavigationHeader />

      <main>
        <PublicHero
          title="Facilities"
          subtitle="Conference and campsite bookings are separate from our guest rooms — explore and reserve below."
          breadcrumbLabel="Facilities"
        />

        <section className="py-12 sm:py-16" aria-label="Bookable facilities">
          <div className="container mx-auto px-4 sm:px-6">
            <p className="mx-auto mb-8 max-w-2xl text-center text-base text-terracotta-800 sm:text-lg">
              Looking for a place to stay? Browse our{' '}
              <Link href="/rooms" className="link link-primary font-medium">
                five room categories
              </Link>{' '}
              on the rooms page.
            </p>

            <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
              {facilities.map(({ href, title, description, icon: Icon }) => (
                <article
                  key={href}
                  className="flex flex-col rounded-2xl border border-nude-200 bg-white p-6 shadow-card sm:p-8"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sage/20">
                    <Icon className="h-6 w-6 text-sage" aria-hidden />
                  </div>
                  <h2 className="font-display text-xl font-bold text-terracotta-900 sm:text-2xl">
                    {title}
                  </h2>
                  <p className="mt-2 flex-1 text-sm text-terracotta-800 sm:text-base">{description}</p>
                  <Button asChild size="md" className="mt-6 min-h-11 w-full sm:w-auto">
                    <Link href={href}>View &amp; book</Link>
                  </Button>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
