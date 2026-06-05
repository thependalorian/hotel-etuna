'use client';

import { useState } from 'react';
import { apiUrl } from '@/lib/utils/api-url';
import Link from 'next/link';
import type { Staff, Property } from '@/lib/db/schema';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Plus, Search, Edit, Trash2, Users, Calendar, Mail, Phone } from 'lucide-react';
import { securityLogger } from '@/lib/utils/security-logger.client';

type StaffWithProperty = Staff & {
  property?: Property | null;
};

interface StaffListProps {
  initialStaff: StaffWithProperty[];
  properties: Property[];
}

export default function StaffList({ initialStaff, properties }: StaffListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [staff, setStaff] = useState<StaffWithProperty[]>(initialStaff);

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  const deleteStaffMember = async (staffId: string) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;

    try {
      const response = await fetch(apiUrl(`/api/staff/${staffId}`), {
        method: 'DELETE',
      });

      if (response.ok) {
        setStaff(staff.filter((s) => s.id !== staffId));
      }
    } catch (error) {
      securityLogger.error('Error deleting staff member:', error);
    }
  };
  
  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      ACTIVE: 'badge-success',
      INACTIVE: 'badge-warning',
      TERMINATED: 'badge-error',
      ON_LEAVE: 'badge-ghost',
    };
    return variants[status] || 'badge-ghost';
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="card bg-base-100 shadow-lg card-hover">
        <div className="card-body">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="form-control">
                <div className="input-group">
                  <span className="bg-base-200 border border-base-300 rounded-l-lg px-3 flex items-center min-h-[44px]">
                    <Search className="w-5 h-5 text-base-content/70" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search staff members..."
                    className="input input-bordered flex-1 min-h-[44px] rounded-l-none"
                    defaultValue={searchParams.get('search') || ''}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                </div>
              </div>
            </div>
            <select 
              className="select select-bordered min-h-[44px]" 
              defaultValue={searchParams.get('propertyId') || 'all'}
              onChange={(e) => handleFilterChange('propertyId', e.target.value)}
            >
              <option value="all">All Properties</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <select 
              className="select select-bordered min-h-[44px]" 
              defaultValue={searchParams.get('department') || 'all'}
              onChange={(e) => handleFilterChange('department', e.target.value)}
            >
              <option value="all">All Departments</option>
              <option value="Management">Management</option>
              <option value="Front Desk">Front Desk</option>
              <option value="Housekeeping">Housekeeping</option>
              <option value="Kitchen">Kitchen</option>
              <option value="Service">Service</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>
        </div>
      </div>

      {/* Staff Members Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.map((member, index) => (
          <div 
            key={member.id} 
            className="card bg-base-100 shadow-lg card-hover animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="card-body">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="card-title text-lg font-display">
                    {member.firstName} {member.lastName}
                  </h2>
                  <p className="text-sm text-base-content/70">{member.position}</p>
                </div>
                <span className={`badge badge-sm flex-shrink-0 ${getStatusBadge(member.status ?? '')}`}>
                  {member.status ?? ''}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-base-content/50" />
                  <span className="text-sm text-base-content/80">{member.email}</span>
                </div>

                {member.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-base-content/50" />
                    <span className="text-sm text-base-content/80">{member.phone}</span>
                  </div>
                )}

                <div className="flex items-center justify-between p-2 bg-base-200 rounded-lg">
                  <span className="badge badge-outline">{member.department}</span>
                  <span className="text-xs text-base-content/60">
                    Hired {new Date(member.hireDate).toLocaleDateString()}
                  </span>
                </div>

                {member.property && (
                  <div className="text-xs text-base-content/60">
                    Property: <span className="font-medium">{member.property.name}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t gap-2">
                  <div className="flex items-center gap-2">
                    <Link href={`/staff/${member.id}/edit`}>
                      <button className="btn btn-outline btn-sm gentle-lift min-h-[36px]">
                        <Edit className="w-4 h-4" />
                      </button>
                    </Link>
                    <Link href={`/staff/${member.id}/schedule`}>
                      <button className="btn btn-outline btn-sm gentle-lift min-h-[36px]">
                        <Calendar className="w-4 h-4" />
                      </button>
                    </Link>
                  </div>
                  <button
                    className="btn btn-outline btn-sm text-error hover:bg-error/10 gentle-lift min-h-[36px]"
                    onClick={() => deleteStaffMember(member.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {staff.length === 0 && (
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body text-center py-16">
            <div className="w-20 h-20 rounded-full bg-base-200 flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-base-content/40" />
            </div>
            <h3 className="text-xl font-bold font-display mb-2">No staff members found</h3>
            <p className="text-base-content/70 mb-6">
              Get started by adding your first staff member.
            </p>
            <Link href="/staff/new">
              <button className="btn btn-primary gentle-lift min-h-[44px]">
                <Plus className="w-5 h-5 mr-2" />
                Add Staff Member
              </button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
