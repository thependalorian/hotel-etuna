/**
 * Edit staff member — compensation and employment details.
 * Location: app/(dashboard)/staff/[id]/edit/page.tsx
 */

import { notFound } from 'next/navigation';
import StaffEditForm from '@/components/features/staff/StaffEditForm';
import { StaffService } from '@/lib/services/staff/StaffService';
import { getSessionWithTenantContext } from '@/lib/auth/tenant-context';

interface StaffEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function StaffEditPage({ params }: StaffEditPageProps) {
  const { id } = await params;
  const session = await getSessionWithTenantContext();
  const tenantId = session?.user?.tenantId;
  if (!tenantId) notFound();

  const service = new StaffService();
  const member = await service.getStaffById(id, tenantId);
  if (!member) notFound();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="etuna-page-title mb-2">Edit Staff Member</h1>
        <p className="text-base-content/70">
          {member.firstName} {member.lastName}
        </p>
      </div>
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <StaffEditForm staff={member} />
        </div>
      </div>
    </div>
  );
}
