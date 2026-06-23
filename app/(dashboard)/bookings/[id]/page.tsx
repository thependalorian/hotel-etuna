/**
 * Booking Detail Page
 * 
 * Purpose: Display detailed booking information with status management
 * Location: /app/(dashboard)/bookings/[id]/page.tsx
 * 
 * Design System v1.0.0:
 * - 2-column layout (details + sidebar on desktop)
 * - Card components with elevated variant
 * - StatusBadge for booking status
 * - Section headers with font-display
 * - Timeline for activity history
 * - Action buttons in sidebar
 */

import React from 'react';
import { BookingService } from '@/lib/services/booking/BookingService';
import { getSessionWithTenantContext } from '@/lib/auth/tenant-context';
import { AppError } from '@/lib/utils/errors';
import { bookingStatusBadgeClass } from '@/lib/utils/status-normalize';
import { notFound } from 'next/navigation';
import { BOOKING_STATUS_TRANSITIONS } from '@/lib/workflows/domainTransitions';
import { WorkflowStatusActions } from '@/components/shared/WorkflowStatusActions';
import {
  BookingCashPaymentSection,
  type BookingCashRow,
} from '@/components/features/booking/BookingCashPaymentSection';
import { BookingFolioSection } from '@/components/features/booking/BookingFolioSection';
import { BookingDocumentsSection } from '@/components/features/booking/BookingDocumentsSection';
import { Card } from '@/components/ui/Card';
import PageHeader from '@/components/shared/PageHeader';
import { Calendar, MapPin, User, Mail, Phone } from 'lucide-react';
import { securityLogger } from '@/lib/utils/security-logger.client';
import { formatDateLong } from '@/lib/formatters';
import { formatFolioAmount } from '@/lib/utils/money';
import { BookingDetailLoadError } from '@/components/features/booking/BookingDetailLoadError';
import { BookingPricingDetails } from '@/components/features/booking/BookingPricingDetails';
import {
  bookingKindBadgeClass,
  bookingKindLabel,
  checkInDateLabel,
  checkOutDateLabel,
  isAccommodationBookingKind,
} from '@/lib/bookings/booking-kind';

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
    securityLogger.error("[BookingDetailPage] load error", error);
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
    return <BookingDetailLoadError />;
  }

  const guest = booking.guest ?? {};
  const property = booking.property ?? {};
  const guestName = [readText(guest, 'first_name'), readText(guest, 'last_name')]
    .filter(Boolean)
    .join(' ') || 'Guest not attached';
  const total = Number(booking.total_amount ?? 0);
  const bookingKind = String(
    booking.booking_kind ?? booking.bookingKind ?? 'accommodation'
  );
  const isStay = isAccommodationBookingKind(bookingKind);
  const roomType = String(booking.room_type ?? booking.roomType ?? '');
  const pricingDetails = (booking.pricing_details ?? booking.pricingDetails) as
    | Record<string, unknown>
    | undefined;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          eyebrow="PMS lifecycle"
          title="Booking Details"
          description="Review guest, stay, and payment context. Status changes use validated API workflows."
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - 2 columns on desktop */}
          <div className="lg:col-span-2 space-y-6">
            <Card variant="elevated">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h2 className="font-display text-2xl font-bold text-ink-900 mb-2">
                    Booking #{booking.booking_reference}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    <span className={bookingKindBadgeClass(bookingKind)}>
                      {bookingKindLabel(bookingKind)}
                    </span>
                    <div className={`badge badge-lg capitalize ${bookingStatusBadgeClass(booking.status)}`}>
                      {booking.status}
                    </div>
                  </div>
                  {roomType ? (
                    <p className="text-sm text-ink-600 mt-2">{roomType}</p>
                  ) : null}
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xs font-bold uppercase tracking-wider text-ink-600">Total</p>
                  <p className="font-display text-2xl font-bold text-ink-900">
                    {formatFolioAmount(booking.currency ?? 'NAD', total)}
                  </p>
                  <p className="text-sm text-ink-600">Payment: {booking.payment_status ?? 'pending'}</p>
                </div>
              </div>

              {/* Dates Section */}
              <div className="mb-6">
                <h3 className="font-display text-lg font-semibold mb-3 text-ink-900">
                  {isStay ? 'Stay dates' : 'Booking dates'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-nude-50 rounded-etuna-input border border-nude-200">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-ink-600 mt-0.5" aria-hidden="true" />
                    <div>
                      <p className="text-xs text-ink-600 mb-1">{checkInDateLabel(bookingKind)}</p>
                      <p className="font-semibold text-ink-900">
                        {formatDateLong(booking.check_in_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-ink-600 mt-0.5" aria-hidden="true" />
                    <div>
                      <p className="text-xs text-ink-600 mb-1">{checkOutDateLabel(bookingKind)}</p>
                      <p className="font-semibold text-ink-900">
                        {formatDateLong(booking.check_out_date)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Guest Information */}
              <div className="mb-6">
                <h3 className="font-display text-lg font-semibold mb-3 text-ink-900">Guest Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-ink-600" aria-hidden="true" />
                    <div>
                      <p className="text-sm text-ink-600">Full Name</p>
                      <p className="font-semibold text-ink-900">{guestName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-ink-600" aria-hidden="true" />
                    <div>
                      <p className="text-sm text-ink-600">Email</p>
                      <p className="font-semibold text-ink-900">{readText(guest, 'email') || 'No email'}</p>
                    </div>
                  </div>
                  {readText(guest, 'phone') && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-ink-600" aria-hidden="true" />
                      <div>
                        <p className="text-sm text-ink-600">Phone</p>
                        <p className="font-semibold text-ink-900">{readText(guest, 'phone')}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Property Information */}
              <div className="mb-6">
                <h3 className="font-display text-lg font-semibold mb-3 text-ink-900">Property Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-ink-600 mb-1">Property Name</p>
                    <p className="font-semibold text-ink-900 text-lg">{readText(property, 'name') || 'Property not attached'}</p>
                  </div>
                  {readText(property, 'address') && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-ink-600 mt-0.5" aria-hidden="true" />
                      <div>
                        <p className="text-sm text-ink-600 mb-1">Address</p>
                        <p className="font-semibold text-ink-900">{readText(property, 'address')}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {pricingDetails && Object.keys(pricingDetails).length > 0 ? (
                <BookingPricingDetails
                  details={pricingDetails}
                  currency={String(booking.currency ?? 'NAD')}
                />
              ) : null}

              {booking.special_requests && (
                <div>
                  <h3 className="font-display text-lg font-semibold mb-3 text-ink-900">Special Requests</h3>
                  <div className="rounded-etuna-input bg-nude-50 border border-nude-200 p-4">
                    <p className="text-ink-800">{booking.special_requests}</p>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar - Actions */}
          <div className="lg:col-span-1 space-y-6">
            <Card variant="elevated" className="sticky top-6">
              <h3 className="font-display text-lg font-semibold mb-4 text-ink-900">Status Actions</h3>
              <p className="text-sm text-ink-600 mb-4">
                {isStay
                  ? 'Change booking status using validated PMS workflows'
                  : 'Update facility booking status (room housekeeping not affected)'}
              </p>
              <WorkflowStatusActions
                currentStatus={booking.status}
                transitions={BOOKING_STATUS_TRANSITIONS}
                endpoint={`/api/bookings/${booking.id}/status`}
              />
            </Card>

            <BookingFolioSection bookingId={booking.id} bookingStatus={booking.status} />

            <BookingDocumentsSection bookingId={booking.id} />

            <BookingCashPaymentSection
              booking={booking as unknown as BookingCashRow}
              guest={guest}
              property={property}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailsPage;
