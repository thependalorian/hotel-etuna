/**
 * Walk-In Booking Page — Create bookings for guests at the front desk
 * Location: app/(dashboard)/desk/walk-in/page.tsx
 *
 * Purpose: Streamlined interface for front desk staff to create walk-in bookings
 * - Quick guest information capture
 * - Room selection and availability check
 * - Immediate booking creation
 * - Integration with introducer tracking
 */

'use client';

import { Card } from '@/components/ui/Card';
import { WalkInBookingForm } from '@/components/features/desk/WalkInBookingForm';
import Link from 'next/link';

export default function WalkInBookingPage() {
  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Walk-In Booking</h1>
          <p className="text-sm text-base-content/70">
            Create a new booking for a guest at the front desk
          </p>
        </div>
        <Link href="/desk" className="btn btn-ghost btn-sm">
          ← Back to Desk
        </Link>
      </div>

      {/* Instructions Card */}
      <Card className="p-4 bg-info/10 border-info/20">
        <div className="flex gap-3">
          <svg className="h-5 w-5 text-info flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm space-y-1">
            <p className="font-medium">Walk-In Booking Guidelines:</p>
            <ul className="list-disc list-inside space-y-0.5 text-base-content/80">
              <li>Verify guest ID before proceeding</li>
              <li>Check room availability in real-time</li>
              <li>Collect payment or deposit before finalizing</li>
              <li>If guest was referred by an introducer, enter their code</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Booking Form */}
      <Card className="p-6">
        <WalkInBookingForm />
      </Card>
    </div>
  );
}
