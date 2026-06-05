/**
 * Fraud Detection Dashboard
 *
 * Purpose: Real-time fraud monitoring for the authenticated tenant.
 * Location: app/(dashboard)/fraud/page.tsx
 */

import { Metadata } from 'next';
import { getSessionWithTenantContext } from '@/lib/auth/tenant-context';
import { redirect } from 'next/navigation';
import { FraudDashboard } from '@/components/features/fraud/FraudDashboard';

export const metadata: Metadata = {
  title: 'Fraud Detection',
  description: 'Real-time fraud detection and prevention dashboard',
};

export const dynamic = 'force-dynamic';

export default async function FraudDetectionPage() {
  const session = await getSessionWithTenantContext();
  if (!session?.user?.tenantId) redirect('/login');

  return (
    <div className="container mx-auto px-4 py-8">
      <FraudDashboard tenantId={session.user.tenantId as string} />
    </div>
  );
}
