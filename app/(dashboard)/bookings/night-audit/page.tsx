/**
 * Night Audit Page — end-of-day operations for property managers.
 *
 * Purpose: Dedicated route for night audit panel (OSS W5).
 * Location: /app/(dashboard)/bookings/night-audit/page.tsx
 */

import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';
import { NightAuditPanel } from '@/components/features/booking/NightAuditPanel';
import { getSessionWithTenantContext } from '@/lib/auth/tenant-context';
import { resolvePublicHubProperty } from '@/lib/utils/public-property';
import { Card } from '@/components/ui/Card';

export const dynamic = 'force-dynamic';

export default async function NightAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ propertyId?: string }>;
}) {
  const session = await getSessionWithTenantContext();
  const params = await searchParams;

  let propertyId = params.propertyId ?? '';
  if (!propertyId && session?.user?.tenantId) {
    try {
      const { property } = await resolvePublicHubProperty();
      propertyId = property.id;
    } catch {
      propertyId = '';
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Night audit"
          description="End-of-day folio posting, no-show processing, and revenue summary"
          actions={
            <Link
              href="/bookings"
              className="btn btn-outline rounded-full px-6 min-h-[44px]"
            >
              Back to bookings
            </Link>
          }
        />

        {session?.user?.tenantId && propertyId ? (
          <NightAuditPanel propertyId={propertyId} />
        ) : (
          <Card variant="elevated" className="text-center py-12">
            <p className="text-nude-600">
              {session?.user?.tenantId
                ? 'No hub property found. Set DEFAULT_PROPERTY_ID or pass ?propertyId=.'
                : 'Please log in to run night audit.'}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
