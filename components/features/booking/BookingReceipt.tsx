/**
 * Booking Receipt Component
 *
 * Purpose: Printable receipt for cash payments
 * Location: components/features/booking/BookingReceipt.tsx
 */

'use client';

import { Button } from '@/components/ui/Button';
import { PropertyHospitalityVatNote } from '@/components/features/tax/PropertyHospitalityVatNote';

interface BookingReceiptProps {
  booking: {
    id: string;
    bookingReference: string;
    receiptNumber: string;
    totalAmount: string;
    amountTendered: string;
    changeGiven: string;
    currency: string;
    paymentMethod: string;
    checkInDate: string;
    checkOutDate: string;
    status: string;
    createdAt: Date;
  };
  guest: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
  property: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  rooms?: Array<{
    roomNumber?: string;
    roomType?: string;
    rateAmount: string;
  }>;
}

export function BookingReceipt({ booking, guest, property, rooms = [] }: BookingReceiptProps) {
  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('en-NA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleString('en-NA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="print:hidden mb-4 flex gap-3">
        <Button onClick={handlePrint} variant="primary">
          Print Receipt
        </Button>
      </div>

      <div className="bg-white border-2 border-nude-300 rounded-etuna-input p-8 print:border-0">
        <div className="text-center mb-8 border-b-2 border-nude-200 pb-6">
          <h1 className="text-3xl font-bold text-ci-secondary-chocolate mb-2">{property.name}</h1>
          {property.address && <p className="text-sm text-ink-600">{property.address}</p>}
          <div className="flex justify-center gap-4 text-sm text-ink-600 mt-2">
            {property.phone && <span>Tel: {property.phone}</span>}
            {property.email && <span>Email: {property.email}</span>}
          </div>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-ink-900 mb-1">PAYMENT RECEIPT</h2>
          <p className="text-sm text-ink-500">Issued: {formatDateTime(booking.createdAt)}</p>
        </div>

        <div className="bg-nude-50 border border-nude-200 rounded-etuna-input p-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-ink-600">Receipt Number:</span>
            <span className="text-lg font-mono font-bold text-ink-900">{booking.receiptNumber}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <p className="text-ink-600 font-medium mb-1">Booking Reference:</p>
            <p className="text-ink-900 font-semibold">{booking.bookingReference}</p>
          </div>
          <div>
            <p className="text-ink-600 font-medium mb-1">Payment Method:</p>
            <p className="text-ink-900 font-semibold capitalize">{booking.paymentMethod}</p>
          </div>
          <div>
            <p className="text-ink-600 font-medium mb-1">Check-In:</p>
            <p className="text-ink-900">{formatDate(booking.checkInDate)}</p>
          </div>
          <div>
            <p className="text-ink-600 font-medium mb-1">Check-Out:</p>
            <p className="text-ink-900">{formatDate(booking.checkOutDate)}</p>
          </div>
        </div>

        <div className="border-t border-nude-200 pt-4 mb-6">
          <h3 className="text-sm font-bold text-ink-700 mb-3">GUEST INFORMATION</h3>
          <div className="text-sm">
            <p className="text-ink-900 font-semibold mb-1">
              {guest.firstName} {guest.lastName}
            </p>
            {guest.email && <p className="text-ink-600">Email: {guest.email}</p>}
            {guest.phone && <p className="text-ink-600">Phone: {guest.phone}</p>}
          </div>
        </div>

        {rooms.length > 0 && (
          <div className="border-t border-nude-200 pt-4 mb-6">
            <h3 className="text-sm font-bold text-ink-700 mb-3">ROOM DETAILS</h3>
            <div className="space-y-2">
              {rooms.map((room, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-ink-700">
                    {room.roomNumber ? `Room ${room.roomNumber}` : room.roomType || 'Room'}
                  </span>
                  <span className="text-ink-900 font-semibold">
                    {booking.currency} {Number.parseFloat(room.rateAmount).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t-2 border-nude-300 pt-4 mb-6">
          <h3 className="text-sm font-bold text-ink-700 mb-3">PAYMENT SUMMARY</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-700">Total Amount:</span>
              <span className="text-ink-900 font-semibold">
                {booking.currency} {Number.parseFloat(booking.totalAmount).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-700">Amount Tendered:</span>
              <span className="text-ink-900 font-semibold">
                {booking.currency} {Number.parseFloat(booking.amountTendered).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-nude-200">
              <span className="text-ink-700 font-bold">Change Given:</span>
              <span className="text-green-700 font-bold text-lg">
                {booking.currency} {Number.parseFloat(booking.changeGiven).toFixed(2)}
              </span>
            </div>
          </div>
          <PropertyHospitalityVatNote
            amount={Number.parseFloat(booking.totalAmount)}
            currency={booking.currency}
            className="mt-4"
          />
        </div>
      </div>
    </div>
  );
}

