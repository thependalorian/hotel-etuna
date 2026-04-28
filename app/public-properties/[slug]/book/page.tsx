/**
 * Public Booking Page
 * 
 * Purpose: Public-facing booking page with professional booking experience
 * Location: /app/public-properties/[slug]/book/page.tsx
 * 
 * Features:
 * - Professional header with trust indicators
 * - Secure booking form
 * - Trust badges (Secure Booking, Instant Confirmation, Best Rate Guarantee)
 * - Responsive design
 * 
 * Design System:
 * - Uses semantic tokens: text-base-content, bg-base-100
 * - Professional typography with font-display
 * - Card-based layout
 * 
 * Accessibility:
 * - Proper heading hierarchy
 * - Semantic HTML structure
 * - Loading states with Suspense
 * 
 * @module PublicBookingPage
 */

import { BookingForm } from '@/components/features/booking/BookingForm';
import { Suspense } from 'react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

function BookingPageContent() {
  return (
    <div className="min-h-screen bg-base-100">
      <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="buffr-page-title mb-4">Book Your Stay</h1>
            <p className="text-lg text-base-content/70">
              Complete your reservation in just a few steps. Secure booking with instant confirmation.
            </p>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-6 mb-8 text-sm text-base-content/60">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Secure Booking
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Instant Confirmation
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Best Rate Guarantee
            </span>
          </div>

          {/* Booking Form */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body p-8">
              <BookingForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading booking form..." />
      </div>
    }>
      <BookingPageContent />
    </Suspense>
  );
}