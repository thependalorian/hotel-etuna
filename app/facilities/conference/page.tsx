/**
 * Conference hall booking page.
 * Location: app/facilities/conference/page.tsx
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import NavigationHeader from '@/components/sections/landing/NavigationHeader';
import Footer from '@/components/shared/Footer';
import PublicHero from '@/components/shared/PublicHero';
import { Button } from '@/components/ui/Button';
import { ConferenceBookingForm } from '@/components/features/booking/ConferenceBookingForm';
import { getFacilityRoomByKind } from '@/lib/data/rooms';
import { HOTEL_ETUNA_FACILITY_RATES } from '@/lib/constants/hotel-etuna-room-types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Conference Hall',
  description: 'Book the Hotel Etuna conference hall — N$1,200 per session, 08:00 to 17:00.',
};

export default async function ConferenceFacilityPage() {
  const session = await getServerSession(authOptions);
  const facility = await getFacilityRoomByKind('conference');

  return (
    <div className="min-h-screen bg-surface-background">
      <NavigationHeader />
      <main>
        <PublicHero
          title="Conference Hall"
          subtitle={`Professional meetings and events · N$${HOTEL_ETUNA_FACILITY_RATES.conferenceSession} per session · 08:00–17:00`}
          breadcrumbLabel="Conference"
        />
        <section className="container mx-auto px-4 py-12 max-w-3xl">
          {!facility ? (
            <div className="alert alert-warning">
              <span>Conference bookings are being configured. Please contact us to enquire.</span>
            </div>
          ) : session?.user ? (
            <ConferenceBookingForm roomId={facility.id} />
          ) : (
            <div className="text-center space-y-4">
              <p className="text-terracotta-800">Sign in to reserve the conference hall online.</p>
              <Button asChild variant="primary" className="rounded-full px-8">
                <Link href="/login?redirect=/facilities/conference">Sign in to book</Link>
              </Button>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
