/**
 * Create booking — room stay, conference session, or campsite hire.
 * Location: app/(dashboard)/bookings/new/page.tsx
 */

import { NewBookingTabs } from '@/components/features/booking/NewBookingTabs';
import { getFacilityRoomByKind } from '@/lib/data/rooms';

export const dynamic = 'force-dynamic';

export default async function NewBookingPage() {
  const conference = await getFacilityRoomByKind('conference');
  const campsite = await getFacilityRoomByKind('campsite');

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in max-w-4xl mx-auto px-4 py-6">
      <div>
        <h1 className="buffr-page-title buffr-page-title--fluid mb-2">Create booking</h1>
        <p className="text-sm sm:text-base text-base-content/70">
          Guest room stays, conference hall sessions, or whole-site campsite hires
        </p>
      </div>
      <div className="card bg-base-100 shadow-lg card-hover">
        <div className="card-body p-4 sm:p-6 md:p-8">
          <NewBookingTabs
            conferenceRoomId={conference?.id}
            campsiteRoomId={campsite?.id}
          />
        </div>
      </div>
    </div>
  );
}
