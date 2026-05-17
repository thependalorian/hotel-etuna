/**
 * Payments desk — NamQR generation + manual EFT / e-wallet recording.
 * Location: app/(dashboard)/payments/desk/page.tsx
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { ManualPaymentForm } from '@/components/features/payments/ManualPaymentForm';
import { NamQrDeskPanel } from '@/components/features/payments/NamQrDeskPanel';

export default function PaymentsDeskPage() {
  const [bookingId, setBookingId] = useState('');

  return (
    <div className="container mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Payments desk</h1>
          <p className="text-sm text-base-content/70">
            NamQR v5.0 desk QR and off-platform payment recording (EFT, e-wallet, NamQR bank app).
          </p>
        </div>
        <Link href="/payments/reconciliation" className="btn btn-ghost btn-sm">
          Cash reconciliation →
        </Link>
      </div>

      <Card className="p-4 md:p-6">
        <label className="label" htmlFor="desk-booking-id">
          <span className="label-text font-medium">Booking ID</span>
        </label>
        <input
          id="desk-booking-id"
          type="text"
          className="input input-bordered w-full font-mono text-sm"
          placeholder="Paste booking UUID from /bookings"
          value={bookingId}
          onChange={(e) => setBookingId(e.target.value)}
        />
        <p className="mt-2 text-xs text-base-content/60">
          Open a booking in Bookings, copy its ID, then record payment or tie NamQR to the stay.
        </p>
      </Card>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
        <Card className="p-4 md:p-6">
          <h2 className="mb-4 text-lg font-semibold">Generate NamQR</h2>
          <NamQrDeskPanel bookingId={bookingId || undefined} />
        </Card>
        <Card className="p-4 md:p-6">
          <h2 className="mb-4 text-lg font-semibold">Record bank / wallet payment</h2>
          {bookingId ? (
            <ManualPaymentForm bookingId={bookingId} />
          ) : (
            <p className="text-sm text-warning">Enter a booking ID above to record a payment.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
