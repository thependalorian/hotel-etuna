/**
 * Public Booking Page
 *
 * Purpose: Public-facing booking page with marketing chrome and secure booking form.
 * Location: /app/public-properties/[slug]/book/page.tsx
 */

import { BookingForm } from '@/components/features/booking/BookingForm';
import { Suspense } from 'react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import NavigationHeader from '@/components/sections/landing/NavigationHeader';
import Footer from '@/components/shared/Footer';

function BookingPageContent() {
  return (
    <div className="min-h-screen bg-surface-background flex flex-col">
      <NavigationHeader />
      <main id="main-content" className="flex-1">
        <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="etuna-page-title mb-4">Book Your Stay</h1>
              <p className="text-lg text-base-content/70">
                Complete your reservation in just a few steps. Secure booking with instant confirmation.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-6 mb-8 text-sm text-base-content/60">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Secure Booking
              </span>
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Instant Confirmation
              </span>
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Best Rate Guarantee
              </span>
            </div>

            <div className="card bg-base-100 shadow-xl">
              <div className="card-body p-8">
                <BookingForm />
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner size="lg" text="Loading booking form..." />
        </div>
      }
    >
      <BookingPageContent />
    </Suspense>
  );
}
