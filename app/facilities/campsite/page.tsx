/**
 * Campsite whole-site booking page.
 * Location: app/facilities/campsite/page.tsx
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import NavigationHeader from '@/components/sections/landing/NavigationHeader';
import Footer from '@/components/shared/Footer';
import PublicHero from '@/components/shared/PublicHero';
import { Button } from '@/components/ui/Button';
import { CampsiteBookingForm } from '@/components/features/booking/CampsiteBookingForm';
import { FacilityShowcase } from '@/components/features/facilities/FacilityShowcase';
import { getFacilityRoomByKind } from '@/lib/data/rooms';
import { HOTEL_ETUNA_FACILITY_RATES } from '@/lib/constants/hotel-etuna-room-types';
import { FACILITY_SHOWCASE } from '@/lib/data/facilities';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Campsite',
  description:
    'Reserve the Hotel Etuna campsite — whole-site hire with per-person Namibian and non-Namibian rates.',
};

export default async function CampsiteFacilityPage() {
  const session = await getServerSession(authOptions);
  const facility = await getFacilityRoomByKind('campsite');

  return (
    <div className="min-h-screen bg-surface-background">
      <NavigationHeader />
      <main>
        <PublicHero
          title="Campsite"
          subtitle={`Whole-site hire from N$${HOTEL_ETUNA_FACILITY_RATES.campsiteSiteMinimum} · N$${HOTEL_ETUNA_FACILITY_RATES.campsiteNamibianPp} / N$${HOTEL_ETUNA_FACILITY_RATES.campsiteNonNamibianPp} per person`}
          backgroundImage={facility?.images?.[0] ?? FACILITY_SHOWCASE.campsite.heroImage}
          breadcrumbLabel="Campsite"
        />
        <FacilityShowcase
          kind="campsite"
          images={facility?.images}
          amenities={facility?.amenities}
          rateLabel={`Whole-site from N$${HOTEL_ETUNA_FACILITY_RATES.campsiteSiteMinimum}`}
        />
        <section className="container mx-auto px-4 py-12 max-w-3xl">
          {!facility ? (
            <div className="alert alert-warning">
              <span>Campsite bookings are being configured. Please contact us to enquire.</span>
            </div>
          ) : session?.user ? (
            <CampsiteBookingForm roomId={facility.id} />
          ) : (
            <div className="text-center space-y-4">
              <p className="text-ink-700">Sign in to reserve the campsite online.</p>
              <Button asChild variant="primary" className="rounded-full px-8">
                <Link href="/login?redirect=/facilities/campsite">Sign in to book</Link>
              </Button>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
