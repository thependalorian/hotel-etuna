/**
 * Staff profile hub — details, links to schedule and edit.
 * Location: app/(dashboard)/staff/[id]/page.tsx
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { StaffService } from '@/lib/services/staff/StaffService';
import { getSessionWithTenantContext } from '@/lib/auth/tenant-context';

interface StaffProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function StaffProfilePage({ params }: StaffProfilePageProps) {
  const { id } = await params;
  const session = await getSessionWithTenantContext();
  const tenantId = session?.user?.tenantId;
  if (!tenantId) notFound();

  const service = new StaffService();
  const member = await service.getStaffById(id, tenantId);
  if (!member) notFound();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="etuna-page-title mb-1">
            {member.firstName} {member.lastName}
          </h1>
          <p className="text-base-content/70">
            {member.position}
            {member.department ? ` · ${member.department}` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/staff/${id}/schedule`} className="btn btn-outline rounded-full px-6">
            Schedule
          </Link>
          <Link href={`/staff/${id}/edit`} className="btn btn-primary rounded-full px-6">
            Edit
          </Link>
        </div>
      </div>

      <div className="card bg-base-100 shadow-lg">
        <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-base-content/60">Employee #</p>
            <p className="font-medium">{member.employeeNumber}</p>
          </div>
          <div>
            <p className="text-sm text-base-content/60">Status</p>
            <p className="font-medium capitalize">{member.status}</p>
          </div>
          <div>
            <p className="text-sm text-base-content/60">Email</p>
            <p className="font-medium">{member.email ?? '—'}</p>
          </div>
          <div>
            <p className="text-sm text-base-content/60">Phone</p>
            <p className="font-medium">{member.phone ?? '—'}</p>
          </div>
          <div>
            <p className="text-sm text-base-content/60">Hire date</p>
            <p className="font-medium">{member.hireDate}</p>
          </div>
          <div>
            <p className="text-sm text-base-content/60">Salary</p>
            <p className="font-medium">
              {member.salary ? `${member.currency ?? 'NAD'} ${member.salary}` : '—'}
            </p>
          </div>
        </div>
      </div>

      <Link href="/staff" className="btn btn-ghost rounded-full px-6">
        ← Back to staff list
      </Link>
    </div>
  );
}
