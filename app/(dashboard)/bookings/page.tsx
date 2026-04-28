/**
 * Bookings List Page
 * 
 * Purpose: Display and manage all bookings with filters and search
 * Location: /app/(dashboard)/bookings/page.tsx
 * 
 * Design System v1.0.0:
 * - PageHeader component with "New Booking" button
 * - Card component containing booking table/list
 * - Filters for status, date range, property
 * - StatusBadge for booking status
 * - Pagination controls at bottom
 */

import React from 'react';
import { getSessionWithTenantContext } from '@/lib/auth/tenant-context';
import { BookingList } from '@/components/features/booking/BookingList';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/Card';

export const dynamic = 'force-dynamic';

const BookingsPage = async ({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) => {
  const session = await getSessionWithTenantContext();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Bookings & Orders"
          description="Manage hotel bookings and restaurant orders"
          actions={
            <Link 
              href="/bookings/new" 
              className="btn btn-primary gentle-lift min-h-[44px] shadow-nude-soft hover:shadow-nude-medium"
              aria-label="Create new booking"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Booking
            </Link>
          }
        />
        
        {session?.user?.tenantId ? (
          <BookingList 
            propertyId={(searchParams.propertyId as string) || ''} 
            tenantId={session.user.tenantId as string} 
          />
        ) : (
          <Card variant="elevated" className="text-center py-12">
            <p className="text-nude-600">Please log in to view bookings.</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BookingsPage;
