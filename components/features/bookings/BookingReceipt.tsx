/**
 * Booking Receipt Component
 * 
 * Purpose: Printable receipt for cash payments
 * Location: components/features/bookings/BookingReceipt.tsx
 * 
 * Features:
 * - Hotel branding
 * - Booking details
 * - Payment breakdown
 * - Receipt number
 * - Print functionality
 * 
 * @version 1.0.0
 * @since April 28, 2026
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

export function BookingReceipt({
  booking,
  guest,
  property,
  rooms = [],
}: BookingReceiptProps) {
  
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
      {/* Print Button (Hidden when printing) */}
      <div className="print:hidden mb-4 flex gap-3">
        <Button onClick={handlePrint} variant="primary">
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print Receipt
        </Button>
      </div>

      {/* Receipt (Printable) */}
      <div className="bg-white border-2 border-gray-300 rounded-lg p-8 print:border-0">
        {/* Header */}
        <div className="text-center mb-8 border-b-2 border-nude-200 pb-6">
          <h1 className="text-3xl font-bold text-terracotta-900 mb-2">
            {property.name}
          </h1>
          {property.address && (
            <p className="text-sm text-nude-600">{property.address}</p>
          )}
          <div className="flex justify-center gap-4 text-sm text-nude-600 mt-2">
            {property.phone && <span>Tel: {property.phone}</span>}
            {property.email && <span>Email: {property.email}</span>}
          </div>
        </div>

        {/* Receipt Title */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-nude-900 mb-1">PAYMENT RECEIPT</h2>
          <p className="text-sm text-nude-500">
            Issued: {formatDateTime(booking.createdAt)}
          </p>
        </div>

        {/* Receipt Number */}
        <div className="bg-gray-50 border border-nude-200 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-nude-600">Receipt Number:</span>
            <span className="text-lg font-mono font-bold text-nude-900">
              {booking.receiptNumber}
            </span>
          </div>
        </div>

        {/* Booking Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <p className="text-nude-600 font-medium mb-1">Booking Reference:</p>
            <p className="text-nude-900 font-semibold">{booking.bookingReference}</p>
          </div>
          <div>
            <p className="text-nude-600 font-medium mb-1">Payment Method:</p>
            <p className="text-nude-900 font-semibold capitalize">{booking.paymentMethod}</p>
          </div>
          <div>
            <p className="text-nude-600 font-medium mb-1">Check-In:</p>
            <p className="text-nude-900">{formatDate(booking.checkInDate)}</p>
          </div>
          <div>
            <p className="text-nude-600 font-medium mb-1">Check-Out:</p>
            <p className="text-nude-900">{formatDate(booking.checkOutDate)}</p>
          </div>
        </div>

        {/* Guest Details */}
        <div className="border-t border-nude-200 pt-4 mb-6">
          <h3 className="text-sm font-bold text-nude-700 mb-3">GUEST INFORMATION</h3>
          <div className="text-sm">
            <p className="text-nude-900 font-semibold mb-1">
              {guest.firstName} {guest.lastName}
            </p>
            {guest.email && (
              <p className="text-nude-600">Email: {guest.email}</p>
            )}
            {guest.phone && (
              <p className="text-nude-600">Phone: {guest.phone}</p>
            )}
          </div>
        </div>

        {/* Room Details */}
        {rooms.length > 0 && (
          <div className="border-t border-nude-200 pt-4 mb-6">
            <h3 className="text-sm font-bold text-nude-700 mb-3">ROOM DETAILS</h3>
            <div className="space-y-2">
              {rooms.map((room, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-nude-700">
                    {room.roomNumber ? `Room ${room.roomNumber}` : room.roomType || 'Room'}
                  </span>
                  <span className="text-nude-900 font-semibold">
                    {booking.currency} {parseFloat(room.rateAmount).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment Summary */}
        <div className="border-t-2 border-gray-300 pt-4 mb-6">
          <h3 className="text-sm font-bold text-nude-700 mb-3">PAYMENT SUMMARY</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-nude-700">Total Amount:</span>
              <span className="text-nude-900 font-semibold">
                {booking.currency} {parseFloat(booking.totalAmount).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-nude-700">Amount Tendered:</span>
              <span className="text-nude-900 font-semibold">
                {booking.currency} {parseFloat(booking.amountTendered).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-nude-200">
              <span className="text-nude-700 font-bold">Change Given:</span>
              <span className="text-green-700 font-bold text-lg">
                {booking.currency} {parseFloat(booking.changeGiven).toFixed(2)}
              </span>
            </div>
          </div>
          <PropertyHospitalityVatNote
            amount={parseFloat(booking.totalAmount)}
            currency={booking.currency}
            className="mt-4"
          />
        </div>

        {/* Payment Status */}
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center gap-2">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-lg font-bold text-green-700">PAID IN FULL</span>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-nude-200 pt-6 text-center text-xs text-nude-500">
          <p className="mb-2">Thank you for choosing {property.name}!</p>
          <p>This is a computer-generated receipt and does not require a signature.</p>
          <p className="mt-4">For inquiries, please contact us at {property.email || property.phone}</p>
        </div>

        {/* Staff Signature Line (for manual records) */}
        <div className="mt-8 pt-6 border-t border-gray-300 print:block hidden">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <div className="border-b border-gray-400 mb-2 h-8"></div>
              <p className="text-xs text-nude-600 text-center">Staff Signature</p>
            </div>
            <div>
              <div className="border-b border-gray-400 mb-2 h-8"></div>
              <p className="text-xs text-nude-600 text-center">Date</p>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            margin: 0;
            padding: 20px;
          }
          @page {
            size: A4;
            margin: 15mm;
          }
        }
      `}</style>
    </div>
  );
}
