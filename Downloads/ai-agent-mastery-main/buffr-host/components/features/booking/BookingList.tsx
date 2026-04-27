import { BookingService } from '@/lib/services/booking/BookingService';
import { Card, CardContent } from '@/components/ui/Card';
import { format } from 'date-fns';
import { cn } from '@/lib/utils/cn';
import { bookingStatusBadgeClass } from '@/lib/utils/status-normalize';
import EmptyState from '@/components/shared/EmptyState';
import Link from 'next/link';

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
};

interface BookingListProps {
  propertyId: string;
  tenantId: string;
}

function formatBookingDate(value: string | Date | null | undefined): string {
  if (!value) {
    return 'Not scheduled';
  }

  return format(new Date(value), 'PPP');
}

export async function BookingList({ propertyId, tenantId }: BookingListProps) {
  const bookingService = new BookingService();
  const bookings = propertyId
    ? await bookingService.getBookingsForProperty(propertyId, tenantId) as BookingListRow[]
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
              className="animate-slide-up dashboard-card-hover"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                  <div>
                    <p className="font-bold text-lg text-base-content mb-1">
                      Ref: {booking.bookingReference ?? booking.booking_reference ?? booking.id}
                    </p>
                    <p className="text-sm text-base-content/70">
                      Guest ID: {booking.guest_id ?? 'Not assigned'}
                    </p>
                  </div>
                  <div
                    className={cn('badge badge-lg', bookingStatusBadgeClass(booking.status))}
                  >
                    {booking.status}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-base-200 rounded-lg">
                  <div>
                    <p className="text-xs text-base-content/60 mb-1">Check-in</p>
                    <p className="font-medium text-base-content">
                      {formatBookingDate(booking.checkInDate ?? booking.check_in_date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-base-content/60 mb-1">Check-out</p>
                    <p className="font-medium text-base-content">
                      {formatBookingDate(booking.checkOutDate ?? booking.check_out_date)}
                    </p>
                  </div>
                </div>
                
                {(booking.roomCount ?? booking.room_count ?? 0) > 0 && (
                  <div>
                    <p className="font-medium text-base-content mb-2">Rooms</p>
                    <div className="badge badge-outline">
                      {booking.roomCount ?? booking.room_count} room{(booking.roomCount ?? booking.room_count) === 1 ? '' : 's'}
                    </div>
                  </div>
                )}
                <div className="mt-5 flex justify-end">
                  <Link href={`/bookings/${booking.id}`} className="btn btn-outline btn-sm min-h-[40px]">
                    View workflow
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