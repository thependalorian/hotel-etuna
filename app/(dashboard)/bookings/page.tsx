/**
 * Bookings List Page
 *
 * Purpose: Display and manage all bookings with filters, calendar, and search
 * Location: /app/(dashboard)/bookings/page.tsx
 */

import React, { Suspense } from 'react';
import { getSessionWithTenantContext } from '@/lib/auth/tenant-context';
import { BookingList } from '@/components/features/booking/BookingList';
import { BookingsOperationsHub } from '@/components/features/booking/BookingsOperationsHub';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/Card';
import { resolvePublicHubProperty } from '@/lib/utils/public-property';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import type { BookingKind } from '@/lib/bookings/booking-kind';

export const dynamic = 'force-dynamic';

const BookingsPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
  const session = await getSessionWithTenantContext();
  const params = await searchParams;
  const kindParam = params.bookingKind as string | undefined;
  const bookingKindFilter =
    kindParam === 'conference' || kindParam === 'campsite' || kindParam === 'accommodation'
      ? (kindParam as BookingKind)
      : undefined;

  let propertyId = (params.propertyId as string) || '';
  if (!propertyId && session?.user?.tenantId) {
    try {
      const { property } = await resolvePublicHubProperty();
      propertyId = property.id;
    } catch {
      propertyId = '';
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Bookings & Orders"
          description="Guest stays, conference hall sessions, and campsite hires"
          actions={
            <div className="flex flex-wrap gap-2">
              <Link
                href="/bookings/new?tab=conference"
                className="btn btn-outline rounded-full px-6 min-h-[44px]"
              >
                Book conference
              </Link>
              <Link
                href="/bookings/new?tab=campsite"
                className="btn btn-outline rounded-full px-6 min-h-[44px]"
              >
                Book campsite
              </Link>
              <Link
                href="/bookings/night-audit"
                className="btn btn-outline rounded-full px-6 min-h-[44px]"
              >
                Night audit
              </Link>
              <Link
                href="/bookings/new"
                className="btn btn-primary gentle-lift min-h-[44px] shadow-nude-soft hover:shadow-nude-medium rounded-full px-6"
                aria-label="Create new room stay booking"
              >
                <Plus className="w-5 h-5 mr-2" />
                New stay
              </Link>
            </div>
          }
        />

        {session?.user?.tenantId && propertyId ? (
          <>
            <Suspense
              fallback={
                <Card variant="elevated" className="p-8 text-center">
                  <LoadingSpinner size="md" text="Loading calendar…" />
                </Card>
              }
            >
              <BookingsOperationsHub propertyId={propertyId} />
            </Suspense>
            <BookingList
              propertyId={propertyId}
              tenantId={session.user.tenantId as string}
              bookingKindFilter={bookingKindFilter}
            />
          </>
        ) : (
          <Card variant="elevated" className="text-center py-12">
            <p className="text-nude-600">
              {session?.user?.tenantId
                ? 'No hub property found. Open a property or set DEFAULT_PROPERTY_ID.'
                : 'Please log in to view bookings.'}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BookingsPage;
