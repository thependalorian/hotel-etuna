/**
 * BookingCashPaymentSection
 *
 * Purpose: Dashboard wiring for cash mark-paid (CashPaymentModal) and printable receipt (BookingReceipt) on booking detail.
 * Location: components/features/bookings/BookingCashPaymentSection.tsx
 */

'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CashPaymentModal } from '@/components/features/bookings/CashPaymentModal';
import { BookingReceipt } from '@/components/features/bookings/BookingReceipt';
import { BookingDepositPayCard } from '@/components/payments/BookingDepositPayCard';
import { Button } from '@/components/ui/Button';

function read(record: Record<string, unknown> | null | undefined, key: string): string {
  const v = record?.[key];
  return typeof v === 'string' ? v : v != null ? String(v) : '';
}

export type BookingCashRow = Record<string, unknown> & {
  id: string;
  booking_reference: string;
  check_in_date: string;
  check_out_date: string;
  status: string;
  total_amount?: string | number | null;
  currency?: string | null;
  payment_status?: string | null;
  payment_method?: string | null;
  amount_tendered?: string | number | null;
  change_given?: string | number | null;
  receipt_number?: string | null;
  created_at?: string | Date | null;
};

interface BookingCashPaymentSectionProps {
  booking: BookingCashRow;
  guest: Record<string, unknown> | null | undefined;
  property: Record<string, unknown> | null | undefined;
}

export function BookingCashPaymentSection({
  booking,
  guest,
  property,
}: BookingCashPaymentSectionProps) {
  const router = useRouter();
  const [showCashModal, setShowCashModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const pm = (booking.payment_method ?? '').toLowerCase().trim();
  const ps = (booking.payment_status ?? '').toLowerCase().trim();

  const total = Number(booking.total_amount ?? 0);
  const currency = booking.currency ?? 'NAD';

  const canMarkCashPaid = pm === 'cash' && ps === 'pending';
  const canPayCardDeposit = ps === 'pending' && total > 0;

  const canShowReceipt =
    pm === 'cash' &&
    ps === 'paid' &&
    Boolean(booking.receipt_number?.toString().trim());

  return (
    <div className="rounded-lg bg-nude-50 border border-nude-200 p-4 space-y-4">
      <div>
        <h3 className="font-display text-lg font-semibold text-nude-900 mb-2">Payments</h3>
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="badge badge-outline">
            Method: {(booking.payment_method as string)?.toUpperCase() || '—'}
          </span>
          <span className={`badge ${ps === 'paid' ? 'badge-success' : 'badge-warning'}`}>
            Payment: {booking.payment_status || 'pending'}
          </span>
        </div>
        {pm === 'cash' && ps === 'paid' && booking.receipt_number && (
          <p className="text-sm text-nude-700 mt-2 font-mono">
            Receipt: {String(booking.receipt_number)}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {canMarkCashPaid && (
          <Button type="button" variant="primary" size="md" onClick={() => setShowCashModal(true)}>
            Mark as Paid (Cash)
          </Button>
        )}

        {canPayCardDeposit && (
          <BookingDepositPayCard
            bookingId={booking.id}
            bookingReference={booking.booking_reference}
            amount={total}
            currency={String(currency)}
          />
        )}

        {canShowReceipt && (
          <>
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setShowReceiptModal(true)}
            >
              View / Print Receipt
            </Button>
            {showReceiptModal && (
              <div className="modal modal-open">
                <div className="modal-box w-full max-w-lg mx-4 sm:mx-auto sm:max-w-3xl max-h-[92vh] overflow-y-auto bg-white">
                  <BookingReceipt
                    booking={{
                      id: booking.id,
                      bookingReference: booking.booking_reference,
                      receiptNumber: String(booking.receipt_number ?? ''),
                      totalAmount: String(booking.total_amount ?? '0'),
                      amountTendered: String(booking.amount_tendered ?? '0'),
                      changeGiven: String(booking.change_given ?? '0'),
                      currency: String(currency),
                      paymentMethod: booking.payment_method as string,
                      checkInDate: booking.check_in_date,
                      checkOutDate: booking.check_out_date,
                      status: booking.status,
                      createdAt: booking.created_at
                        ? new Date(booking.created_at as string | Date)
                        : new Date(),
                    }}
                    guest={{
                      firstName: read(guest, 'first_name') || read(guest, 'firstName'),
                      lastName: read(guest, 'last_name') || read(guest, 'lastName'),
                      email: read(guest, 'email') || undefined,
                      phone: read(guest, 'phone') || undefined,
                    }}
                    property={{
                      name: read(property, 'name') || 'Hotel Etuna',
                      address: read(property, 'address') || undefined,
                    }}
                    rooms={[]}
                  />
                  <div className="modal-action print:hidden mt-6">
                    <Button type="button" variant="outline" onClick={() => setShowReceiptModal(false)}>
                      Close
                    </Button>
                  </div>
                </div>
                <div className="modal-backdrop bg-black/50" onClick={() => setShowReceiptModal(false)} />
              </div>
            )}
          </>
        )}
      </div>

      <CashPaymentModal
        isOpen={showCashModal}
        onClose={() => setShowCashModal(false)}
        bookingId={booking.id}
        bookingReference={booking.booking_reference}
        totalAmount={total}
        currency={String(currency)}
        onSuccess={() => {
          setShowCashModal(false);
          router.refresh();
        }}
      />
    </div>
  );
}
