'use client';

import React, { Suspense } from 'react';
import { BookingForm } from '@/components/features/booking/BookingForm';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

// Disable static generation for this page (requires client-side session)
export const dynamic = 'force-dynamic';

const NewBookingPage = () => {
  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div>
        <h1 className="buffr-page-title buffr-page-title--fluid mb-2">Create New Booking</h1>
        <p className="text-sm sm:text-base text-base-content/70">Add a new booking for a guest</p>
      </div>
      <div className="card bg-base-100 shadow-lg card-hover">
        <div className="card-body p-4 sm:p-6 md:p-8">
          <Suspense fallback={<LoadingSpinner size="lg" text="Loading booking form..." />}>
            <BookingForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default NewBookingPage;