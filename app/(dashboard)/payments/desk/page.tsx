/**
 * Payments desk — NamQR generation + manual EFT / e-wallet recording.
 * Location: app/(dashboard)/payments/desk/page.tsx
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ManualPaymentForm } from '@/components/features/payments/ManualPaymentForm';
import { NamQrDeskPanel } from '@/components/features/payments/NamQrDeskPanel';
import { NamQrPendingQueue } from '@/components/features/payments/NamQrPendingQueue';
import { PaymentsDeskBookingPicker } from '@/components/features/payments/PaymentsDeskBookingPicker';

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
        <Button asChild variant="ghost" size="sm">
          <Link href="/payments/reconciliation">Payment reconciliation →</Link>
        </Button>
      </div>

      <Card className="p-4 md:p-6">
        <PaymentsDeskBookingPicker value={bookingId} onChange={(id) => setBookingId(id)} />
        {bookingId ? (
          <p className="mt-3 text-sm">
            <Link href={`/bookings/${bookingId}#documents`} className="link link-primary">
              Open booking documents
            </Link>
          </p>
        ) : null}
      </Card>

      <Card className="p-4 md:p-6">
        <h2 className="mb-4 text-lg font-semibold">Guest NamQR — awaiting approval</h2>
        <NamQrPendingQueue />
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
            <p className="text-sm text-warning">Find a booking above to record a payment.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
