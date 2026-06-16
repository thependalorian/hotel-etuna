/**
 * BookingDetailLoadError — retry UI when staff booking detail fails to load.
 * Location: components/features/booking/BookingDetailLoadError.tsx
 */

'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ErrorDisplay from '@/components/shared/ErrorDisplay';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export function BookingDetailLoadError() {
  const router = useRouter();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <Card variant="elevated" className="py-8">
        <ErrorDisplay
          variant="full"
          title="Error loading booking"
          error="Unable to load booking details. This may be a temporary network issue."
          onRetry={() => router.refresh()}
        />
        <div className="flex justify-center pb-8">
          <Button asChild variant="outline">
            <Link href="/bookings">Back to bookings</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
