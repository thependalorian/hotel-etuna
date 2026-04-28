'use client';

import { useEffect } from 'react';
import ErrorDisplay from '@/components/shared/ErrorDisplay';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console for debugging
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="max-w-md w-full">
        <ErrorDisplay
          error={error.message || 'An unexpected error occurred'}
          title="Something went wrong"
          variant="full"
        />
        <div className="mt-6 flex gap-4 justify-center">
          <Button onClick={reset} variant="default">
            Try Again
          </Button>
          <Link href="/properties">
            <Button variant="outline">
              Go to Properties
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
