/**
 * Staff shift schedule — calendar view for one employee.
 * Location: app/(dashboard)/staff/[id]/schedule/page.tsx
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import ScheduleCalendar from '@/components/features/staff/ScheduleCalendar';
import { StaffService } from '@/lib/services/staff/StaffService';
import { getSessionWithTenantContext } from '@/lib/auth/tenant-context';

interface StaffSchedulePageProps {
  params: Promise<{ id: string }>;
}

export default async function StaffSchedulePage({ params }: StaffSchedulePageProps) {
  const { id } = await params;
  const session = await getSessionWithTenantContext();
  const tenantId = session?.user?.tenantId;
  if (!tenantId) notFound();

  const service = new StaffService();
  const member = await service.getStaffById(id, tenantId);
  if (!member || !member.propertyId) notFound();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="etuna-page-title mb-1">Schedule</h1>
          <p className="text-base-content/70">
            {member.firstName} {member.lastName}
          </p>
        </div>
        <Link href={`/staff/${id}`} className="btn btn-ghost rounded-full px-6">
          ← Profile
        </Link>
      </div>
      <ScheduleCalendar staffId={id} propertyId={member.propertyId} />
    </div>
  );
}
