import React from 'react';
import { BookingService } from '@/lib/services/booking/BookingService';
import { getSessionWithTenantContext } from '@/lib/auth/tenant-context';
import { AppError } from '@/lib/utils/errors';
import { bookingStatusBadgeClass } from '@/lib/utils/status-normalize';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { BOOKING_STATUS_TRANSITIONS } from '@/lib/workflows/domainTransitions';
import { WorkflowStatusActions } from '@/components/shared/WorkflowStatusActions';

// Force dynamic rendering for authenticated routes
export const dynamic = 'force-dynamic';

async function getBooking(id: string) {
  try {
    const session = await getSessionWithTenantContext();
    if (!session || !session.user?.tenantId) {
      throw new AppError(401, 'Unauthorized');
    }
    const bookingService = new BookingService();
    const booking = await bookingService.getBookingById(id, session.user.tenantId as string);
    return booking;
  } catch (error) {
    if (error instanceof AppError && error.statusCode === 404) {
      notFound();
    }
    console.error(error);
    return null;
  }
}

function readText(record: Record<string, unknown> | null | undefined, key: string): string {
  const value = record?.[key];
  return typeof value === 'string' ? value : '';
}

const BookingDetailsPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const booking = await getBooking(id);

  if (!booking) {
    return (
      <div className="card bg-error/10 border border-error shadow-lg">
        <div className="card-body text-center py-12">
          <div className="w-20 h-20 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold font-display mb-2">Error Loading Booking</h3>
          <p className="text-error font-medium mb-4">Unable to load booking details. Please try again.</p>
          <Link href="/bookings" className="btn btn-primary">
            Back to Bookings
          </Link>
        </div>
      </div>
    );
  }

  const guest = booking.guest ?? {};
  const property = booking.property ?? {};
  const guestName = [readText(guest, 'first_name'), readText(guest, 'last_name')]
    .filter(Boolean)
    .join(' ') || 'Guest not attached';
  const total = Number(booking.total_amount ?? 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="dashboard-surface rounded-[1.75rem] p-6 sm:p-8">
        <span className="ops-pill mb-4">PMS lifecycle</span>
        <h1 className="text-3xl md:text-4xl font-black mb-2">Booking Details</h1>
        <p className="max-w-2xl text-ink-500">
          Review guest, stay, and payment context. Status changes below use the same validated API workflow
          that updates room side effects.
        </p>
      </div>

      {/* Booking Information Card */}
      <div className="dashboard-card dashboard-card-hover">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-black text-ink-950 mb-2">
                Booking #{booking.booking_reference}
              </h2>
              <div className={`badge badge-lg capitalize ${bookingStatusBadgeClass(booking.status)}`}>
                {booking.status}
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-ink-400">Total</p>
              <p className="text-2xl font-black text-ink-950">
                {booking.currency ?? 'NAD'} {total.toFixed(2)}
              </p>
              <p className="text-sm text-ink-500">Payment: {booking.payment_status ?? 'pending'}</p>
            </div>
          </div>

          <div className="mb-6 rounded-2xl border border-base-300 bg-brand-50 p-4">
            <p className="mb-3 text-sm font-bold text-ink-800">Allowed status actions</p>
            <WorkflowStatusActions
              currentStatus={booking.status}
              transitions={BOOKING_STATUS_TRANSITIONS}
              endpoint={`/api/bookings/${booking.id}/status`}
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-base-200/70 rounded-2xl">
            <div>
              <p className="text-xs text-base-content/60 mb-1">Check-in</p>
              <p className="font-medium text-base-content text-lg">
                {new Date(booking.check_in_date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div>
              <p className="text-xs text-base-content/60 mb-1">Check-out</p>
              <p className="font-medium text-base-content text-lg">
                {new Date(booking.check_out_date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>

          <div className="divider">Guest Information</div>

          {/* Guest Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-base-content/60 mb-1">Full Name</p>
              <p className="font-medium text-base-content">
                {guestName}
              </p>
            </div>
            <div>
              <p className="text-sm text-base-content/60 mb-1">Email</p>
              <p className="font-medium text-base-content">{readText(guest, 'email') || 'No email recorded'}</p>
            </div>
            {readText(guest, 'phone') && (
              <div>
                <p className="text-sm text-base-content/60 mb-1">Phone</p>
                <p className="font-medium text-base-content">{readText(guest, 'phone')}</p>
              </div>
            )}
          </div>

          <div className="divider">Property Information</div>

          {/* Property Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-base-content/60 mb-1">Property Name</p>
              <p className="font-medium text-base-content text-lg">{readText(property, 'name') || 'Property not attached'}</p>
            </div>
            {readText(property, 'address') && (
              <div>
                <p className="text-sm text-base-content/60 mb-1">Address</p>
                <p className="font-medium text-base-content">{readText(property, 'address')}</p>
              </div>
            )}
            {booking.special_requests && (
              <div className="md:col-span-2">
                <p className="text-sm text-base-content/60 mb-1">Special Requests</p>
                <p className="rounded-2xl bg-base-200/70 p-4 font-medium text-base-content">
                  {booking.special_requests}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailsPage;
