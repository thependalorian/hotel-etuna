/**
 * Dashboard segment 404 — shown inside sidebar layout when notFound() is triggered
 *
 * Purpose: Consistent in-app navigation for missing resources under (dashboard).
 * Location: app/(dashboard)/not-found.tsx
 */

import Link from 'next/link';
import { FileQuestion } from 'lucide-react';

export default function DashboardSegmentNotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-base-200">
        <FileQuestion className="h-10 w-10 text-base-content/60" aria-hidden />
      </div>
      <h1 className="etuna-page-title--compact">This page doesn&apos;t exist</h1>
      <p className="mb-6 max-w-md text-base-content/70">
        The resource may have been removed, or the link is incorrect.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/properties" className="btn btn-primary min-h-[44px]">
          Properties
        </Link>
        <Link href="/bookings" className="btn btn-outline min-h-[44px]">
          Bookings
        </Link>
      </div>
    </div>
  );
}
