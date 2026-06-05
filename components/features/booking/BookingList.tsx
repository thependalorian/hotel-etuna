import { BookingService } from '@/lib/services/booking/BookingService';
import { Card, CardContent } from '@/components/ui/Card';
import { format } from 'date-fns';
import { StatusBadge } from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import Link from 'next/link';
import { Calendar, User, MapPin } from 'lucide-react';
import {
  bookingKindBadgeClass,
  bookingKindLabel,
  checkInDateLabel,
  checkOutDateLabel,
  type BookingKind,
} from '@/lib/bookings/booking-kind';

type BookingListRow = {
  id: string;
  guest_id?: string | null;
  booking_reference?: string | null;
  bookingReference?: string | null;
  status: string;
  check_in_date?: string | Date | null;
  checkInDate?: string | Date | null;
  check_out_date?: string | Date | null;
  checkOutDate?: string | Date | null;
  room_count?: number | null;
  roomCount?: number | null;
  booking_kind?: string | null;
  bookingKind?: string | null;
  room_type?: string | null;
  roomType?: string | null;
};

interface BookingListProps {
  propertyId: string;
  tenantId: string;
  bookingKindFilter?: BookingKind;
}

function formatBookingDate(value: string | Date | null | undefined): string {
  if (!value) {
    return 'Not scheduled';
  }

  return format(new Date(value), 'PPP');
}

export async function BookingList({
  propertyId,
  tenantId,
  bookingKindFilter,
}: BookingListProps) {
  const bookingService = new BookingService();
  const bookings = propertyId
    ? (await bookingService.getBookingsForProperty(propertyId, tenantId, {
        bookingKind: bookingKindFilter,
      })) as BookingListRow[]
    : [];

  if (!propertyId) {
    return (
      <EmptyState
        title="Select a Property"
        description="Choose a property to view its bookings."
        size="md"
      />
    );
  }

  return (
    <div className="space-y-4">
      {bookings.length === 0 ? (
        <EmptyState
          title="No Bookings Found"
          description="Start by creating your first booking for this property."
          size="md"
        />
      ) : (
        <div className="space-y-4">
          {bookings.map((booking, index) => (
            <Card 
              key={booking.id} 
              variant="elevated"
              className="animate-slide-up hover:shadow-nude-medium hover:-translate-y-0.5 transition-all duration-200"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-6">
                {/* Header with Reference and Status */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                  <div className="flex-1">
                    <h3 className="font-display text-lg font-semibold text-nude-900 mb-1">
                      {booking.bookingReference ?? booking.booking_reference ?? booking.id}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-nude-600">
                      <User className="w-4 h-4" aria-hidden="true" />
                      <span>Guest: {booking.guest_id ?? 'Not assigned'}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={bookingKindBadgeClass(
                        booking.bookingKind ?? booking.booking_kind
                      )}
                    >
                      {bookingKindLabel(booking.bookingKind ?? booking.booking_kind)}
                    </span>
                    <StatusBadge status={booking.status} showDot />
                  </div>
                </div>
                {(booking.roomType ?? booking.room_type) ? (
                  <p className="text-sm text-nude-600 mb-2">{booking.roomType ?? booking.room_type}</p>
                ) : null}
                
                {/* Date Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-nude-50 rounded-lg border border-nude-200">
                  <div>
                    <p className="text-xs font-semibold text-nude-700 mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" aria-hidden="true" />
                      {checkInDateLabel(booking.bookingKind ?? booking.booking_kind)}
                    </p>
                    <p className="font-medium text-nude-900">
                      {formatBookingDate(booking.checkInDate ?? booking.check_in_date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-nude-700 mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" aria-hidden="true" />
                      {checkOutDateLabel(booking.bookingKind ?? booking.booking_kind)}
                    </p>
                    <p className="font-medium text-nude-900">
                      {formatBookingDate(booking.checkOutDate ?? booking.check_out_date)}
                    </p>
                  </div>
                </div>
                
                {/* Room Count */}
                {(booking.roomCount ?? booking.room_count ?? 0) > 0 && (
                  <div className="mb-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-nude-100 text-nude-800 rounded-full text-sm font-medium">
                      <MapPin className="w-4 h-4" aria-hidden="true" />
                      {booking.roomCount ?? booking.room_count} room{(booking.roomCount ?? booking.room_count) === 1 ? '' : 's'}
                    </div>
                  </div>
                )}
                
                {/* Action Button */}
                <div className="flex justify-end pt-4 border-t border-nude-200">
                  <Link 
                    href={`/bookings/${booking.id}`} 
                    className="inline-flex items-center gap-2 px-4 py-2 bg-nude-600 text-white rounded-lg font-semibold text-sm hover:bg-nude-700 transition-colors duration-200 min-h-[44px]"
                  >
                    View Details
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}